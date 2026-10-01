import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import './DiagramDocsModal.css'

interface DiagramDocsModalProps {
    isOpen: boolean
    onClose: () => void
    diagramId: string
    diagramName: string
}

export default function DiagramDocsModal({ isOpen, onClose, diagramId, diagramName }: DiagramDocsModalProps) {
    const { theme } = useTheme()
    const [content, setContent] = useState<string>('Loading...')

    useEffect(() => {
        if (isOpen && diagramId) {
            fetch(`/diagram-docs/${diagramId}.md`)
                .then(res => res.text())
                .then(text => {
                    // Remove emojis as requested
                    let cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F30B}-\u{1F30F}\u{1F311}-\u{1F320}\u{1F400}-\u{1F4FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

                    // Basic markdown to simple HTML conversion
                    let html = cleanText
                        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                        .replace(/```mermaid([\s\S]*?)```/g, '<div class="mermaid-code-container"><div class="code-label">MERMAID CODE</div><pre class="mermaid-code">$1</pre></div>')
                        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                        .replace(/`([^`]+)`/g, '<code>$1</code>')
                        .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
                        // No extra <br/> for list items to keep them compact
                        .replace(/<\/li>\n/g, '</li>')
                        .replace(/\n\n/g, '<div class="spacer"></div>')
                        .replace(/\n/g, '<br/>')

                    setContent(html)
                })
                .catch(() => setContent('Failed to load documentation.'))
        }
    }, [isOpen, diagramId])

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`help-modal diagram-docs-modal ${theme}`} onClick={(e) => e.stopPropagation()}>
                <div className="help-header">
                    <h2>{diagramName} Syntax</h2>
                    <button className="close-button" onClick={onClose}>
                        [X]
                    </button>
                </div>

                <div className="help-content docs-content" dangerouslySetInnerHTML={{ __html: content }} />

                <div className="help-footer">
                    <button onClick={onClose} className="button-primary">
                        Back
                    </button>
                </div>
            </div>
        </div>
    )
}
