# Mermaider - Documentation & Guide

Mermaider is an advanced, AI-powered Mermaid diagram editor. It focuses on privacy, speed, and ease of use by combining a live preview editor with local AI capabilities.

## Core Features

### Live Editor
- **Real-time Preview**: See your changes as you type.
- **Syntax Highlighting**: Built-in support for multiple diagram types.
- **Auto-save**: Your work is automatically saved for your next session.

### AI Assistant (Ollama)
- **Edit Mode**: Instruct the AI to modify your diagram (e.g., "Add a new node called 'Database' and link it to 'Server'").
- **Ask Mode**: Ask questions about your diagram's structure or relationships.
- **AI Fix**: Automatically fix syntax errors with one click.
- **Privacy**: All AI processing happens locally on your machine via Ollama.

### Export & Sharing
- **SVG Export**: High-quality vector graphics.
- **PNG Export**: Standard image format for shareability.
- **Copy Code**: One-click copy for use in GitHub, Markdown, or other tools.

## Keyboard Shortcuts
- `⌘N` (Mac) / `Ctrl+N`: New diagram
- `⌘O` / `Ctrl+O`: Open file (.mmd, .txt, .md)
- `⌘S` / `Ctrl+S`: Save diagram

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
