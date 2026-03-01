# Mermaider

Mermaider is a privacy-first, open-source live AI Mermaid editor that puts power and control back in your hands. By integrating local LLMs via Ollama, it provides a seamless, secure, and completely free environment for creating, editing, and fixing Mermaid diagrams using natural language.

## Key Characteristics

Mermaider is designed for developers and technical teams who value privacy, speed, and intelligence in their documentation workflow.

- **Local AI Intelligence**: Leverages Ollama to run large language models locally on your machine. All AI-driven diagram generation, fixing, and analysis happen on your hardware, ensuring your data never leaves your system.
- **Privacy-First Architecture**: No cloud accounts, no subscriptions, and no tracking. Your diagrams and AI interactions are stored locally in your browser's storage or your filesystem.
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
- Custom AI Settings: Control AI temperature, generation depth/complexity, and select custom models for chat and embeddings directly from the settings panel.

### Professional Editing
- Monaco Editor: Full-featured code editor with syntax highlighting.
- Live Preview: Real-time rendering with debounced updates for smooth performance.
- Syntax Validation: Instant feedback on Mermaid syntax errors.
- Multiple Themes: Support for Slate, Earth, Cosmic, Sage, and Royal Mermaid themes.
- Dark/Light Mode: Application-wide theme support.

### File and Data Management
- Import Support: Open .mmd, .txt, .md, and .json files.
- Export Options: Save your work as .mmd code, or export as SVG or PNG images.
- Auto-save: Progress is automatically saved to local storage.
- Drag and Drop: Drop files directly into the editor to load them.

### Cross-Platform Support
- Web Version: Use instantly in any modern browser at [mermaider.com](https://mermaider.com).
- Desktop Application: Native builds for macOS and Windows.

## Getting Started

### Web Version
Visit [mermaider.com](https://mermaider.com) to start creating diagrams immediately. No installation or sign-up is required.

### Desktop Application
1. Download the latest version from the [GitHub Releases](https://github.com/highvoltag3/mermaider/releases) page.
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
- **New Diagram**: `Cmd+N` (Mac) / `Ctrl+N` (Windws)
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

### Prerequisites
- Node.js 18+
- Rust and Cargo (for desktop builds)

### Local Setup
```bash
# Install dependencies
npm install

# Run web version in development mode
npm run dev

# Run desktop version in development mode
npm run tauri:dev
```

### Production Build
```bash
# Build web assets and desktop application
npm run tauri:build
```

### Pushing and Creating Releases
To push changes and create a new release on GitHub:

1. **Commit and Push Changes**:
   ```bash
   git add .
   git commit -m "Your descriptive commit message"
   git push origin main
   ```

2. **Create a Release Draft** (requires [GitHub CLI](https://cli.github.com/)):
   ```bash
   # Create a release draft with a tag
   gh release create v1.5.0 --draft --title "v1.5.0" --notes "Release notes summary here"
   ```
   *If you don't have the GitHub CLI, you can create a release manually via the GitHub web interface.*

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) license. You are free to share and adapt the material for non-commercial purposes, provided you give appropriate credit.

---

Mermaider is an open-source project dedicated to making technical documentation easier and more private.
