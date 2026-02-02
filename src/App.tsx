import { useState, useEffect, useRef } from 'react'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import Editor from './components/Editor'
import Preview from './components/Preview'
import Toolbar from './components/Toolbar'
import ChatPanel from './components/ChatPanel'
import ResizableSplitter from './components/ResizableSplitter'
import { extractMermaidCode } from './utils/mermaidCodeBlock'
import './App.css'

function AppContent() {
  const { theme } = useTheme()
  const [code, setCode] = useState('graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Action 1]\n    B -->|No| D[Action 2]\n    C --> E[End]\n    D --> E')
  const [error, setError] = useState<string | null>(null)

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isChatPoppedOut, setIsChatPoppedOut] = useState(false)
  const [chatWidth, setChatWidth] = useState(300)

  const [editorWidth, setEditorWidth] = useState(50) // percentage
  const [isEditorVisible, setIsEditorVisible] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [diagramName, setDiagramName] = useState('diagram')

  const toolbarRef = useRef<{ handleNew: () => void; handleOpen: () => void; handleSave: () => void }>(null)
  const appContentRef = useRef<HTMLDivElement>(null)

  const handleResizeEditor = (clientX: number) => {
    if (appContentRef.current) {
      const { left, width } = appContentRef.current.getBoundingClientRect()
      // Calculate available width. If chat is embedded, subtract its current width
      const availableWidth = width - (isChatOpen && !isChatPoppedOut ? chatWidth : 0)
      if (availableWidth <= 0) return

      const newWidth = ((clientX - left) / availableWidth) * 100
      if (newWidth > 10 && newWidth < 90) {
        setEditorWidth(newWidth)
      }
    }
  }

  const handleResizeChat = (clientX: number) => {
    if (appContentRef.current) {
      const { right } = appContentRef.current.getBoundingClientRect()
      const newChatWidth = right - clientX
      if (newChatWidth > 200 && newChatWidth < 600) {
        setChatWidth(newChatWidth)
      }
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('mermaider-draft')
    if (saved) {
      setCode(saved)
    }
    const savedName = localStorage.getItem('mermaider-filename')
    if (savedName) {
      setDiagramName(savedName)
    }
  }, [])

  const handleUpdateDiagramName = (newName: string) => {
    setDiagramName(newName)
    localStorage.setItem('mermaider-filename', newName)
  }

  useEffect(() => {
    localStorage.setItem('mermaider-draft', code)
  }, [code])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        toolbarRef.current?.handleNew()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault()
        toolbarRef.current?.handleOpen()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        toolbarRef.current?.handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || (!file.name.endsWith('.mmd') && !file.name.endsWith('.txt') && !file.name.endsWith('.md'))) {
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      // Extract Mermaid code from potential markdown code blocks
      const extractedCode = extractMermaidCode(content)
      setCode(extractedCode)
      // Set diagram name from dropped file
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "")
      handleUpdateDiagramName(nameWithoutExtension)
    }
    reader.readAsText(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div
      className={`app ${theme}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Toolbar
        ref={toolbarRef}
        code={code}
        setCode={setCode}
        error={error}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isEditorVisible={isEditorVisible}
        onToggleEditor={() => setIsEditorVisible(!isEditorVisible)}
        diagramName={diagramName}
        onUpdateDiagramName={handleUpdateDiagramName}
      />
      <div className="app-content" ref={appContentRef}>
        <div style={{ display: 'flex', flex: 1, minWidth: 0, position: 'relative' }}>
          {isEditorVisible && (
            <>
              <div style={{ flex: `0 0 ${editorWidth}%`, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Editor code={code} setCode={setCode} error={error} onNodeSelected={setSelectedNodeId} />
              </div>
              <ResizableSplitter onResize={handleResizeEditor} />
            </>
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Preview code={code} setError={setError} onCodeChange={setCode} targetNodeId={selectedNodeId} />
          </div>

          {/* Resize handle for Chat if it is OPEN and EMBEDDED */}
          {isChatOpen && !isChatPoppedOut && (
            <ResizableSplitter onResize={handleResizeChat} />
          )}

          {/* Embedded Chat Panel */}
          {isChatOpen && !isChatPoppedOut && (
            <div style={{ width: chatWidth }}>
              <ChatPanel
                code={code}
                setCode={setCode}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                isPoppedOut={false}
                onTogglePopout={() => setIsChatPoppedOut(true)}
              />
            </div>
          )}
        </div>

        {/* Popped Out Chat Panel - Rendered outside the flex flow but inside app-content */}
        {isChatOpen && isChatPoppedOut && (
          <ChatPanel
            code={code}
            setCode={setCode}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            isPoppedOut={true}
            onTogglePopout={() => setIsChatPoppedOut(false)}
          />
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
