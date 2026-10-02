# Mermaider

Mermaider is a live Mermaid editor with local Ollama and hosted OpenAI assistance. Create and edit diagrams from code or natural-language descriptions, preview changes, and export the result.

The repository currently remains private while release preparation is completed. Project development is maintained by Jakob Endemann; original application contributions by Dario Novoa are retained and documented in [Attribution](ATTRIBUTION.md).

## Key Characteristics

Mermaider is designed for developers and technical teams who value privacy, speed, and intelligence in their documentation workflow.

- **Provider Choice**: Use Ollama locally by default, or connect the desktop app to OpenAI/Codex with an API key, access token, or Device Code browser login.
- **Local AI Intelligence**: Ollama runs large language models locally on your machine. All diagram generation, fixing, and analysis can remain on your hardware.
- **Privacy-First Architecture**: Ollama requires no cloud account, subscription, or tracking. Diagrams, chat history, and knowledge-base data stay local. Hosted providers are optional; in the web app, selected OpenAI/TypeSafe requests pass through the Mermaider Appwrite service to the provider.
- **Secure Desktop Credentials**: In native builds, OpenAI API keys and OAuth tokens are stored in the operating system credential store (macOS Keychain, Windows Credential Manager, or the Linux keyring), rather than browser local storage.
- **Conversational Diagramming**: An integrated AI chat panel allows you to describe changes in natural language, ask questions about your architecture, or generate complex diagrams from simple prompts.
- **Automated Syntax Fixing**: Real-time syntax validation combined with AI-powered fixing ensures that your diagrams always render correctly. If you have a broken diagram, the AI can analyze and repair it instantly.
- **Advanced Data Conversion**: Import raw JSON data and let Mermaider's AI automatically transform it into structured Mermaid flowcharts or relationship diagrams.
- **Native Performance**: Built with Tauri for a lightweight, high-performance experience. Mermaider is available as a native application for both macOS and Windows, using minimal system resources.
- **Developer-Grade Editor**: Features the Monaco Editor (the engine behind VS Code) with full syntax highlighting, automatic indentation, and a responsive live preview.

## Features

### Intelligent AI Tools
- AI Chat: Generate and edit diagrams using natural language instructions.
- AI Fix: Automatically repair syntax errors in Mermaid code.
- JSON to Mermaid: Convert structured data into visual representations using AI.
- Code Extraction: Automatically detects and extracts Mermaid code blocks from Markdown files.
- Local Knowledge Base (RAG): Index your unstructured text locally to generate context-aware diagrams or detailed AI Reports with source tracking.
- **Custom AI Settings**: Select Ollama or OpenAI, configure endpoints, authentication, temperature, generation depth/complexity, and custom chat and embedding models.
- **OpenAI/Codex Login**: On desktop, authenticate an OpenAI/Codex account through Device Code / Browser login, paste an access token, or use an OpenAI API key. Account-provided Codex models can be loaded from Settings; compatible custom model names may also be entered manually. OpenAI embeddings for RAG require an API key; Codex OAuth users can keep Ollama embeddings.
- **Provider-Aware AI Output**: Ollama retains its existing Mermaid prompt and workflow. OpenAI/Codex uses the same core Mermaid rules with transport-safe output handling that prevents response markers, YAML front matter, and duplicated diagrams from being inserted into the editor.
- **Optional OpenAI Web Search**: Enable web search next to the Local Knowledge Base control in AI Chat to let supported OpenAI/Codex models retrieve current information before generating or editing a diagram. It is off by default; API-key requests switch to the OpenAI Responses API only while enabled. Ollama remains fully local and does not use web search.
- **Auto AI Fix**: Optionally run AI syntax repair automatically whenever Mermaid reports a parsing error.
- MCP Server Integration: Exposes Mermaider's curated diagram templates and code validation logic to external AI assistants (like Claude Desktop) via the Model Context Protocol (`npm run mcp`).

### Professional Editing
- Monaco Editor: Full-featured code editor with syntax highlighting.
- Live Preview: Real-time rendering with debounced updates for smooth performance.
- Syntax Validation: Instant feedback on Mermaid syntax errors.
- Multiple Themes: Support for Slate, Earth, Cosmic, Sage, and Royal Mermaid themes.
- Dark/Light Mode: Application-wide theme support.
- Multiline AI Chat: The chat composer and edited messages expand with their content. Press `Enter` for a line break and `Cmd/Ctrl+Enter` to send.

### File and Data Management
- Import Support: Open .mmd, .txt, .md, and .json files.
- Export Options: Save your work as .mmd code, or export as SVG or PNG images.
- Auto-save: Progress is automatically saved to local storage.
- Drag and Drop: Drop files directly into the editor to load them.

### Cross-Platform Support
- Web Version: Use instantly in any modern browser at [the web app](https://mermaider.appwrite.network/).
- Desktop Application: Native builds for macOS and Windows.

## Getting Started

### Web Version
Visit [the web app](https://mermaider.appwrite.network/) to start creating diagrams immediately. No installation or sign-up is required.

### Desktop Application
Version 1.8.7 is a release candidate. Public installer downloads are not yet enabled; current acceptance and distribution status is tracked in the [release checklist](docs/RELEASE_1.8.7.md). Once a release is published:

1. Download the installer from the [product website](https://mermaider.appwrite.network/website/).
2. For Windows: Run the NSIS installer.
3. For macOS: Open the DMG file and move Mermaider to your Applications folder.

Note: As the application is currently unsigned, you may need to grant permission in your system security settings to run it for the first time.

## Technical Stack

Mermaider is built using modern, efficient technologies:
- Tauri: Lightweight, secure framework for native desktop apps.
- React + TypeScript: Type-safe, component-based user interface.
- Monaco Editor: High-performance code editor.
- Mermaid.js: Industry-standard diagram rendering engine.

## Keyboard Shortcuts

### General
- **New Diagram**: `Cmd+N` (Mac) / `Ctrl+N` (Windows)
- **Open / Import**: `Cmd+O` / `Ctrl+O`
- **Export / Save**: `Cmd+S` / `Ctrl+S`
- **Close Tab**: `Cmd+W` / `Ctrl+W`
- **Toggle Settings**: `Cmd+,` / `Ctrl+,`
- **Toggle Help/Info**: `Cmd+/` / `Ctrl+/`

### UI & Navigation
- **Toggle Editor**: `Cmd+B` / `Ctrl+B` (Hide/Show editor for full preview)
- **Toggle AI Chat**: `Cmd+J` / `Ctrl+J`
- **Focus Chat Input**: `Cmd+L` / `Ctrl+L`

### AI Chat & Editor
- **Toggle Mode**: `Cmd+E` / `Ctrl+E` (Switch between EDIT and ASK)
- **Send Message**: `Cmd+Enter` / `Ctrl+Enter`
- **Undo AI Action**: `Cmd+Shift+R` / `Ctrl+Shift+R` (Undo code change and chat message)
- **Undo Manual Edit**: `Cmd+Z` / `Ctrl+Z`
- **Redo Manual Edit**: `Cmd+Y` / `Ctrl+Y` or `Cmd+Shift+Z`

## Development

See [the project overview and verified status](docs/PROJECT_OVERVIEW.md),
[deployment instructions](docs/DEPLOYMENT.md), and
[the release, website, and live-decision roadmap](docs/ROADMAP.md).
A first Jev/TypeSafe and local Laya decision preview is available through **DECISIONS**. Provider quality and local Laya browser CORS still require acceptance. The protocol and remaining work are described in
[decision providers](docs/DECISION_PROVIDERS.md).

### Prerequisites
- Node.js 20 (see `.nvmrc`)
- Rust and Cargo (for desktop builds)

### Local Setup
```bash
# Install dependencies
npm ci

# Run web version in development mode
npm run dev

# Run desktop version in development mode
npm run tauri:dev
```

### Production Build
```bash
# Build the static web application into dist/
npm run build

# Build web assets and desktop application
npm run tauri:build
```

### Creating Releases
Use the release helper to synchronize versions, validate the build, commit, tag, and push a release:

```bash
node .agents/skills/auto-release/scripts/release.cjs patch
```

Replace `patch` with `minor`, `major`, or an explicit version such as `1.9.0`. The helper runs `cargo check` and `npm run build`, creates a `chore: release vX.Y.Z` commit and tag, and pushes both to GitHub Actions.

## License

Mermaider uses the [MIT License](LICENSE). The project owner confirmed MIT permission for the inherited Dario Novoa contributions on 2026-10-02. Existing third-party notices are retained. See [Attribution](ATTRIBUTION.md) and the [source provenance review](docs/SOURCE_PROVENANCE.md).

---

Mermaider is being prepared for public distribution after the remaining release checks.

### Release checks

With Node 20: `npm ci`, `npm run check:release`, `npm run lint`, `npm test`,
`npm run build`, `npx playwright install chromium`, and `npm run test:e2e`.
Native release checks and remaining gates: [Release stabilization](docs/RELEASE_STABILIZATION.md).

Current release candidate: [1.8.7 deployment and acceptance checklist](docs/RELEASE_1.8.7.md).

Product website and reviewed download configuration: [Website guide](docs/WEBSITE.md).

Direct browser Ollama, hosted OpenAI and Jev/Laya decision setup: [Browser AI setup](docs/BROWSER_AI.md).
