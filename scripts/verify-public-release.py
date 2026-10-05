#!/usr/bin/env python3
"""Read-only verification of public release provenance and installer hashes."""
import argparse
import hashlib
import json
import re
import urllib.request
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('tag')
parser.add_argument('--output', default='public-release-verification.json')
args = parser.parse_args()
if not re.fullmatch(r'v\d+\.\d+\.\d+', args.tag):
    parser.error('Use a version tag such as v1.9.0')
repo = 'Jakende/mermaider'
version = args.tag[1:]
api = 'https://api.github.com/repos/' + repo

def read(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Mermaider-release-verification', 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read(100 * 1024 * 1024)

release = json.loads(read(api + '/releases/tags/' + args.tag))
if release['draft']:
    raise SystemExit('Release is still a draft')
reference = json.loads(read(api + '/git/ref/tags/' + args.tag))['object']
while reference['type'] == 'tag':
    reference = json.loads(read(reference['url']))['object']
if reference['type'] != 'commit':
    raise SystemExit('Tag does not identify a commit')
assets = {asset['name']: asset for asset in release['assets']}
base = 'https://github.com/' + repo + '/releases/download/' + args.tag + '/'
checksums = read(base + 'SHA256SUMS.txt').decode()
expected = {}
for line in checksums.splitlines():
    match = re.fullmatch(r'([a-f0-9]{64})  ([A-Za-z0-9_.-]+)', line)
    if not match or match[2] in expected:
        raise SystemExit('Invalid or duplicate checksum entry')
    expected[match[2]] = match[1]
names = {f'Mermaider_{version}_aarch64.dmg', f'Mermaider_{version}_x64-setup.exe'}
if set(expected) != names:
    raise SystemExit('Expected macOS ARM64 and Windows x64 checksums')
provenance = json.loads(read(base + 'BUILD_PROVENANCE.json'))
if provenance['version'] != version or provenance['desktopCommit'] != reference['sha']:
    raise SystemExit('Release provenance does not match the immutable tag')
verified = []
for name, digest in expected.items():
    data = read(base + name)
    actual = hashlib.sha256(data).hexdigest()
    if actual != digest or len(data) != assets[name]['size']:
        raise SystemExit('Public installer differs from the reviewed checksum: ' + name)
    verified.append({'file': name, 'bytes': len(data), 'sha256': actual, 'assetId': assets[name]['id']})
for name in ('LICENSE', 'ATTRIBUTION.md'):
    if not read(base + name):
        raise SystemExit('Missing license or attribution')
report = {'tag': args.tag, 'sourceCommit': reference['sha'], 'releaseId': release['id'],
          'url': release['html_url'], 'signed': provenance['signed'],
          'anonymousDownloadVerified': True, 'installers': verified}
Path(args.output).write_text(json.dumps(report, indent=2) + '\n')
print('Verified public tag, provenance, license and both installer hashes: ' + release['html_url'])
