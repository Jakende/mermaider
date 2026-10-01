import { useState, useEffect, useRef, useMemo } from 'react'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import Editor from './components/Editor'
import Preview from './components/Preview'
import Toolbar, { ToolbarRef } from './components/Toolbar'
import ChatPanel, { ChatPanelRef } from './components/ChatPanel'
import TabBar from './components/TabBar'
import ResizableSplitter from './components/ResizableSplitter'
import NewDiagramModal from './components/NewDiagramModal'
import { extractMermaidCode } from './utils/mermaidCodeBlock'
import { getStoredConfig } from './utils/aiService'
import { restoreWorkspace } from './utils/workspaceStorage'
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
  const [initialWorkspace] = useState(() => {
    const session = createInitialSession()
    const fallback: Tab[] = [{ id: 'initial', name: 'diagram', code: DEFAULT_CODE,
      chatSessions: [session], activeChatSessionId: session.id }]
    return restoreWorkspace(window.localStorage, fallback)
  })
  const [tabs, setTabs] = useState<Tab[]>(initialWorkspace.tabs)
  const [activeTabId, setActiveTabId] = useState(initialWorkspace.activeTabId)
  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || tabs[0], [tabs, activeTabId])

  const activeSession = useMemo(() => {
    return activeTab.chatSessions.find(s => s.id === activeTab.activeChatSessionId) || activeTab.chatSessions[0]
  }, [activeTab])

  const [error, setError] = useState<string | null>(null)
  const [isNewDiagramModalOpen, setIsNewDiagramModalOpen] = useState(false)

  // Chat Panel State
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isChatPoppedOut, setIsChatPoppedOut] = useState(false)
  const [chatWidth, setChatWidth] = useState(300)

  const [editorWidth, setEditorWidth] = useState(50) // percentage
  const [isEditorVisible, setIsEditorVisible] = useState(true)
  const [isVisualEditMode, setIsVisualEditMode] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [scrollToNodeId, setScrollToNodeId] = useState<string | null>(null)

  const toolbarRef = useRef<ToolbarRef>(null)
  const chatPanelRef = useRef<ChatPanelRef>(null)
  const appContentRef = useRef<HTMLDivElement>(null)

  // Auto AI Fix when syntax error occurs and autoAIFix toggle is enabled
  const isAutoFixingRef = useRef(false)
  useEffect(() => {
    if (!error) {
      isAutoFixingRef.current = false
      return
    }

    const config = getStoredConfig()
    if (config.autoAIFix && !isAutoFixingRef.current) {
      isAutoFixingRef.current = true
      const timer = setTimeout(() => {
        toolbarRef.current?.handleAIFix()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [error])

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
        messages: [...s.messages, { 
          role, 
          content, 
          // Only store codeBefore for user messages to allow reverting
          codeBefore: role === 'user' ? t.code : undefined 
        }]
      } : s)
    } : t))
  }

  const handleEditMessage = (index: number, _newContent: string) => {
    const tab = tabs.find(t => t.id === activeTabId)
    if (!tab) return

    const session = tab.chatSessions.find(s => s.id === tab.activeChatSessionId)
    if (!session) return

    const messageToEdit = session.messages[index]
    if (!messageToEdit || messageToEdit.role !== 'user') return

    // 1. Revert code to the state before this message
    const revertedCode = messageToEdit.codeBefore || tab.code
    
    // 2. Update session: remove this message and all subsequent ones
    // then we'll add the new one via handleSendMessage in the ChatPanel or here.
    // Actually, it's better to update the history here and then trigger the AI response.
    
    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t
      
      return {
        ...t,
        code: revertedCode, // Revert the code
        chatSessions: t.chatSessions.map(s => {
          if (s.id !== t.activeChatSessionId) return s
          
          // Truncate messages to before the edited one
          return {
            ...s,
            messages: s.messages.slice(0, index)
          }
        })
      }
    }))

    // The ChatPanel will handle re-sending the message since it has the logic for AI calls
    // But we need a way to tell ChatPanel: "Hey, I just reverted, now send this new content"
    // Actually, it might be cleaner if App.tsx just updates the history and ChatPanel reacts.
    // Or ChatPanel calls handleEditMessage which returns the reverted code?
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

  const handleUndoAI = () => {
    const tab = tabs.find(t => t.id === activeTabId)
    if (!tab) return
    const session = tab.chatSessions.find(s => s.id === tab.activeChatSessionId)
    if (!session || session.messages.length < 2) return

    // Find the last user message index
    let lastUserIdx = -1
    for (let i = session.messages.length - 1; i >= 0; i--) {
      if (session.messages[i].role === 'user') {
        lastUserIdx = i
        break
      }
    }

    if (lastUserIdx !== -1) {
      if (confirm('Undo last AI action and revert code?')) {
        handleEditMessage(lastUserIdx, "")
      }
    }
  }

  const handleNewTab = () => {
    setIsNewDiagramModalOpen(true)
  }

  const handleCreateDiagramTab = (code: string, name: string) => {
    setIsNewDiagramModalOpen(false)
    const newId = Date.now().toString()
    const newSession = createInitialSession()
    const newTab: Tab = {
      id: newId,
      name: name && name !== 'untitled' ? name : `diagram-${tabs.length + 1}`,
      code: code !== undefined ? code : DEFAULT_CODE,
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

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mermaider-tabs', JSON.stringify(tabs))
      localStorage.setItem('mermaider-active-tab', activeTabId)
    } catch (error) { console.warn('Workspace could not be saved', error) }
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
      } else if (modifier && e.key === 'b') {
        e.preventDefault()
        setIsEditorVisible(prev => !prev)
      } else if (modifier && e.key === 'j') {
        e.preventDefault()
        setIsChatOpen(prev => !prev)
      } else if (modifier && e.key === 'l') {
        e.preventDefault()
        setIsChatOpen(true)
        setTimeout(() => chatPanelRef.current?.focusInput(), 100)
      } else if (modifier && e.key === 'e') {
        e.preventDefault()
        chatPanelRef.current?.toggleMode()
      } else if (modifier && e.key === ',') {
        e.preventDefault()
        toolbarRef.current?.handleSettings()
      } else if (modifier && e.key === '/') {
        e.preventDefault()
        toolbarRef.current?.handleHelp()
      } else if (modifier && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        handleUndoAI()
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

  // If in Visual Edit mode, hide the editor regardless of isEditorVisible
  const showEditor = isEditorVisible && !isVisualEditMode

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
          {showEditor && (
            <>
              <div style={{ flex: `0 0 ${editorWidth}%`, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Editor 
                  code={activeTab.code} 
                  setCode={setCode} 
                  error={error} 
                  onNodeSelected={setSelectedNodeId} 
                  scrollToNode={scrollToNodeId}
                />
              </div>
              <ResizableSplitter onResize={handleResizeEditor} />
            </>
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Preview 
              code={activeTab.code} 
              setError={setError} 
              onCodeChange={setCode} 
              targetNodeId={selectedNodeId} 
              onNodeClick={(nodeId) => {
                setScrollToNodeId(null) // Reset first to ensure effect triggers
                setTimeout(() => setScrollToNodeId(nodeId), 0)
              }}
              isVisualEditMode={isVisualEditMode}
              onToggleVisualEdit={setIsVisualEditMode}
            />
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
                onEditMessage={handleEditMessage}
                ref={chatPanelRef}
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
            onEditMessage={handleEditMessage}
            ref={chatPanelRef}
          />
        )}
      </div>

      <NewDiagramModal 
        isOpen={isNewDiagramModalOpen} 
        onClose={() => setIsNewDiagramModalOpen(false)} 
        onSelect={handleCreateDiagramTab} 
      />
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
