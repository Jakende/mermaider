# Install Mermaider 1.9.0

Download installers only from the official
[release](https://github.com/Jakende/mermaider/releases/tag/v1.9.0).
These builds are unsigned. SHA-256 verifies integrity, not publisher identity.
The owner's earlier practical device acceptance applies to 1.8.7; these are new builds.

## Apple Silicon Mac

Download `Mermaider_1.9.0_aarch64.dmg` and `SHA256SUMS.txt`. In Terminal:

```bash
shasum -a 256 Mermaider_1.9.0_aarch64.dmg
```

Compare the entire hash with the published checksum, open the DMG and drag
Mermaider to Applications. For an unknown-developer warning, review System
Settings → Privacy & Security or use Finder → right-click the app → Open.
Do not disable Gatekeeper globally. This DMG requires an Apple Silicon Mac.

## Windows x64

Download `Mermaider_1.9.0_x64-setup.exe` and `SHA256SUMS.txt`. In PowerShell:

```powershell
Get-FileHash .\Mermaider_1.9.0_x64-setup.exe -Algorithm SHA256
```

Compare the entire checksum before running the installer. Review the unknown
publisher/SmartScreen warning against the official source before proceeding.

## Other platforms

Intel-Mac DMG and Linux AppImage/DEB are separate CI candidates until practical
device acceptance. They do not appear in the regular website download buttons.
Signing/notarization requires the owner's certificates; see [setup](SIGNING_SETUP.md).
