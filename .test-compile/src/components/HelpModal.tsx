import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import DiagramDocsModal from './DiagramDocsModal'
import './HelpModal.css'

interface HelpModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const { theme } = useTheme()
    const [selectedDoc, setSelectedDoc] = useState<{ id: string, name: string } | null>(null)

    if (!isOpen) return null

    const content = [
        { title: 'Live Editor', text: 'Real-time preview and syntax highlighting for all Mermaid diagram types. Changes are saved automatically.' },
        { title: 'AI Assistant', text: 'Use the Chat panel to edit diagrams with natural language or ask questions. Powered by your local Ollama instance for maximum privacy.' },
        { title: 'AI Fix', text: 'Whenever a syntax error occurs, an [AI FIX] button appears. Click it to let the AI resolve the issue automatically.' },
        { title: 'Export Options', text: 'Export your diagrams as high-quality SVG or PNG images, or copy the code block for your documents.' },
        { title: 'Keyboard Shortcuts', text: '⌘N for New, ⌘O for Open, ⌘S for Save.' }
    ]

    const diagrams = [
        { id: 'flowcharts', name: 'Flowcharts' },
        { id: 'sequence', name: 'Sequence' },
        { id: 'class', name: 'Class' },
        { id: 'state', name: 'State' },
        { id: 'er', name: 'ER' },
        { id: 'gantt', name: 'Gantt' },
        { id: 'pie', name: 'Pie' },
        { id: 'gitgraph', name: 'GitGraph' },
        { id: 'userjourney', name: 'User Journey' }
    ]

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className={`help-modal ${theme}`} onClick={(e) => e.stopPropagation()}>
                    <div className="help-header">
                        <h2>About Mermaider</h2>
                        <button className="close-button" onClick={onClose}>
                            [X]
                        </button>
                    </div>

                    <div className="help-content">
                        <p className="help-intro">
                            Mermaider is a privacy-focused, AI-powered Mermaid diagram editor.
                        </p>

                        <div className="help-grid">
                            {content.map((item, i) => (
                                <div key={i} className="help-item">
                                    <h3>{item.title}</h3>
                                    <p>{item.text}</p>
                                </div>
                            ))}
                        </div>

                        <div className="help-section">
                            <h3>Keyboard Shortcuts</h3>
                            <div className="help-shortcuts-grid">
                                <div className="shortcut-category">
                                    <h4>General</h4>
                                    <ul>
                                        <li><span>New Tab</span> <kbd>⌘N</kbd></li>
                                        <li><span>Import</span> <kbd>⌘O</kbd></li>
                                        <li><span>Export</span> <kbd>⌘S</kbd></li>
                                        <li><span>Close Tab</span> <kbd>⌘W</kbd></li>
                                        <li><span>Settings</span> <kbd>⌘,</kbd></li>
                                    </ul>
                                </div>
                                <div className="shortcut-category">
                                    <h4>UI & Navigation</h4>
                                    <ul>
                                        <li><span>Toggle Editor</span> <kbd>⌘B</kbd></li>
                                        <li><span>Toggle Chat</span> <kbd>⌘J</kbd></li>
                                        <li><span>Focus Chat</span> <kbd>⌘L</kbd></li>
                                        <li><span>Toggle Help</span> <kbd>⌘/</kbd></li>
                                    </ul>
                                </div>
                                <div className="shortcut-category">
                                    <h4>AI Chat</h4>
                                    <ul>
                                        <li><span>Send Message</span> <kbd>⌘Enter</kbd></li>
                                        <li><span>Toggle Mode</span> <kbd>⌘E</kbd></li>
                                        <li><span>Undo AI</span> <kbd>⌘⇧R</kbd></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="help-section">
                            <h3>Supported Diagrams (Click to view syntax)</h3>
                            <div className="diagram-tags">
                                {diagrams.map(diag => (
                                    <span
                                        key={diag.id}
                                        onClick={() => setSelectedDoc(diag)}
                                        className="doc-link"
                                    >
                                        {diag.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="help-footer">
                        <button onClick={onClose} className="button-primary">
                            Close
                        </button>
                    </div>
                </div>
            </div>

            <DiagramDocsModal
                isOpen={!!selectedDoc}
                onClose={() => setSelectedDoc(null)}
                diagramId={selectedDoc?.id || ''}
                diagramName={selectedDoc?.name || ''}
            />
        </>
    )
}
