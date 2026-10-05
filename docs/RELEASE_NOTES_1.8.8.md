# Mermaider 1.8.8

This patch brings the desktop application up to date with the published web workspace.

- The diagram library is accessible from the top toolbar, including name/code search and keyboard navigation.
- The product website is available in English and German with a persistent language switcher. Examples, theme controls, download notices and accessibility labels are translated.
- An explicit English README is available at https://github.com/Jakende/mermaider/blob/main/README.en.md.
- Build manifests use 1.8.8 consistently; the published 1.8.7 tag and installers remain unchanged.

## Downloads and installation

macOS: Apple Silicon / ARM64 DMG. Windows: x64 installer. Both files are unsigned;
no Developer ID notarization or Windows publisher signature is claimed.
Download from this release and compare SHA-256 with `SHA256SUMS.txt` before installation.

macOS: `shasum -a 256 Mermaider_1.8.8_aarch64.dmg`.
Open the DMG and move Mermaider to Applications. Review unknown-developer warnings
in System Settings → Privacy & Security or Finder → right-click → Open.

Windows PowerShell: `Get-FileHash .\Mermaider_1.8.8_x64-setup.exe -Algorithm SHA256`.
Run the installer only after verifying its origin and checksum.

Checksums establish file integrity, not publisher identity. No Intel Mac or Linux installer is offered.
The owner's practical macOS/Windows acceptance covered 1.8.7; it is not a new device test of these files.

## Scope and limitations

Decisions remains a preview; automatic application is opt-in. Hosted OpenAI/Jev access and planning
were previously confirmed qualitatively. Local Laya/CORS, broader model calibration,
signing/notarization and additional platforms remain separate roadmap work.

Web app: https://mermaider.appwrite.network/
English website: https://mermaider.appwrite.network/website/en/
German website: https://mermaider.appwrite.network/website/
