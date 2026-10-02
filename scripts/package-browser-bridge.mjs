import { copyFileSync } from 'node:fs'
// Ship one standalone file so users do not need a repository checkout or npm install.
copyFileSync('scripts/browser-ai-bridge.mjs', 'dist/website/mermaider-browser-bridge.mjs')
