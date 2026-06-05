import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { getStoredConfig, storeConfig, clearConfig } from '../utils/aiService'
import './Settings.css'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const { theme } = useTheme()
  const [endpoint, setEndpoint] = useState('')
  const [model, setModel] = useState('')
  const [embeddingModel, setEmbeddingModel] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [temperature, setTemperature] = useState<number>(0.3)
  const [generationDepth, setGenerationDepth] = useState<number>(5)
  const [numCtx, setNumCtx] = useState<number>(16384)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const config = getStoredConfig()
      setEndpoint(config.endpoint)
      setModel(config.model)
      setEmbeddingModel(config.embeddingModel || 'nomic-embed-text')
      setSystemPrompt(config.systemPrompt || '')
      setTemperature(config.temperature ?? 0.3)
      setGenerationDepth(config.generationDepth ?? 5)
      setNumCtx(config.numCtx ?? 16384)
      setShowResetConfirm(false)
    }
  }, [isOpen])

  const handleSave = () => {
    if (endpoint.trim() && model.trim()) {
      storeConfig({
        endpoint: endpoint.trim(),
        model: model.trim(),
        embeddingModel: embeddingModel.trim(),
        systemPrompt: systemPrompt.trim(),
        temperature,
        generationDepth,
        numCtx
      })
      alert('Settings saved successfully!')
      onClose()
    } else {
      alert('Please fill in both fields')
    }
  }

  const handleReset = () => {
    clearConfig()
    // Re-load defaults
    const config = getStoredConfig()
    setEndpoint(config.endpoint)
    setModel(config.model)
    setEmbeddingModel(config.embeddingModel || 'nomic-embed-text')
    setSystemPrompt(config.systemPrompt || '')
    setTemperature(0.3)
    setGenerationDepth(5)
    setNumCtx(16384)
    setShowResetConfirm(false)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`settings-modal ${theme}`} onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>
            [X]
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>AI Error Fixer</h3>
            <p className="settings-description">
              Configure your local Ollama instance for AI-powered error fixing.
            </p>

            <div className="settings-field">
              <label htmlFor="ollama-endpoint">Ollama Endpoint</label>
              <input
                id="ollama-endpoint"
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="http://127.0.0.1:11434/v1"
                className="api-key-input"
              />
              <p className="settings-hint">
                Default: http://127.0.0.1:11434/v1
              </p>
            </div>

            <div className="settings-field">
              <label htmlFor="ollama-model">Ollama Model</label>
              <input
                id="ollama-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-oss:20b"
                className="api-key-input"
              />
              <p className="settings-hint">
                Default: gpt-oss:20b
              </p>
            </div>

            <div className="settings-field">
              <label htmlFor="ollama-embedding-model">Embedding Model</label>
              <input
                id="ollama-embedding-model"
                type="text"
                value={embeddingModel}
                onChange={(e) => setEmbeddingModel(e.target.value)}
                placeholder="nomic-embed-text"
                className="api-key-input"
              />
              <p className="settings-hint">
                Model used for RAG embeddings. Default: nomic-embed-text
              </p>
            </div>

            <div className="settings-field">
              <label htmlFor="ollama-num-ctx">Context Window Size</label>
              <input
                id="ollama-num-ctx"
                type="number"
                value={numCtx}
                onChange={(e) => setNumCtx(parseInt(e.target.value) || 2048)}
                placeholder="16384"
                className="api-key-input"
              />
              <p className="settings-hint">
                Context window size (num_ctx) for Ollama. Default: 16384
              </p>
            </div>

            <div className="settings-field">
              <label htmlFor="ollama-temperature">
                Temperature ({temperature})
              </label>
              <input
                id="ollama-temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <p className="settings-hint">
                Lower = more deterministic, Higher = more creative. Default: 0.3
              </p>
            </div>

            <div className="settings-field">
              <label htmlFor="ollama-generation-depth">
                Generation Depth ({generationDepth})
              </label>
              <input
                id="ollama-generation-depth"
                type="range"
                min="1"
                max="10"
                step="1"
                value={generationDepth}
                onChange={(e) => setGenerationDepth(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
              <p className="settings-hint">
                1 = Simple, 10 = Very complex with many details. Default: 5
              </p>
            </div>

            <div className="settings-field">
              <label htmlFor="ollama-system-prompt">System Prompt</label>
              <textarea
                id="ollama-system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Optional custom system prompt..."
                className="api-key-input"
                style={{ height: '100px', resize: 'vertical' }}
              />
              <p className="settings-hint">
                Leave empty to use the default specialized Mermaid prompt.
              </p>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          {showResetConfirm ? (
            <button onClick={handleReset} className="button-secondary" style={{ borderColor: 'var(--error, #ff4c4c)', color: 'var(--error, #ff4c4c)' }}>
              Confirm Reset?
            </button>
          ) : (
            <button onClick={() => setShowResetConfirm(true)} className="button-secondary">
              Reset Defaults
            </button>
          )}
          <div>
            <button onClick={onClose} className="button-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="button-primary">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

