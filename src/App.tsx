import { useState, useEffect, useRef, useMemo } from 'react'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import Editor from './components/Editor'
import Preview from './components/Preview'
import Toolbar from './components/Toolbar'
import ChatPanel from './components/ChatPanel'
import TabBar from './components/TabBar'
import ResizableSplitter from './components/ResizableSplitter'
import { extractMermaidCode } from './utils/mermaidCodeBlock'
import type { Tab, ChatSession } from './types'
import './App.css'

const DEFAULT_CODE = 'graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Action 1]\n    B -->|No| D[Action 2]\n    C --> E[End]\n    D --> E'

const createInitialSession = (): ChatSession => ({
  id: Date.now().toString(),
  messages: [{ role: 'assistant', content: 'Hi! I can help you edit or analyze your Mermaid diagram. Choose a mode below!' }],
  timestamp: Date.now()
})

function AppContent() {
  const { theme } = useTheme()

  // Tabs State
  const [tabs, setTabs] = useState<Tab[]>([{
    id: 'initial',
    name: 'diagram',
    code: DEFAULT_CODE,
    chatSessions: [createInitialSession()],
    activeChatSessionId: '' // Will be set in useMemo or useEffect if missing
  }])
  const [activeTabId, setActiveTabId] = useState<string>('initial')

  // Migration and Active Session resolution
  const activeTab = useMemo(() => {
    const tab = tabs.find(t => t.id === activeTabId) || tabs[0]
    if (!tab.activeChatSessionId && tab.chatSessions.length > 0) {
      tab.activeChatSessionId = tab.chatSessions[0].id
    }
    return tab
  }, [tabs, activeTabId])

  const activeSession = useMemo(() => {
    return activeTab.chatSessions.find(s => s.id === activeTab.activeChatSessionId) || activeTab.chatSessions[0]
  }, [activeTab])

  const [error, setError] = useState<string | null>(null)

  // Chat Panel State
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isChatPoppedOut, setIsChatPoppedOut] = useState(false)
  const [chatWidth, setChatWidth] = useState(300)

  const [editorWidth, setEditorWidth] = useState(50) // percentage
  const [isEditorVisible, setIsEditorVisible] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const toolbarRef = useRef<{ handleNew: () => void; handleOpen: () => void; handleSave: () => void }>(null)
  const appContentRef = useRef<HTMLDivElement>(null)

  const setCode = (newCode: string) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, code: newCode } : t))
  }

  const setDiagramName = (newName: string) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, name: newName } : t))
  }

  const handleSendMessage = (role: 'user' | 'assistant', content: string) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? {
      ...t,
      chatSessions: t.chatSessions.map(s => s.id === t.activeChatSessionId ? {
        ...s,
        messages: [...s.messages, { role, content }]
      } : s)
    } : t))
  }

  const handleNewChat = () => {
    const newSession = createInitialSession()
    setTabs(prev => prev.map(t => t.id === activeTabId ? {
      ...t,
      chatSessions: [newSession, ...t.chatSessions],
      activeChatSessionId: newSession.id
    } : t))
  }

  const handleSwitchSession = (sessionId: string) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? {
      ...t,
      activeChatSessionId: sessionId
    } : t))
  }

  const handleNewTab = () => {
    const newId = Date.now().toString()
    const newSession = createInitialSession()
    const newTab: Tab = {
      id: newId,
      name: `diagram-${tabs.length + 1}`,
      code: DEFAULT_CODE,
      chatSessions: [newSession],
      activeChatSessionId: newSession.id
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newId)
  }

  const handleCloseTab = (id: string) => {
    if (tabs.length === 1) return
    const newTabs = tabs.filter(t => t.id !== id)
    setTabs(newTabs)
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id)
    }
  }

  const handleResizeEditor = (clientX: number) => {
    if (appContentRef.current) {
      const { left, width } = appContentRef.current.getBoundingClientRect()
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

  // Load from localStorage and Migration
  useEffect(() => {
    const savedTabs = localStorage.getItem('mermaider-tabs')
    const savedActiveId = localStorage.getItem('mermaider-active-tab')
    if (savedTabs) {
      try {
        let parsed = JSON.parse(savedTabs)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migration logic
          const migrated = parsed.map((tab: any) => {
            if (tab.chatSessions) return tab
            const session: ChatSession = {
              id: 'initial-session-' + tab.id,
              messages: tab.chatHistory || [],
              timestamp: Date.now()
            }
            return {
              ...tab,
              chatSessions: [session],
              activeChatSessionId: session.id
            }
          })
          setTabs(migrated)
        }
      } catch (e) {
        console.error('Failed to parse or migrate saved tabs')
      }
    }
    if (savedActiveId) {
      setActiveTabId(savedActiveId)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('mermaider-tabs', JSON.stringify(tabs))
    localStorage.setItem('mermaider-active-tab', activeTabId)
  }, [tabs, activeTabId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey

      if (modifier && e.key === 'n') {
        e.preventDefault()
        handleNewTab()
      } else if (modifier && e.key === 't') {
        e.preventDefault()
        handleNewTab()
      } else if (modifier && e.key === 'o') {
        e.preventDefault()
        toolbarRef.current?.handleOpen()
      } else if (modifier && e.key === 's') {
        e.preventDefault()
        toolbarRef.current?.handleSave()
      } else if (modifier && e.key === 'w') {
        if (tabs.length > 1) {
          e.preventDefault()
          handleCloseTab(activeTabId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTabId, tabs.length])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || (!file.name.endsWith('.mmd') && !file.name.endsWith('.txt') && !file.name.endsWith('.md'))) {
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const extractedCode = extractMermaidCode(content)
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "")

      const newId = Date.now().toString()
      const newSession = createInitialSession()
      const newTab: Tab = {
        id: newId,
        name: nameWithoutExtension,
        code: extractedCode,
        chatSessions: [{ ...newSession, messages: [{ role: 'assistant', content: `Loaded diagram from ${file.name}` }] }],
        activeChatSessionId: newSession.id
      }
      setTabs(prev => [...prev, newTab])
      setActiveTabId(newId)
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
        code={activeTab.code}
        setCode={setCode}
        error={error}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isEditorVisible={isEditorVisible}
        onToggleEditor={() => setIsEditorVisible(!isEditorVisible)}
        diagramName={activeTab.name}
        onUpdateDiagramName={setDiagramName}
        onNewTab={handleNewTab}
      />

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
      />

      <div className="app-content" ref={appContentRef}>
        <div style={{ display: 'flex', flex: 1, minWidth: 0, position: 'relative' }}>
          {isEditorVisible && (
            <>
              <div style={{ flex: `0 0 ${editorWidth}%`, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Editor code={activeTab.code} setCode={setCode} error={error} onNodeSelected={setSelectedNodeId} />
              </div>
              <ResizableSplitter onResize={handleResizeEditor} />
            </>
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Preview code={activeTab.code} setError={setError} onCodeChange={setCode} targetNodeId={selectedNodeId} />
          </div>

          {isChatOpen && !isChatPoppedOut && (
            <ResizableSplitter onResize={handleResizeChat} />
          )}

          {isChatOpen && !isChatPoppedOut && (
            <div style={{ width: chatWidth }}>
              <ChatPanel
                code={activeTab.code}
                setCode={setCode}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                isPoppedOut={false}
                onTogglePopout={() => setIsChatPoppedOut(true)}
                messages={activeSession.messages}
                onSendMessage={handleSendMessage}
                sessions={activeTab.chatSessions}
                activeSessionId={activeTab.activeChatSessionId}
                onNewChat={handleNewChat}
                onSwitchSession={handleSwitchSession}
              />
            </div>
          )}
        </div>

        {isChatOpen && isChatPoppedOut && (
          <ChatPanel
            code={activeTab.code}
            setCode={setCode}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            isPoppedOut={true}
            onTogglePopout={() => setIsChatPoppedOut(false)}
            messages={activeSession.messages}
            onSendMessage={handleSendMessage}
            sessions={activeTab.chatSessions}
            activeSessionId={activeTab.activeChatSessionId}
            onNewChat={handleNewChat}
            onSwitchSession={handleSwitchSession}
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
