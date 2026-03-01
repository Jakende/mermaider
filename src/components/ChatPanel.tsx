import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { editCodeWithAI, askAboutCodeWithAI, getStoredConfig, cleanCode, generateEmbedding } from '../utils/aiService'
import { searchSimilar } from '../utils/vectorStore'
import './ChatPanel.css'

import { ChatMessage, ChatSession } from '../types'

interface ChatPanelProps {
    code: string
    setCode: (code: string) => void
    isOpen: boolean
    onClose: () => void
    onTogglePopout: () => void
    isPoppedOut: boolean
    messages: ChatMessage[]
    onSendMessage: (role: 'user' | 'assistant', content: string) => void
    sessions: ChatSession[]
    activeSessionId: string
    onNewChat: () => void
    onSwitchSession: (id: string) => void
    onEditMessage: (index: number, newContent: string) => void
}

export interface ChatPanelRef {
    focusInput: () => void
    toggleMode: () => void
}

const ChatPanel = forwardRef<ChatPanelRef, ChatPanelProps>((props, ref) => {
    const {
        code,
        setCode,
        isOpen,
        onClose,
        onTogglePopout,
        isPoppedOut,
        messages,
        onSendMessage,
        sessions,
        activeSessionId,
        onNewChat,
        onSwitchSession,
        onEditMessage
    } = props
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [mode, setMode] = useState<'edit' | 'ask'>('edit')
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [showHistory, setShowHistory] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editInput, setEditInput] = useState('')
    const [useKnowledgeBase, setUseKnowledgeBase] = useState(true)

    // Pop-out state
    const [position, setPosition] = useState({ x: 20, y: 50 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const toggleMode = () => {
        setMode(prev => prev === 'edit' ? 'ask' : 'edit')
    }

    useImperativeHandle(ref, () => ({
        focusInput: () => {
            inputRef.current?.focus()
        },
        toggleMode
    }))

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Calculate approx tokens (char count / 4)
    const totalTokens = messages.reduce((acc, m) => acc + m.content.length, 0) / 4 + (input.length / 4)

    const processMessage = async (userMessage: string, contextCode: string, currentMode: 'edit' | 'ask') => {
        setIsLoading(true)
        try {
            const config = getStoredConfig()

            let enhancedContext = contextCode
            if (useKnowledgeBase && currentMode === 'ask') {
                // For edit mode, we could also use it, but it's most useful for 'ask' or generating new things
                // Let's use it for both for now, but label it clearly
            }
            if (useKnowledgeBase) {
                try {
                    const activeSourcesStr = localStorage.getItem('mermaider-active-sources')
                    const activeSources = activeSourcesStr ? JSON.parse(activeSourcesStr) : []
                    const queryEmbedding = await generateEmbedding(userMessage, config)
                    const similarDocs = await searchSimilar(queryEmbedding, 3, activeSources)

                    if (similarDocs.length > 0) {
                        const extraContext = similarDocs.map(d => `[Source: ${d.source}]\n${d.textChunk}`).join('\n\n')
                        enhancedContext = `[CURRENT DIAGRAM CODE]\n${contextCode}\n\n[RELEVANT KNOWLEDGE BASE CONTEXT]\n${extraContext}`
                    }
                } catch (err) {
                    console.error('Vector search failed', err)
                }
            }

            if (currentMode === 'edit') {
                const response = await editCodeWithAI(enhancedContext, userMessage, config)

                // Split explanation and code
                let explanation = 'I have updated the diagram based on your request.'

                if (response.includes('[CODE_START]')) {
                    const startIdx = response.indexOf('[CODE_START]')
                    explanation = response.substring(0, startIdx).trim() || explanation
                } else {
                    // Fallback for explanation if no tag
                    const lines = response.split('\n')
                    const codeStartIdx = lines.findIndex(l =>
                        l.toLowerCase().includes('graph') ||
                        l.toLowerCase().includes('flowchart') ||
                        l.toLowerCase().includes('sequencediagram')
                    )
                    if (codeStartIdx > 0) {
                        explanation = lines.slice(0, codeStartIdx).join('\n').trim()
                    }
                }

                const finalCode = cleanCode(response)
                setCode(finalCode)
                onSendMessage('assistant', explanation)
            } else {
                const response = await askAboutCodeWithAI(enhancedContext, userMessage, config)
                onSendMessage('assistant', response)
            }
        } catch (error) {
            console.error('AI error:', error)
            onSendMessage('assistant', `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        const currentMode = mode
        setInput('')
        onSendMessage('user', userMessage)

        await processMessage(userMessage, code, currentMode)
    }

    const handleEditResend = async (idx: number) => {
        if (!editInput.trim() || isLoading) return

        const userMessage = editInput.trim()
        const messageToEdit = messages[idx]
        const currentMode = mode

        // Store codeBefore for the AI call before we truncate history
        const revertedCode = messageToEdit.codeBefore || code

        setEditingIndex(null)
        setEditInput('')

        // Revert history in App.tsx
        onEditMessage(idx, userMessage)

        // Send new user message and wait for AI
        onSendMessage('user', userMessage)
        await processMessage(userMessage, revertedCode, currentMode)
    }

    const copyToClipboard = (text: string, index: number) => {
        // Strip markdown code block markers as requested
        const cleanedText = text
            .replace(/```mermaid\n?/gi, '')
            .replace(/```\w*\n?/g, '')
            .replace(/```\n?/g, '')
            .trim()

        navigator.clipboard.writeText(cleanedText).then(() => {
            setCopiedIndex(index)
            setTimeout(() => setCopiedIndex(null), 2000)
        })
    }

    // Helper to render basic markdown-ish text (bold, lists, newlines)
    const renderContent = (content: string) => {
        return content.split('\n').map((line, i) => {
            // Very simple markdown replacement
            let processedLine = line
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/^\* (.*)/g, '• $1')
                .replace(/^- (.*)/g, '• $1')
                .replace(/^#+ (.*)/g, '<strong>$1</strong>')

            return (
                <div key={i} dangerouslySetInnerHTML={{ __html: processedLine }} style={{ minHeight: line.trim() === '' ? '0.5em' : 'auto' }} />
            )
        })
    }

    // Dragging logic for pop-out
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isPoppedOut) return

        // Only trigger drag if clicking the header or specific non-interactive parts
        // Best practice: Only drag via the header
        if (!(e.target as HTMLElement).closest('.chat-header')) return
        if ((e.target as HTMLElement).closest('.chat-header-actions')) return

        setIsDragging(true)
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        })
    }

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return
        setPosition({
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
        })
    }, [isDragging, dragOffset])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        } else {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    if (!isOpen) return null

    return (
        <div
            ref={panelRef}
            className={`chat-panel ${isPoppedOut ? 'popped-out' : ''}`}
            style={isPoppedOut ? {
                left: position.x,
                top: position.y,
            } : undefined}
        >
            <div className="chat-header" onMouseDown={handleMouseDown}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3>AI Assistant</h3>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                        Est. Tokens: {Math.round(totalTokens)}
                    </span>
                </div>
                <div className="chat-header-actions">
                    <button
                        className="chat-action-btn"
                        onClick={onNewChat}
                        title="New Chat"
                    >
                        +
                    </button>
                    <button
                        className="chat-action-btn"
                        onClick={() => setShowHistory(!showHistory)}
                        title="History"
                    >
                        {showHistory ? 'BACK' : 'HIST'}
                    </button>
                    <button
                        className="chat-action-btn"
                        onClick={onTogglePopout}
                        title={isPoppedOut ? "Dock" : "Pop out"}
                    >
                        {isPoppedOut ? '↙' : '↗'}
                    </button>
                    <button className="chat-close-btn" onClick={onClose} title="Close">✕</button>
                </div>
            </div>

            {showHistory ? (
                <div className="chat-history-list">
                    <h4>Previous Chats</h4>
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            className={`history-item ${session.id === activeSessionId ? 'active' : ''}`}
                            onClick={() => {
                                onSwitchSession(session.id)
                                setShowHistory(false)
                            }}
                        >
                            <div className="history-item-info">
                                <span className="history-item-date">
                                    {new Date(session.timestamp).toLocaleString()}
                                </span>
                                <span className="history-item-preview">
                                    {session.messages.find(m => m.role === 'user')?.content.substring(0, 40) || 'New Conversation'}...
                                </span>
                            </div>
                            <span className="history-item-count">{session.messages.length} msg</span>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.role}`}>
                                <div className="message-wrapper">
                                    <div className="message-header-actions">
                                        {msg.role === 'user' && editingIndex !== index && (
                                            <button
                                                className="edit-btn"
                                                onClick={() => {
                                                    setEditingIndex(index)
                                                    setEditInput(msg.content)
                                                }}
                                                title="Edit and resend"
                                            >
                                                ✎
                                            </button>
                                        )}
                                        <button
                                            className={`copy-btn ${copiedIndex === index ? 'copied' : ''}`}
                                            onClick={() => copyToClipboard(msg.content, index)}
                                            title="Copy message"
                                        >
                                            {copiedIndex === index ? (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            ) : (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            )}
                                        </button>
                                    </div>
                                    <div className="message-content">
                                        {editingIndex === index ? (
                                            <div className="edit-message-container">
                                                <textarea
                                                    value={editInput}
                                                    onChange={(e) => setEditInput(e.target.value)}
                                                    autoFocus
                                                />
                                                <div className="edit-actions">
                                                    <button className="cancel-btn" onClick={() => setEditingIndex(null)}>Cancel</button>
                                                    <button className="resend-btn" onClick={() => handleEditResend(index)}>Save & Resend</button>
                                                </div>
                                            </div>
                                        ) : (
                                            renderContent(msg.content)
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chat-message assistant">
                                <div className="message-content typing-indicator">
                                    Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-mode-toggle">
                        <button
                            className={`mode-btn ${mode === 'edit' ? 'active' : ''}`}
                            onClick={() => setMode('edit')}
                            type="button"
                        >
                            EDIT
                        </button>
                        <button
                            className={`mode-btn ${mode === 'ask' ? 'active' : ''}`}
                            onClick={() => setMode('ask')}
                            type="button"
                        >
                            ASK
                        </button>
                    </div>

                    <div style={{ padding: '0 12px', marginBottom: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                            type="checkbox"
                            id="use-kb-checkbox"
                            checked={useKnowledgeBase}
                            onChange={(e) => setUseKnowledgeBase(e.target.checked)}
                        />
                        <label htmlFor="use-kb-checkbox" style={{ color: 'var(--muted)', cursor: 'pointer' }}>Use Local Knowledge Base</label>
                    </div>

                    <form className="chat-input-form" onSubmit={handleSubmit}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
                                const modifier = isMac ? e.metaKey : e.ctrlKey
                                if (modifier && e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSubmit(e as any)
                                } else if (modifier && e.key === 'e') {
                                    e.preventDefault()
                                    toggleMode()
                                }
                            }}
                            placeholder={mode === 'edit' ? "e.g., Change all boxes to circles... (⌘Enter)" : "e.g., What is linked to Node A? (⌘Enter)"}
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !input.trim()}>
                            SEND
                        </button>
                    </form>
                </>
            )}
        </div>
    )
})

ChatPanel.displayName = 'ChatPanel'

export default ChatPanel
