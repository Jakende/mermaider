import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import './ExportModal.css'

interface ExportModalProps {
    isOpen: boolean
    onClose: () => void
    onExport: (filename: string, format: 'svg' | 'png' | 'mmd') => void
    defaultFilename: string
}

export default function ExportModal({ isOpen, onClose, onExport, defaultFilename }: ExportModalProps) {
    const { theme } = useTheme()
    const [filename, setFilename] = useState(defaultFilename || 'diagram')
    const [format, setFormat] = useState<'svg' | 'png' | 'mmd'>('svg')

    useEffect(() => {
        if (isOpen) {
            setFilename(defaultFilename || 'diagram')
        }
    }, [isOpen, defaultFilename])

    const handleExport = () => {
        if (!filename.trim()) {
            alert('Please enter a filename')
            return
        }
        onExport(filename.trim(), format)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`export-modal ${theme}`} onClick={(e) => e.stopPropagation()}>
                <div className="export-header">
                    <h2>Export Diagram</h2>
                    <button className="close-button" onClick={onClose}>
                        [X]
                    </button>
                </div>

                <div className="export-content">
                    <div className="export-field">
                        <label htmlFor="filename">Filename</label>
                        <input
                            id="filename"
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            placeholder="Enter filename..."
                            className="export-input"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleExport()
                            }}
                        />
                    </div>

                    <div className="export-field">
                        <label>Format</label>
                        <div className="format-options">
                            <button
                                className={`format-btn ${format === 'svg' ? 'active' : ''}`}
                                onClick={() => setFormat('svg')}
                            >
                                SVG
                            </button>
                            <button
                                className={`format-btn ${format === 'png' ? 'active' : ''}`}
                                onClick={() => setFormat('png')}
                            >
                                PNG
                            </button>
                            <button
                                className={`format-btn ${format === 'mmd' ? 'active' : ''}`}
                                onClick={() => setFormat('mmd')}
                            >
                                Mermaid (.mmd)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="export-footer">
                    <button onClick={onClose} className="button-secondary">
                        Cancel
                    </button>
                    <button onClick={handleExport} className="button-primary">
                        Export
                    </button>
                </div>
            </div>
        </div>
    )
}
