# Mermaider - Documentation & Guide

Mermaider is an advanced, AI-powered Mermaid diagram editor. It focuses on privacy, speed, and ease of use by combining a live preview editor with local AI capabilities.

## Core Features

### Multi-Tab Support
- **Multiple Diagrams**: Open and work on several diagrams simultaneously.
- **Tab Persistence**: All tabs and their contents are saved and restored automatically.
- **Independent Context**: Each tab tracks its own diagram name, Mermaid code, and unique AI chat history.
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
- `⌘N` (Mac) / `Ctrl+N`: New Diagram / New Tab
- `⌘T` / `Ctrl+T`: New Tab
- `⌘W` / `Ctrl+W`: Close Current Tab
- `⌘O` / `Ctrl+O`: Import File (.mmd, .txt, .md, .json)
- `⌘S` / `Ctrl+S`: Export / Save Diagram

## Configuration
You can configure your local Ollama instance in the **Settings** menu. By default, Mermaider looks for Ollama on `http://localhost:11434`.

## Supported Diagrams
- Flowcharts (graph / flowchart)
- Sequence Diagrams
- Class Diagrams
- State Diagrams
- Entity Relationship (ER) Diagrams
- Gantt Charts
- Pie Charts
- Git Graphs
- User Journeys
