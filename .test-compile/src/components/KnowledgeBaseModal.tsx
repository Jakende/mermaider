import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { getStoredConfig, generateEmbedding, convertTextToMermaidWithAI } from '../utils/aiService'
import { addDocuments, chunkText, VectorDocument, clearVectorStore, getAllDocuments, deleteSource } from '../utils/vectorStore'
import './KnowledgeBaseModal.css'

interface KnowledgeBaseModalProps {
    isOpen: boolean
    onClose: () => void
    onImportDiagram: (code: string, name: string) => void
}

export default function KnowledgeBaseModal({ isOpen, onClose, onImportDiagram }: KnowledgeBaseModalProps) {
    const { theme } = useTheme()
    const [inputText, setInputText] = useState('')
    const [sourceName, setSourceName] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [docCount, setDocCount] = useState<number | null>(null)
    const [sources, setSources] = useState<string[]>([])
    const [activeSources, setActiveSources] = useState<string[]>([])

    const handleIndex = async () => {
        if (!inputText.trim() || !sourceName.trim()) {
            alert('Please provide both a source name and text content.')
            return
        }

        setIsProcessing(true)
        setProgress(0)
        try {
            const config = getStoredConfig()
            const chunks = chunkText(inputText)

            const docs: VectorDocument[] = []
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i]
                const embedding = await generateEmbedding(chunk, config)
                docs.push({
                    id: `${sourceName.replace(/\s+/g, '-')}-${Date.now()}-${i}`,
                    source: sourceName,
                    textChunk: chunk,
                    embedding
                })
                setProgress(Math.round(((i + 1) / chunks.length) * 100))
            }

            await addDocuments(docs)
            alert(`Successfully indexed ${chunks.length} segments!`)

            // Auto-activate new source
            const newActive = Array.from(new Set([...activeSources, sourceName]))
            setActiveSources(newActive)
            localStorage.setItem('mermaider-active-sources', JSON.stringify(newActive))

            setInputText('')
            setSourceName('')
            checkDocCount()
        } catch (error) {
            console.error('Indexing failed:', error)
            alert('Failed to index document: ' + (error instanceof Error ? error.message : 'Unknown error'))
        } finally {
            setIsProcessing(false)
            setProgress(0)
        }
    }

    const handleGenerate = async () => {
        if (!inputText.trim()) {
            alert('Please paste some text to generate a diagram from.')
            return
        }
        setIsProcessing(true)
        try {
            const config = getStoredConfig()
            const code = await convertTextToMermaidWithAI(inputText, config)
            onImportDiagram(code, sourceName || 'Imported Diagram')
            onClose()
        } catch (err) {
            console.error('Generation failed:', err)
            alert('Failed to generate diagram: ' + (err instanceof Error ? err.message : 'Unknown error'))
        } finally {
            setIsProcessing(false)
        }
    }

    const checkDocCount = async () => {
        const all = await getAllDocuments()
        setDocCount(all.length)
        const unique = Array.from(new Set(all.map(d => d.source)))
        setSources(unique)
        const storedActive = JSON.parse(localStorage.getItem('mermaider-active-sources') || '[]')
        // If it's the first time or we never saved, maybe activate all? 
        if (storedActive.length === 0 && unique.length > 0 && !localStorage.getItem('mermaider-active-sources')) {
            setActiveSources(unique)
            localStorage.setItem('mermaider-active-sources', JSON.stringify(unique))
        } else {
            setActiveSources(storedActive)
        }
    }

    const toggleSource = (src: string) => {
        let newActive;
        if (activeSources.includes(src)) {
            newActive = activeSources.filter(s => s !== src)
        } else {
            newActive = [...activeSources, src]
        }
        setActiveSources(newActive)
        localStorage.setItem('mermaider-active-sources', JSON.stringify(newActive))
    }

    const handleDeleteSource = async (src: string) => {
        if (confirm(`Delete all embeddings for "${src}"?`)) {
            await deleteSource(src)
            checkDocCount()
        }
    }

    const handleClear = async () => {
        if (confirm('Clear the entire local knowledge base?')) {
            await clearVectorStore()
            setDocCount(0)
            alert('Knowledge base cleared.')
        }
    }

    // Effect to load count
    if (isOpen && docCount === null) {
        checkDocCount()
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`kb-modal ${theme}`} onClick={(e) => e.stopPropagation()}>
                <div className="kb-header">
                    <h2>Knowledge Base & Quick Import</h2>
                    <button className="close-button" onClick={onClose}>[X]</button>
                </div>

                <div className="kb-content">
                    <p className="kb-description">
                        Paste unstructured text (e.g. requirements, meeting notes, code snippets) to either add it to your <strong>Local Knowledge Base</strong> or directly <strong>Generate a Diagram</strong> from it.
                    </p>

                    <div className="kb-field">
                        <label>Source Name</label>
                        <input
                            type="text"
                            value={sourceName}
                            onChange={e => setSourceName(e.target.value)}
                            placeholder="e.g. Auth System Spec"
                            className="kb-input"
                        />
                    </div>

                    <div className="kb-field">
                        <label>Content</label>
                        <textarea
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            placeholder="Paste your text here..."
                            className="kb-textarea"
                        />
                    </div>

                    {isProcessing && (
                        <div className="kb-progress-bar">
                            <div className="kb-progress-fill" style={{ width: `${progress}%` }}></div>
                            <span className="kb-progress-text">{progress}%</span>
                        </div>
                    )}

                    {sources.length > 0 && (
                        <div className="kb-sources-list">
                            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-color)' }}>Available Sources <span style={{ fontSize: '10px', fontWeight: 'normal' }}>(Check to activate for Chat AI)</span></label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '4px' }}>
                                {sources.map(src => (
                                    <div key={src} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={activeSources.includes(src)}
                                                onChange={() => toggleSource(src)}
                                            />
                                            {src}
                                        </label>
                                        <button onClick={() => handleDeleteSource(src)} style={{ background: 'none', border: 'none', color: 'var(--error, #ff4c4c)', cursor: 'pointer', fontSize: '11px', padding: '2px 6px' }}>Delete</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="kb-stats" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px', color: 'var(--muted)' }}>
                        <span>{docCount !== null ? `${docCount} chunks in local DB` : 'Loading DB stats...'}</span>
                        <button onClick={handleClear} className="button-text-only" style={{ color: 'var(--error, #ff4c4c)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Clear DB</button>
                    </div>
                </div>

                <div className="kb-footer">
                    <button onClick={onClose} className="button-secondary" disabled={isProcessing}>
                        Cancel
                    </button>
                    <div className="kb-actions">
                        <button onClick={handleGenerate} className="button-secondary" disabled={isProcessing} title="Generates a diagram directly from the text above">
                            Generate Diagram
                        </button>
                        <button onClick={handleIndex} className="button-primary" disabled={isProcessing} title="Chunks the text and indexes it locally using embeddings">
                            {isProcessing ? 'Indexing...' : 'Index & Store locally'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
