import { useEffect, useRef, useState } from 'react'
import EditorComponent, { loader } from '@monaco-editor/react'
import { useTheme } from '../contexts/ThemeContext'
import { extractMermaidCode } from '../utils/mermaidCodeBlock'
import MermaidConfigPanel from './MermaidConfigPanel'
import './Editor.css'

// Register Mermaid language
// ... (rest of registration logic remains same)
loader.init().then((monaco) => {
  const languageId = 'mermaid'

  // Guard to prevent multiple registrations
  if ((window as any).__mermaid_registered) return
    ; (window as any).__mermaid_registered = true

  monaco.languages.register({ id: languageId })

  monaco.languages.setMonarchTokensProvider(languageId, {
    tokenizer: {
      root: [
        // Diagram type keywords
        [/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitgraph|journey|requirement)/i, 'keyword'],

        // Direction keywords
        [/[TDLR][DB]/, 'keyword'],
        [/LR|RL|TD|BT/, 'keyword'],

        // Node shapes
        [/\[[^\]]*\]/, 'string'],
        [/\([^)]*\)/, 'string'],
        [/\{[^}]*\}/, 'string'],
        [/[<>]/, 'delimiter'],

        // Styling
        [/classDef|style|linkStyle/, 'keyword'],

        // Colors (Hex)
        [/#[A-Fa-f0-9]{3,6}/, 'number.hex'],

        // Arrows
        [/[-.]+>/g, 'operator'],
        [/[-><]+|==[>=]|--/, 'operator'],

        // Config block
        [/%%\{init:.*\}%%/, 'keyword'],

        // Comments
        [/%%.*$/, 'comment'],

        // Identifiers
        [/[a-zA-Z0-9_]+/, 'identifier'],

        // Strings in quotes
        [/"[^"]*"/, 'string'],
        [/('[^']*')/, 'string'],

        // Numbers (non-hex)
        [/\d+/, 'number'],

        // Special characters
        [/[{}[\]]/, 'delimiter.bracket'],
      ]
    }
  })

  // Register Color Provider
  monaco.languages.registerColorProvider(languageId, {
    provideDocumentColors(model: any) {
      if (model.getLanguageId() !== languageId) return []

      const text = model.getValue()
      const colors: any[] = []
      const regex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g
      let match
      while ((match = regex.exec(text)) !== null) {
        const startPos = model.getPositionAt(match.index)
        const endPos = model.getPositionAt(match.index + match[0].length)
        const colorStr = match[1]

        let r, g, b
        if (colorStr.length === 3) {
          r = parseInt(colorStr[0] + colorStr[0], 16) / 255
          g = parseInt(colorStr[1] + colorStr[1], 16) / 255
          b = parseInt(colorStr[2] + colorStr[2], 16) / 255
        } else {
          r = parseInt(colorStr.substring(0, 2), 16) / 255
          g = parseInt(colorStr.substring(2, 4), 16) / 255
          b = parseInt(colorStr.substring(4, 6), 16) / 255
        }

        colors.push({
          range: {
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column
          },
          color: { red: r, green: g, blue: b, alpha: 1 }
        })
      }
      return colors
    },
    provideColorPresentations(_model: any, colorInfo: any) {
      const { red, green, blue } = colorInfo.color
      const r = Math.round(red * 255).toString(16).padStart(2, '0')
      const g = Math.round(green * 255).toString(16).padStart(2, '0')
      const b = Math.round(blue * 255).toString(16).padStart(2, '0')
      const label = `#${r}${g}${b}`
      return [{ label }]
    }
  })


  monaco.languages.setLanguageConfiguration('mermaid', {
    comments: {
      lineComment: '%%'
    },
    brackets: [
      ['[', ']'],
      ['(', ')'],
      ['{', '}']
    ],
    autoClosingPairs: [
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '{', close: '}' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    surroundingPairs: [
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '{', close: '}' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ]
  })
})

interface EditorProps {
  code: string
  setCode: (code: string) => void
  error: string | null
  onNodeSelected?: (nodeId: string | null) => void
  scrollToNode?: string | null
}

export default function Editor({ code, setCode, error, onNodeSelected, scrollToNode }: EditorProps) {
  const { theme } = useTheme()
  const debounceTimer = useRef<NodeJS.Timeout>()
  const editorRef = useRef<any>(null)
  const [showConfig, setShowConfig] = useState(false)

  // Update Monaco editor when code changes externally (e.g., from AI Fix)
  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current
      const model = editor.getModel()
      const currentValue = model.getValue()
      if (currentValue !== code) {
        console.log('Updating Monaco editor with new code (preserving undo stack)')

        // Use pushEditOperations to preserve undo/redo history
        model.pushEditOperations(
          editor.getSelections(),
          [{
            range: model.getFullModelRange(),
            text: code
          }],
          () => null
        )
      }
    }
  }, [code])

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      localStorage.setItem('mermaider-draft', code)
    }, 500)
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [code])

  // Scroll to node when requested from Preview
  useEffect(() => {
    if (!scrollToNode || !editorRef.current) return

    const editor = editorRef.current
    const model = editor.getModel()
    if (!model) return

    // Search for the node ID. We use a regex to find it as a whole word or starting a line
    // Mermaid nodes are often at the start of a line or after spaces/arrows
    const matches = model.findMatches(scrollToNode, true, false, true, null, true)

    if (matches && matches.length > 0) {
      // Prioritize matches that are at the beginning of a line (common for node definitions)
      const bestMatch = matches.find((m: any) => m.range.startColumn === 1 ||
        model.getLineContent(m.range.startLineNumber).substring(0, m.range.startColumn - 1).trim() === '') || matches[0]

      editor.revealRangeInCenterIfOutsideViewport(bestMatch.range)
      editor.setSelection(bestMatch.range)
      // Optional: add a temporary decoration to highlight it
    }
  }, [scrollToNode])

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor

    // Sync selection to Preview
    editor.onDidChangeCursorPosition((e: any) => {
      if (!onNodeSelected) return

      const model = editor.getModel()
      const word = model.getWordAtPosition(e.position)
      if (word && word.word) {
        // Only report if it looks like an identifier
        if (/^[a-zA-Z0-9_-]+$/.test(word.word)) {
          console.log('Cursor at word:', word.word)
          onNodeSelected(word.word)
        } else {
          onNodeSelected(null)
        }
      } else {
        onNodeSelected(null)
      }
    })
  }

  // Set up paste handler once editor is mounted
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const handlePaste = (e: ClipboardEvent) => {
      try {
        const pastedText = e.clipboardData?.getData('text') || ''
        const extractedCode = extractMermaidCode(pastedText)

        // If the pasted text was a code block and we extracted different content
        if (pastedText !== extractedCode) {
          e.preventDefault()
          e.stopPropagation()
          // Replace the entire editor content with the extracted code
          editor.setValue(extractedCode)
          // Update the state
          setCode(extractedCode)
        }
      } catch (err) {
        console.error('Error handling paste:', err)
      }
    }

    const editorContainer = editor.getContainerDomNode()
    if (editorContainer) {
      editorContainer.addEventListener('paste', handlePaste, true)
      return () => {
        editorContainer.removeEventListener('paste', handlePaste, true)
      }
    }
  }, [setCode])

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="header-left">
          <span>Editor</span>
          {error && <span className="error-indicator">⚠️ Syntax Error</span>}
        </div>
        <div className="header-right">
          <button
            className={`config-toggle-btn ${showConfig ? 'active' : ''}`}
            onClick={() => setShowConfig(!showConfig)}
            title="Diagram Configuration"
          >
            Config
          </button>
        </div>
      </div>

      {showConfig && (
        <MermaidConfigPanel
          code={code}
          setCode={setCode}
          onClose={() => setShowConfig(false)}
        />
      )}

      <EditorComponent
        height="100%"
        defaultLanguage="mermaid"
        value={code}
        onChange={(value) => setCode(value || '')}
        onMount={handleEditorDidMount}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          tabSize: 2,
          wordWrap: 'on',
          automaticLayout: true,
          colorDecorators: true,
        }}
      />

    </div>
  )
}

