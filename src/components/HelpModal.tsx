import { useTheme } from '../contexts/ThemeContext'
import './HelpModal.css'

interface HelpModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const { theme } = useTheme()

    if (!isOpen) return null

    const content = [
        { title: 'Live Editor', text: 'Real-time preview and syntax highlighting for all Mermaid diagram types. Changes are saved automatically.' },
        { title: 'AI Assistant', text: 'Use the Chat panel to edit diagrams with natural language or ask questions. Powered by your local Ollama instance for maximum privacy.' },
        { title: 'AI Fix', text: 'Whenever a syntax error occurs, an [AI FIX] button appears. Click it to let the AI resolve the issue automatically.' },
        { title: 'Export Options', text: 'Export your diagrams as high-quality SVG or PNG images, or copy the code block for your documents.' },
        { title: 'Keyboard Shortcuts', text: '⌘N for New, ⌘O for Open, ⌘S for Save.' }
    ]

    return (
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
                        <h3>Supported Diagrams</h3>
                        <div className="diagram-tags">
                            <span>Flowcharts</span>
                            <span>Sequence</span>
                            <span>Class</span>
                            <span>State</span>
                            <span>ER</span>
                            <span>Gantt</span>
                            <span>Pie</span>
                            <span>GitGraph</span>
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
    )
}
