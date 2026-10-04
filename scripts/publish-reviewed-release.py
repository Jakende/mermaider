#!/usr/bin/env python3
"""Publish reviewed files and an already-built static site; never start Actions builds."""
import argparse
import base64
import hashlib
import io
import json
import os
from pathlib import Path
import re
import tarfile
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

REPO = 'Jakende/mermaider'
API = 'https://api.github.com'
ENDPOINT = 'https://fra.cloud.appwrite.io/v1'
PROJECT = '6abe2e810023326f2b87'
SITE = '6abe2ff1000fd13c6ca6'
LIVE = 'https://mermaider.appwrite.network'
DESKTOP_COMMIT = '4108f4083e1e8311c37b7672d16f6426ac2bea48'
FILES = {
    'Mermaider_1.8.7_aarch64.dmg': '495d57a39e63ec33051a3ff7f35f223b8523a799826827703d82c4f7143d844c',
    'Mermaider_1.8.7_x64-setup.exe': '5a91addd95246b6da604876d0b2c072ae3d9a6c9b4d26344cc2c88c76b9f3aa9',
}


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if urllib.parse.urlparse(newurl).scheme != 'https':
            raise RuntimeError('Refusing a non-HTTPS redirect')
        redirected = super().redirect_request(req, fp, code, msg, headers, newurl)
        if redirected and urllib.parse.urlparse(req.full_url).netloc != urllib.parse.urlparse(newurl).netloc:
            for key in list(redirected.headers):
                if key.lower() in ('authorization', 'x-appwrite-key', 'x-appwrite-project'):
                    redirected.remove_header(key)
        return redirected


OPENER = urllib.request.build_opener(SafeRedirect())


def request(url, method='GET', value=None, headers=None, raw=None, missing=False):
    payload = raw if raw is not None else (json.dumps(value).encode() if value is not None else None)
    supplied = {'User-Agent': 'Mermaider-reviewed-publication', **(headers or {})}
    if value is not None:
        supplied['Content-Type'] = 'application/json'
    try:
        with OPENER.open(urllib.request.Request(url, data=payload, headers=supplied, method=method), timeout=60) as response:
            body = response.read()
            return json.loads(body) if 'json' in response.headers.get('Content-Type', '') else body
    except urllib.error.HTTPError as error:
        if missing and error.code == 404:
            return None
        # Do not dump headers, credential values or arbitrary service response bodies.
        raise RuntimeError(f'{method} {urllib.parse.urlparse(url).path}: HTTP {error.code}') from None


def validate_bundle(folder):
    for name, expected in FILES.items():
        if hashlib.sha256((folder / name).read_bytes()).hexdigest() != expected:
            raise RuntimeError(f'Installer checksum mismatch: {name}')
    expected_sums = ''.join(f'{digest}  {name}\n' for name, digest in FILES.items())
    if (folder / 'SHA256SUMS.txt').read_text() != expected_sums:
        raise RuntimeError('Checksum manifest mismatch')
    for name in ('RELEASE_NOTES.md', 'BUILD_PROVENANCE.json', 'LICENSE', 'ATTRIBUTION.md', 'web/index.html', 'web/website/index.html'):
        if not (folder / name).is_file():
            raise RuntimeError(f'Missing publication file: {name}')
    metadata = json.loads((folder / 'BUILD_PROVENANCE.json').read_text())
    if metadata['desktopCommit'] != DESKTOP_COMMIT or metadata['version'] != '1.8.7':
        raise RuntimeError('Bundle source/version mismatch')
    if not re.fullmatch(r'[0-9a-f]{40}', metadata.get('repositoryCommit', '')):
        raise RuntimeError('Bundle must identify the finalized main commit')
    web = folder / 'web'
    expected_files = metadata['webFiles']
    if set(expected_files) != {str(path.relative_to(web)) for path in web.rglob('*') if path.is_file()}:
        raise RuntimeError('Web bundle file list differs from the reviewed build')
    for name, digest in expected_files.items():
        path = web / name
        if path.is_symlink() or (name != 'website/release.json' and hashlib.sha256(path.read_bytes()).hexdigest() != digest):
            raise RuntimeError(f'Web build integrity check failed: {name}')
    make_archive(web)
    print('Reviewed installers, checksum manifest and built web bundle verified.', flush=True)


def make_archive(web):
    archive = io.BytesIO()
    with tarfile.open(fileobj=archive, mode='w:gz') as tar:
        for path in sorted(web.rglob('*')):
            if path.is_symlink():
                raise RuntimeError('Unexpected symlink in web bundle')
            if path.is_file():
                tar.add(path, arcname=path.relative_to(web))
    code = archive.getvalue()
    if len(code) > 5 * 1024 * 1024:
        raise RuntimeError('Web archive requires a chunked upload; use Appwrite CLI')
    return code


def publish(folder):
    validate_bundle(folder)
    if not os.environ.get('GH_TOKEN') or not os.environ.get('APPWRITE_API_KEY'):
        raise RuntimeError('Configure GH_TOKEN and APPWRITE_API_KEY as secrets before publishing')
    gh_headers = {'Authorization': 'Bearer ' + os.environ['GH_TOKEN'], 'Accept': 'application/vnd.github+json'}
    aw_headers = {'X-Appwrite-Project': PROJECT, 'X-Appwrite-Key': os.environ['APPWRITE_API_KEY']}
    base = API + '/repos/' + REPO
    state_file = folder / 'publication-state.json'
    state = json.loads(state_file.read_text()) if state_file.exists() else {'completed': False, 'pausedWorkflows': []}

    def save(**updates):
        state.update(updates)
        state_file.write_text(json.dumps(state, indent=2) + '\n')

    def gh(path='', method='GET', value=None, missing=False):
        return request(base + path, method, value, gh_headers, missing=missing)

    repo = gh()
    if not repo.get('permissions', {}).get('admin'):
        raise RuntimeError('Repository administration permission is required for public visibility')
    # Confirm Appwrite access before changing repository visibility or release state.
    request(ENDPOINT + '/sites/' + SITE, headers=aw_headers)
    metadata = json.loads((folder / 'BUILD_PROVENANCE.json').read_text())
    current_main = gh('/git/ref/heads/main')['object']['sha']
    if current_main not in (metadata['repositoryCommit'], state.get('manifestCommit')):
        raise RuntimeError('Main has changed since bundle review; prepare an updated bundle before publication')
    tag = gh('/git/ref/tags/v1.8.7', missing=True)
    if tag:
        obj = tag['object']
        while obj['type'] == 'tag':
            obj = gh('/git/tags/' + obj['sha'])['object']
        if obj['sha'] != DESKTOP_COMMIT:
            raise RuntimeError('Existing v1.8.7 tag points to another source; it will not be rewritten')
    releases = [item for item in gh('/releases?per_page=100') if item['tag_name'] == 'v1.8.7']
    if len(releases) > 1:
        raise RuntimeError('Multiple v1.8.7 releases exist; resolve them before publication')
    release = releases[0] if releases else None
    if release and release['target_commitish'] not in (DESKTOP_COMMIT, '4108f40') and not tag:
        raise RuntimeError('Existing release does not identify the reviewed source')

    workflows = gh('/actions/workflows?per_page=100')['workflows']
    for workflow in workflows:
        if workflow['state'] == 'active':
            entry = {'id': workflow['id'], 'name': workflow['name']}
            if not any(item['id'] == entry['id'] for item in state['pausedWorkflows']):
                save(pausedWorkflows=[*state['pausedWorkflows'], entry])
            gh(f"/actions/workflows/{workflow['id']}/disable", 'PUT')
            for item in state['pausedWorkflows']:
                if item['id'] == entry['id']:
                    item['disabled'] = True
            save()
    print('Actions paused for the exhausted budget; no builds will be started.', flush=True)

    if not release:
        release = gh('/releases', 'POST', {'tag_name': 'v1.8.7', 'target_commitish': DESKTOP_COMMIT,
            'name': 'Mermaider 1.8.7', 'draft': True, 'prerelease': False, 'body': (folder / 'RELEASE_NOTES.md').read_text()})
    save(releaseId=release['id'], releaseUrl=release['html_url'])
    attachments = list(FILES) + ['SHA256SUMS.txt', 'BUILD_PROVENANCE.json', 'LICENSE', 'ATTRIBUTION.md']
    for name in attachments:
        data = (folder / name).read_bytes()
        digest = 'sha256:' + hashlib.sha256(data).hexdigest()
        existing = next((asset for asset in release['assets'] if asset['name'] == name), None)
        if existing:
            if existing.get('digest') != digest or existing['size'] != len(data):
                raise RuntimeError(f'Existing release asset differs: {name}; no asset will be overwritten')
        else:
            if not release['draft']:
                raise RuntimeError('Published release is missing assets; it will not be modified')
            url = f"https://uploads.github.com/repos/{REPO}/releases/{release['id']}/assets?name={urllib.parse.quote(name)}"
            asset = request(url, 'POST', headers={**gh_headers, 'Content-Type': 'application/octet-stream'}, raw=data)
            if asset.get('digest') != digest or asset['size'] != len(data):
                raise RuntimeError(f'Uploaded asset integrity check failed: {name}')
    if repo['private']:
        gh('', 'PATCH', {'visibility': 'public'})
    if release['draft']:
        release = gh('/releases/' + str(release['id']), 'PATCH', {'draft': False, 'body': (folder / 'RELEASE_NOTES.md').read_text()})
    else:
        release = gh('/releases/' + str(release['id']))
    if request(base).get('private') or request(base + '/releases/tags/v1.8.7').get('draft'):
        raise RuntimeError('Anonymous repository/release access could not be confirmed')
    assets = {asset['name']: asset for asset in release['assets']}
    for name in FILES:
        # Anonymous download and digest verify public access and uploaded bytes.
        data = request(assets[name]['browser_download_url'])
        if not isinstance(data, bytes) or hashlib.sha256(data).hexdigest() != FILES[name]:
            raise RuntimeError(f'Public installer download failed integrity verification: {name}')
    save(repositoryPublic=True, releasePublished=True)
    config = {'version': '1.8.7', 'published': True, 'notesUrl': release['html_url'],
        'macos': {'url': assets['Mermaider_1.8.7_aarch64.dmg']['browser_download_url'], 'signed': False},
        'windows': {'url': assets['Mermaider_1.8.7_x64-setup.exe']['browser_download_url'], 'signed': False}}
    text = json.dumps(config, indent=2) + '\n'
    (folder / 'web/website/release.json').write_text(text)
    file = gh('/contents/public/website/release.json?ref=main')
    if base64.b64decode(file['content']).decode() != text:
        updated = gh('/contents/public/website/release.json', 'PUT', {'branch': 'main', 'sha': file['sha'],
            'message': 'Publish reviewed 1.8.7 download links [skip ci]', 'content': base64.b64encode(text.encode()).decode()})
        save(manifestCommit=updated['commit']['sha'])

    code = make_archive(folder / 'web')
    boundary = 'mermaider-' + uuid.uuid4().hex
    parts = []
    for key, value in {'installCommand': 'true', 'buildCommand': 'true', 'outputDirectory': '.', 'activate': 'true'}.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode())
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="code"; filename="code.tar.gz"\r\nContent-Type: application/gzip\r\n\r\n'.encode() + code + b'\r\n')
    parts.append(f'--{boundary}--\r\n'.encode())
    upload = request(ENDPOINT + '/sites/' + SITE + '/deployments', 'POST',
        headers={**aw_headers, 'Content-Type': 'multipart/form-data; boundary=' + boundary}, raw=b''.join(parts))
    deployment_id = upload['$id']
    save(siteDeploymentId=deployment_id)
    for _ in range(120):
        deployment = request(ENDPOINT + '/sites/' + SITE + '/deployments/' + deployment_id, headers=aw_headers)
        print('Appwrite site deployment: ' + deployment['status'], flush=True)
        if deployment['status'] in ('failed', 'canceled'):
            raise RuntimeError('Appwrite build failed; inspect the deployment in the project console')
        if deployment['status'] == 'ready':
            break
        time.sleep(5)
    else:
        raise RuntimeError('Appwrite deployment did not become ready within ten minutes')
    site = request(ENDPOINT + '/sites/' + SITE, headers=aw_headers)
    if site['deploymentId'] != deployment_id:
        raise RuntimeError('New Appwrite deployment is not active')
    local_index = (folder / 'web/index.html').read_text()
    expected_scripts = re.findall(r'src="([^"]+\.js)"', local_index)
    live_index = request(LIVE + '/').decode()
    if not expected_scripts or any(script not in live_index for script in expected_scripts):
        raise RuntimeError('The public app is not serving the prepared web build')
    live_config = request(LIVE + '/website/release.json')
    if live_config != config:
        raise RuntimeError('Live download manifest differs from the verified release')
    save(completed=True, webDeployed=True)
    print('Public repository, reviewed release assets and Appwrite web deployment verified.', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument('--publish', action='store_true', help='Perform the authorized external publication')
    args = parser.parse_args()
    try:
        publish(args.bundle) if args.publish else validate_bundle(args.bundle)
    except (RuntimeError, OSError, ValueError, KeyError) as error:
        raise SystemExit(str(error)) from None
