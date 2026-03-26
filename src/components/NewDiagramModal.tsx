import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { MERMAID_TEMPLATES, DiagramTemplate } from '../utils/mermaidTemplates'
import './NewDiagramModal.css'

interface NewDiagramModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (code: string, name: string) => void;
}

export default function NewDiagramModal({ isOpen, onClose, onSelect }: NewDiagramModalProps) {
    const { theme } = useTheme()
    const [searchTerm, setSearchTerm] = useState('')

    if (!isOpen) return null

    const filteredTemplates = MERMAID_TEMPLATES.filter(template => 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const coreTemplates = filteredTemplates.filter(t => t.category === 'core')
    const advancedTemplates = filteredTemplates.filter(t => t.category === 'advanced')

    const handleSelect = (template: DiagramTemplate) => {
        onSelect(template.code, `untitled-${template.id}`)
    }

    const handleCreateBlank = () => {
        onSelect('', 'untitled')
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`new-diagram-modal ${theme}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>New Diagram</h2>
                    <button className="close-button" onClick={onClose}>[X]</button>
                </div>
                
                <div className="modal-search">
                    <input 
                        type="text" 
                        placeholder="Search diagram types..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="modal-content">
                    <div className="template-section">
                        <div className="template-grid">
                            <div className="template-card blank-card" onClick={handleCreateBlank}>
                                <h3>Blank Diagram</h3>
                                <p>Start from scratch with an empty editor.</p>
                            </div>
                        </div>
                    </div>

                    {coreTemplates.length > 0 && (
                        <div className="template-section">
                            <h3 className="section-title">Core Diagrams</h3>
                            <div className="template-grid">
                                {coreTemplates.map(template => (
                                    <div key={template.id} className="template-card" onClick={() => handleSelect(template)}>
                                        <h3>{template.name}</h3>
                                        <p>{template.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {advancedTemplates.length > 0 && (
                        <div className="template-section">
                            <h3 className="section-title">Advanced Diagrams</h3>
                            <div className="template-grid">
                                {advancedTemplates.map(template => (
                                    <div key={template.id} className="template-card" onClick={() => handleSelect(template)}>
                                        <h3>{template.name}</h3>
                                        <p>{template.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
