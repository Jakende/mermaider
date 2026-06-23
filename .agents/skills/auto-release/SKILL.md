---
name: auto-release
description: Automates the version bumping, configuration sync, build verification, and git tag/push flow to release a new build via GitHub Actions.
---

# Auto-Release Skill

This skill provides an automated utility to release new versions of the application, ensuring that version configuration files are synchronized, builds are validated locally first to prevent CI failures, and git tags are pushed correctly to trigger the GitHub Actions release workflow.

## Version Files Handled
The release utility automatically updates the version number in the following locations:
- `package.json`
- `package-lock.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock` (automatically via `cargo check`)

## How to Run a Release

1. **Verify your working directory is clean**: The script will check this, but ensure you don't have uncommitted edits you don't want in the release.
2. **Execute the release script**:
   Run the helper script with the desired bump type (`patch`, `minor`, `major`) or a specific version string (e.g. `1.8.2`):

   ```bash
   node .agents/skills/auto-release/scripts/release.cjs [patch|minor|major|X.Y.Z]
   ```

   - **Default**: If no argument is provided, the script will check if the current version in `package.json` has already been tagged. If not, it will release the current version directly. If it has, it defaults to a `patch` bump.
   
3. **Automated Verification**:
   The script will:
   - Synchronize versions across all manifests.
   - Run `cargo check` to update `Cargo.lock`.
   - Run `npm run build` to verify the frontend compiles successfully.
   - Commit all changes as `chore: release vX.Y.Z`.
   - Create a git tag `vX.Y.Z`.
   - Push the commits and tag to the remote repository.

## GitHub Actions Trigger
Once the tag is pushed to GitHub, the `.github/workflows/release.yml` workflow is automatically triggered to build and release the desktop app binaries for macOS and Windows.
