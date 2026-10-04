# Contributing to Mermaider

Mermaider uses React/TypeScript and Tauri. Contributions use MIT; retain existing
copyright and dependency notices. Please describe the concrete behavior being
changed and keep proposals focused.

Use Node 20 (see `.nvmrc`), then `npm ci` and `npm run dev` for the web app.
Native development additionally needs Rust and the Tauri prerequisites for the
chosen platform; run `npm run tauri:dev`.

For application changes run `npm run check:release`, `npm run lint`, `npm test`
and `npm run build`. Run relevant Playwright cases against the resulting web
build (`npx playwright install chromium webkit`, `npm run test:e2e`). Native or
credential-storage changes require the relevant platform check. Documentation
changes need link and diff checks; do not rebuild installers for documentation.

Report a reproducible issue with platform/browser, steps, expected behavior and
actual behavior. Do not include API keys, tokens or personal decision content.
For UI changes include the affected viewport and a screenshot when useful.

See [workspace behavior](WORKSPACE_UI.md), [decision architecture](DYNAMIC_DECISIONS.md)
and [roadmap](ROADMAP.md). Current supported installers are macOS Apple Silicon
and Windows x64. Intel-Mac/Linux builds and signing are future work.

Automated Actions currently require available project budget. Follow the manual
publication handoff for 1.8.7; do not push a release tag expecting a free rebuild.
