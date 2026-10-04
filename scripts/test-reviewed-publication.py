#!/usr/bin/env python3
"""Offline checks for publication integrity and credential handling."""
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.request import Request

spec = importlib.util.spec_from_file_location('publication', Path(__file__).with_name('publish-reviewed-release.py'))
publication = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publication)


class PublicationChecks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        digest = hashlib.sha256(b'reviewed installer').hexdigest()
        self.files_patch = patch.object(publication, 'FILES', {'reviewed.dmg': digest})
        self.files_patch.start()
        self.addCleanup(self.files_patch.stop)
        (self.folder / 'reviewed.dmg').write_bytes(b'reviewed installer')
        (self.folder / 'SHA256SUMS.txt').write_text(f'{digest}  reviewed.dmg\n')
        for name in ('RELEASE_NOTES.md', 'LICENSE', 'ATTRIBUTION.md', 'web/index.html', 'web/website/index.html', 'web/website/release.json'):
            path = self.folder / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('{}' if name.endswith('.json') else 'reviewed content')
        metadata = {'version': '1.8.7', 'desktopCommit': publication.DESKTOP_COMMIT,
                    'repositoryCommit': 'a' * 40,
                    'webFiles': {str(path.relative_to(self.folder / 'web')): hashlib.sha256(path.read_bytes()).hexdigest()
                                 for path in (self.folder / 'web').rglob('*') if path.is_file()}}
        (self.folder / 'BUILD_PROVENANCE.json').write_text(json.dumps(metadata))

    def test_local_validation_has_no_network_calls(self):
        with patch.object(publication, 'request') as network:
            publication.validate_bundle(self.folder)
        network.assert_not_called()

    def test_changed_installer_or_web_build_stops_before_network(self):
        for name in ('reviewed.dmg', 'web/index.html'):
            with self.subTest(name=name):
                path = self.folder / name
                original = path.read_bytes()
                path.write_bytes(b'changed after review')
                with patch.object(publication, 'request') as network:
                    with self.assertRaisesRegex(RuntimeError, 'checksum mismatch|integrity check failed'):
                        publication.publish(self.folder)
                network.assert_not_called()
                path.write_bytes(original)

    def test_changed_main_stops_before_any_external_mutation(self):
        def response(url, method='GET', *args, **kwargs):
            self.assertEqual(method, 'GET')
            if url.endswith('/git/ref/heads/main'):
                return {'object': {'sha': 'b' * 40}}
            if url.startswith(publication.ENDPOINT):
                return {'$id': publication.SITE}
            return {'permissions': {'admin': True}, 'private': True}
        with patch.dict(publication.os.environ, {'GH_TOKEN': 'offline-test-only', 'APPWRITE_API_KEY': 'offline-test-only'}):
            with patch.object(publication, 'request', side_effect=response) as network:
                with self.assertRaisesRegex(RuntimeError, 'Main has changed'):
                    publication.publish(self.folder)
        self.assertEqual(network.call_count, 3)

    def test_redirects_strip_credentials_only_when_host_changes(self):
        for target, keep_credentials in (
            ('https://api.github.com/another-path', True),
            ('https://release-assets.githubusercontent.com/asset', False),
        ):
            with self.subTest(target=target):
                request = Request('https://api.github.com/asset', headers={
                    'Authorization': 'offline-test-only', 'X-Appwrite-Key': 'offline-test-only',
                    'X-Appwrite-Project': publication.PROJECT})
                redirect = publication.SafeRedirect().redirect_request(request, None, 302, '', {}, target)
                keys = {key.lower() for key in redirect.headers}
                for key in ('authorization', 'x-appwrite-key', 'x-appwrite-project'):
                    self.assertEqual(key in keys, keep_credentials)
        with self.assertRaisesRegex(RuntimeError, 'non-HTTPS'):
            publication.SafeRedirect().redirect_request(Request('https://api.github.com/asset'), None, 302, '', {}, 'http://example.com/')


if __name__ == '__main__':
    unittest.main()
