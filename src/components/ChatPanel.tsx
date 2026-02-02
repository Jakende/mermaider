import React, { useState, useRef, useEffect, useCallback } from 'react'
import { editCodeWithAI, askAboutCodeWithAI, getStoredConfig, cleanCode } from '../utils/aiService'
import './ChatPanel.css'

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

interface ChatPanelProps {
    code: string
    setCode: (code: string) => void
    isOpen: boolean
    onClose: () => void
    onTogglePopout: () => void
    isPoppedOut: boolean
}

export default function ChatPanel({
    code,
    setCode,
    isOpen,
    onClose,
    onTogglePopout,
    isPoppedOut
}: ChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Hi! I can help you edit or analyze your Mermaid diagram. Choose a mode below!' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [mode, setMode] = useState<'edit' | 'ask'>('edit')
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

    // Pop-out state
    const [position, setPosition] = useState({ x: 20, y: 20 })
    const [size] = useState({ width: 350, height: 500 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Calculate approx tokens (char count / 4)
    const totalTokens = messages.reduce((acc, m) => acc + m.content.length, 0) / 4 + (input.length / 4)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        const currentMode = mode
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setIsLoading(true)

        try {
            const config = getStoredConfig()

            if (currentMode === 'edit') {
                const response = await editCodeWithAI(code, userMessage, config)

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
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: explanation
                }])
            } else {
                const response = await askAboutCodeWithAI(code, userMessage, config)
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response
                }])
            }
        } catch (error) {
            console.error('AI error:', error)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }])
        } finally {
            setIsLoading(false)
        }
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
        if ((e.target as HTMLElement).closest('.chat-input-form') || (e.target as HTMLElement).closest('.chat-messages')) return

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
                width: size.width,
                height: size.height
            } : undefined}
            onMouseDown={handleMouseDown}
        >
            <div className="chat-header">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3>AI Assistant</h3>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                        Est. Tokens: {Math.round(totalTokens)}
                    </span>
                </div>
                <div className="chat-header-actions">
                    <button
                        className="chat-action-btn"
                        onClick={onTogglePopout}
                        title={isPoppedOut ? "Dock to side" : "Pop out window"}
                    >
                        {isPoppedOut ? '[DOCK]' : '[POP]'}
                    </button>
                    <button className="chat-close-btn" onClick={onClose}>[X]</button>
                </div>
            </div>

            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}`}>
                        <div className="message-wrapper">
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
                            <div className="message-content">
                                {renderContent(msg.content)}
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
                    [EDIT]
                </button>
                <button
                    className={`mode-btn ${mode === 'ask' ? 'active' : ''}`}
                    onClick={() => setMode('ask')}
                    type="button"
                >
                    [ASK]
                </button>
            </div>

            <form className="chat-input-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={mode === 'edit' ? "e.g., Change all boxes to circles..." : "e.g., What is linked to Node A?"}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()}>
                    [SEND]
                </button>
            </form>
        </div>
    )
}
