# Mermaider - Documentation & Guide

Mermaider is an advanced, AI-powered Mermaid diagram editor. It focuses on privacy, speed, and ease of use by combining a live preview editor with local AI capabilities.

## Core Features

### Multi-Tab Support
- **Multiple Diagrams**: Open and work on several diagrams simultaneously.
- **Tab Persistence**: All tabs and their contents are saved and restored automatically.
- **Independent Context**: Each tab tracks its own diagram name, Mermaid code, and unique AI chat history.
- **Diagram Selection Modal**: Creating a new tab prompts you to select from a rich library of Core and Advanced diagrams, pre-filling the editor with a matching template.
- **Import to New Tab**: Dropping or importing files automatically creates a new workspace.

### AI Assistant (Ollama)
- **Edit Mode**: Instruct the AI to modify your diagram (e.g., "Add a new node called 'Database' and link it to 'Server'").
- **Ask Mode**: Ask questions about your diagram's structure or relationships.
- **AI Fix**: Automatically fix syntax errors with one click.
- **Persistent History**: Your conversation history is preserved within each tab, even when docking or popping out the chat panel.
- **Privacy**: All AI processing happens locally on your machine via Ollama.

### Export & Sharing
- **SVG Export**: High-quality vector graphics.
- **PNG Export**: Standard image format for shareability.
- **MMD Export**: Save the raw Mermaid source file.
- **Copy Code**: One-click copy for use in GitHub, Markdown, or other tools.

## Keyboard Shortcuts
- `⌘N` (Mac) / `Ctrl+N`: New Diagram / New Tab (Opens diagram selection modal)
- `⌘T` / `Ctrl+T`: New Tab (Opens diagram selection modal)
- `⌘W` / `Ctrl+W`: Close Current Tab
- `⌘O` / `Ctrl+O`: Import File (.mmd, .txt, .md, .json)
- `⌘S` / `Ctrl+S`: Export / Save Diagram

## Configuration
You can configure your local Ollama instance in the **Settings** menu. By default, Mermaider looks for Ollama on `http://localhost:11434`.

## Supported Diagrams
Mermaider supports 17 diagram types categorized into Core and Advanced:

### Core Diagrams
- Flowcharts (graph / flowchart)
- Sequence Diagrams
- Class Diagrams
- State Diagrams
- Entity Relationship (ER) Diagrams
- Gantt Charts
- Pie Charts
- Requirement Diagrams
- Git Graphs
- C4 Diagrams

### Advanced / Specialized Diagrams
- Mindmaps
- Timelines
- User Journeys
- Quadrant Charts
- Sankey Diagrams
- XY Charts
- Block Diagrams

## MCP (Model Context Protocol) Integration
Mermaider includes a built-in MCP layer that is **always active** and automatically enhances every AI interaction:

### Automatic In-App Integration
The MCP service runs inside the application — no separate server or setup required. Every time Ollama is called (Edit, Ask, Fix, Generate, Report), the MCP layer:
- **Enriches the system prompt** with the full catalog of 17 supported Mermaid diagram types and their syntax references.
- **Provides syntax templates** for the currently detected diagram type so the AI produces correct output.
- **Post-validates** AI-generated code and auto-fixes common issues (e.g., stripping markdown fences, replacing deprecated `graph` with `flowchart`).

### Standalone MCP Server (for external agents)
Mermaider also exposes a standalone MCP server for external AI agents (like Claude Desktop, Cursor, or other MCP-compatible clients):
```bash
npm run mcp
```
This provides tools to list supported diagram types, retrieve starting templates, and perform basic mermaid syntax validation via the standard MCP stdio transport.
