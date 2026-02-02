# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automating development and release processes for Mermaider.

## Workflows

### Release Workflow (`release.yml`)
This workflow automatically creates GitHub releases and builds native desktop applications for macOS and Windows when version tags are pushed.

- Trigger: Version tags (e.g., v1.2.0)
- Platforms: macOS (DMG) and Windows (NSIS Installer)
- Output: Draft release containing installation bundles

### Appwrite Deployment (`deploy-appwrite.yml`)
Automates the build and deployment of the Mermaider web application to Appwrite Sites.

- Trigger: Pushes to the main branch or feature/appwrite-sites branch
- Requirements: Requires configuration of Appwrite API keys and project identifiers

## Required Secrets

To enable automated deployments, the following encrypted secrets must be configured in your GitHub repository:

1. APPWRITE_API_KEY: API key with Sites deployment permissions.
2. APPWRITE_PROJECT_ID: Your Appwrite project identifier.
3. APPWRITE_SITE_ID: The specific Site ID for Mermaider.
4. APPWRITE_ENDPOINT: (Optional) Your custom Appwrite endpoint.

## Deployment Environment Variables

The following variables can be configured to control build-time features:

- VITE_APP_NAME: Overrides the default application name.
- VITE_APP_VERSION: Overrides the version display.
- VITE_ENABLE_AI_FIXER: Enables or disables the AI-powered syntax fixer.

Note: Sensitive configuration should be handled client-side through application settings.

## Troubleshooting

### Build Failures
- Ensure Node.js 20 or higher is used in the workflow.
- Verify that all dependencies are correctly locked in package-lock.json.
- Check the Rust toolchain version for Tauri platform builds.

### Deployment Failures
- Confirm that the Site ID and Project ID match your Appwrite console configuration.
- Verify that the API key has the necessary site.write permissions.
- Ensure the build output directory (dist) contains a valid index.html file.
