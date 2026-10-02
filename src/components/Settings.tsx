import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import {
  getStoredConfig,
  getStoredConfigWithSecrets,
  storeConfig,
  clearConfig,
  getAvailableModels,
  testOllamaConnection,
  getAvailableOpenAIModels,
  testOpenAIConnection,
  startOpenAIDeviceAuth,
  pollOpenAIDeviceToken,
  type OpenAIDeviceAuthResponse,
} from '../utils/aiService'
import './Settings.css'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

type Provider = 'ollama' | 'openai'
type OpenAIAuthType = 'apikey' | 'token' | 'device'

// Device Code flow states
type DeviceFlowState = 'idle' | 'fetching' | 'awaiting' | 'polling' | 'success' | 'error'

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const { theme } = useTheme()

  // ── Provider selection ────────────────────────────────────────────────────
  const browserRuntime = !(window as any).__TAURI_INTERNALS__
  const [ollamaDiscoveryError, setOllamaDiscoveryError] = useState('')
  const [openaiDiscoveryError, setOpenaiDiscoveryError] = useState('')
  const [provider, setProvider] = useState<Provider>('ollama')
  // Independent embedding provider — can differ from the chat provider
  const [embeddingProvider, setEmbeddingProvider] = useState<Provider>('ollama')

  // ── Ollama state ──────────────────────────────────────────────────────────
  const [endpoint, setEndpoint] = useState('')
  const [model, setModel] = useState('')
  const [embeddingModel, setEmbeddingModel] = useState('')
  const [numCtx, setNumCtx] = useState<number>(16384)
  const [availableModels, setAvailableModels] = useState<string[]>([])

  // ── OpenAI state ──────────────────────────────────────────────────────────
  const [openaiEndpoint, setOpenaiEndpoint] = useState('https://api.openai.com/v1')
  const [openaiModel, setOpenaiModel] = useState('')
  const [openaiEmbeddingModel, setOpenaiEmbeddingModel] = useState('')
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [openaiAccessToken, setOpenaiAccessToken] = useState('')
  const [openaiIdToken, setOpenaiIdToken] = useState('')
  const [openaiAuthType, setOpenaiAuthType] = useState<OpenAIAuthType>('apikey')
  const [showApiKey, setShowApiKey] = useState(false)
  const [showAccessToken, setShowAccessToken] = useState(false)
  const [availableOpenAIChatModels, setAvailableOpenAIChatModels] = useState<string[]>([])
  const [availableOpenAIEmbedModels, setAvailableOpenAIEmbedModels] = useState<string[]>([])

  // ── Device Code flow state ────────────────────────────────────────────────
  const [deviceFlowState, setDeviceFlowState] = useState<DeviceFlowState>('idle')
  const [deviceAuthInfo, setDeviceAuthInfo] = useState<OpenAIDeviceAuthResponse | null>(null)
  const [deviceFlowError, setDeviceFlowError] = useState<string>('')
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Shared settings ───────────────────────────────────────────────────────
  const [systemPrompt, setSystemPrompt] = useState('')
  const [temperature, setTemperature] = useState<number>(0.3)
  const [generationDepth, setGenerationDepth] = useState<number>(5)
  const [autoAIFix, setAutoAIFix] = useState<boolean>(false)

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // ── Stop polling on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  // ── Load config when opened ───────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      const config = getStoredConfig()
      setProvider(config.provider === 'openai' ? 'openai' : 'ollama')
      // embeddingProvider defaults to the same as provider when not explicitly set
      setEmbeddingProvider(config.embeddingProvider ?? (config.provider === 'openai' ? 'openai' : 'ollama'))

      // Ollama
      setOllamaDiscoveryError('')
      setOpenaiDiscoveryError('')
      setEndpoint(config.endpoint)
      setModel(config.model)
      setEmbeddingModel(config.embeddingModel || 'nomic-embed-text')
      setNumCtx(config.numCtx ?? 16384)

      // OpenAI
      setOpenaiEndpoint(config.openaiEndpoint || 'https://api.openai.com/v1')
      setOpenaiModel(config.openaiModel || '')
      setOpenaiEmbeddingModel(config.openaiEmbeddingModel || '')
      setOpenaiApiKey(config.openaiApiKey || '')
      setOpenaiAccessToken(config.openaiAccessToken || '')
      setOpenaiIdToken(config.openaiIdToken || '')
      setOpenaiAuthType(browserRuntime ? 'apikey' : (config.openaiAuthType as OpenAIAuthType) || 'apikey')

      // Shared
      setSystemPrompt(config.systemPrompt || '')
      setTemperature(config.temperature ?? 0.3)
      setGenerationDepth(config.generationDepth ?? 5)
      setAutoAIFix(config.autoAIFix ?? false)

      setShowResetConfirm(false)
      setTestResult(null)
      setDeviceFlowState('idle')
      setDeviceAuthInfo(null)
      setDeviceFlowError('')

      fetchModels(config.endpoint)
      // Credentials are loaded from the OS keychain in Tauri, not from the
      // localStorage settings metadata.
      void getStoredConfigWithSecrets().then((secureConfig) => {
        setOpenaiApiKey(secureConfig.openaiApiKey || '')
        setOpenaiAccessToken(secureConfig.openaiAccessToken || '')
        setOpenaiIdToken(secureConfig.openaiIdToken || '')
        if (secureConfig.openaiApiKey || secureConfig.openaiAccessToken) {
          fetchOpenAIModels(browserRuntime ? { ...secureConfig, openaiAuthType: 'apikey' } : secureConfig)
        }
      }).catch((error) => console.error('Failed to load secure OpenAI credentials', error))
    }
  }, [isOpen])

  // ── Ollama model discovery ────────────────────────────────────────────────
  const fetchModels = async (endpointUrl: string) => {
    setOllamaDiscoveryError('')
    if (!endpointUrl.trim()) return
    try {
      const models = await getAvailableModels(endpointUrl.trim())
      setAvailableModels(models)
    } catch (err) {
      setAvailableModels([])
      setOllamaDiscoveryError(err instanceof Error ? err.message : 'Ollama model discovery failed.')
    }
  }

  const handleEndpointBlur = () => {
    fetchModels(endpoint)
  }

  // ── OpenAI model discovery ─────────────────────────────────────────────────
  const fetchOpenAIModels = async (partialConfig?: any) => {
    setOpenaiDiscoveryError('')
    const config = partialConfig || {
      openaiEndpoint,
      openaiApiKey,
      openaiAccessToken,
      openaiIdToken,
      openaiAuthType,
    }
    try {
      const models = await getAvailableOpenAIModels(config)
      setAvailableOpenAIChatModels(models.chat)
      setAvailableOpenAIEmbedModels(models.embedding)
      // Never replace a manually entered model with the first catalog entry.
      // The Codex catalog can omit models that the backend still accepts.
      if (models.chat.length > 0 && !openaiModel.trim()) {
        setOpenaiModel(models.chat[0])
      }
      if (models.embedding.length > 0 && !openaiEmbeddingModel.trim()) {
        setOpenaiEmbeddingModel(models.embedding[0])
      }
    } catch (error) {
      setAvailableOpenAIChatModels([])
      setAvailableOpenAIEmbedModels([])
      setOpenaiDiscoveryError(error instanceof Error ? error.message : 'OpenAI model discovery failed.')
    }
  }

  // ── Connection tests ──────────────────────────────────────────────────────
  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      if (provider === 'openai') {
        const config = buildCurrentConfig()
        const result = await testOpenAIConnection(config)
        setTestResult(result)
        if (result.success) {
          fetchOpenAIModels()
        }
      } else {
        const result = await testOllamaConnection(endpoint, model, embeddingModel)
        setTestResult(result)
        if (result.success || result.message.includes('not found')) {
          await fetchModels(endpoint)
        }
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error testing connection'
      })
    } finally {
      setIsTesting(false)
    }
  }

  // ── Device Code flow ──────────────────────────────────────────────────────
  const handleStartDeviceAuth = async () => {
    setDeviceFlowState('fetching')
    setDeviceFlowError('')
    setDeviceAuthInfo(null)
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)

    try {
      const config = buildCurrentConfig()
      const info = await startOpenAIDeviceAuth(config)
      setDeviceAuthInfo(info)
      setDeviceFlowState('awaiting')

      // Auto-open verification URL
      if (info.verification_uri_complete || info.verification_uri) {
        const url = info.verification_uri_complete || info.verification_uri
        window.open(url, '_blank', 'noopener,noreferrer')
      }

      // Begin polling
      const interval = info.interval ? Math.max(info.interval * 1000, 5000) : 5000
      setDeviceFlowState('polling')
      pollIntervalRef.current = setInterval(async () => {
        try {
          const tokenRes = await pollOpenAIDeviceToken(info.device_code, info.user_code, config)
          if (tokenRes.error) {
            if (tokenRes.error === 'authorization_pending') return // keep polling
            if (tokenRes.error === 'slow_down') return // keep polling
            // Terminal error
            clearInterval(pollIntervalRef.current!)
            setDeviceFlowState('error')
            setDeviceFlowError(tokenRes.error_description || tokenRes.error)
            return
          }
          // Success
          clearInterval(pollIntervalRef.current!)
          setOpenaiAccessToken(tokenRes.access_token)
          setOpenaiIdToken(tokenRes.id_token || '')
          // Load the models exposed by this ChatGPT/Codex account.
          await fetchOpenAIModels({
            ...buildCurrentConfig(),
            openaiAccessToken: tokenRes.access_token,
            openaiIdToken: tokenRes.id_token || '',
            openaiAuthType: 'token',
            openaiModel: '',
          })
          if (tokenRes.refresh_token) {
            // Store refresh token for future refresh (saved on Save)
          }
          setOpenaiAuthType('token')
          setDeviceFlowState('success')
        } catch (err: any) {
          clearInterval(pollIntervalRef.current!)
          setDeviceFlowState('error')
          setDeviceFlowError(err?.message || 'Polling error')
        }
      }, interval)
    } catch (err: any) {
      setDeviceFlowState('error')
      setDeviceFlowError(err?.message || 'Failed to start device auth')
    }
  }

  const handleCancelDeviceAuth = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    setDeviceFlowState('idle')
    setDeviceAuthInfo(null)
    setDeviceFlowError('')
  }

  // ── Build config from current state ──────────────────────────────────────
  const buildCurrentConfig = () => ({
    endpoint,
    model,
    embeddingModel,
    systemPrompt: systemPrompt.trim(),
    temperature,
    generationDepth,
    numCtx,
    autoAIFix,
    // This preference lives in Chat; preserve it when saving other settings.
    openaiWebSearch: getStoredConfig().openaiWebSearch ?? false,
    provider,
    embeddingProvider,
    openaiEndpoint,
    openaiModel,
    openaiEmbeddingModel,
    openaiApiKey: openaiApiKey.trim(),
    openaiAccessToken: openaiAccessToken.trim(),
    openaiIdToken: openaiIdToken.trim(),
    openaiAuthType,
  })

  // ── Save / Reset ──────────────────────────────────────────────────────────
  const handleSave = () => {
    if (provider === 'ollama' && (!endpoint.trim() || !model.trim())) {
      alert('Please fill in both Ollama Endpoint and Model fields.')
      return
    }
    if (provider === 'openai' && !openaiApiKey.trim() && !openaiAccessToken.trim()) {
      alert('Please provide an OpenAI API key or access token.')
      return
    }
    if (provider === 'openai' && !openaiModel.trim()) {
      alert('Please load and select an OpenAI/Codex model before saving.')
      return
    }
    storeConfig(buildCurrentConfig())
    alert('Settings saved successfully!')
    onClose()
  }

  const handleReset = () => {
    clearConfig()
    const config = getStoredConfig()
    setOllamaDiscoveryError('')
    setOpenaiDiscoveryError('')
    setProvider('ollama')
    setEmbeddingProvider('ollama')
    setEndpoint(config.endpoint)
    setModel(config.model)
    setEmbeddingModel(config.embeddingModel || 'nomic-embed-text')
    setNumCtx(16384)
    setOpenaiEndpoint('https://api.openai.com/v1')
    setOpenaiModel('')
    setOpenaiEmbeddingModel('')
    setOpenaiApiKey('')
    setOpenaiAccessToken('')
    setOpenaiIdToken('')
    setOpenaiAuthType('apikey')
    setSystemPrompt(config.systemPrompt || '')
    setTemperature(0.3)
    setGenerationDepth(5)
    setAutoAIFix(false)
    setShowResetConfirm(false)
    setTestResult(null)
    setDeviceFlowState('idle')
    setDeviceAuthInfo(null)
    setDeviceFlowError('')
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    fetchModels(config.endpoint)
  }

  if (!isOpen) return null

  // ── Render ────────────────────────────────────────────────────────────────
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

          {/* ── Provider Selector ── */}
          <div className="settings-section">
            <h3>AI Provider</h3>
            <div className="provider-tabs" role="tablist">
              <button
                id="provider-tab-ollama"
                role="tab"
                aria-selected={provider === 'ollama'}
                className={`provider-tab ${provider === 'ollama' ? 'active' : ''}`}
                onClick={() => { setProvider('ollama'); setTestResult(null) }}
              >
Ollama (Local)
              </button>
              <button
                id="provider-tab-openai"
                role="tab"
                aria-selected={provider === 'openai'}
                className={`provider-tab ${provider === 'openai' ? 'active' : ''}`}
                onClick={() => { setProvider('openai'); setTestResult(null) }}
              >
                OpenAI
              </button>
            </div>
          </div>

          {browserRuntime && (
            <div className="settings-section">
              <p className="settings-hint">OpenAI requests use the hosted Mermaider service. Your API key and input
                are forwarded to OpenAI for each request. Credentials stay in this tab session, including reloads.</p>
              <details>
                <summary>Set up local Ollama in your browser</summary>
                <p className="settings-hint">Allow local-network access for this website in your browser.
                  On macOS with the Ollama app, run this command once, then fully quit and reopen Ollama:</p>
                <code>{`launchctl setenv OLLAMA_ORIGINS "${window.location.origin}"`}</code>
                <p className="settings-hint">For an Ollama terminal server, set OLLAMA_ORIGINS to
                  {' '}{window.location.origin} before starting it. Keep your existing allowed origins if needed.
                  Then select Ollama and test the connection below.</p>
              </details>
            </div>
          )}

          {/* ── Connection Test Result ── */}
          {testResult && (
            <div className={`test-result-alert ${testResult.success ? 'success' : 'error'}`}>
              <div className="alert-title">
                {testResult.success ? 'Connection Succeeded' : 'Connection Failed'}
              </div>
              <div className="alert-message">{testResult.message}</div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              OLLAMA PANEL
          ══════════════════════════════════════════════════ */}
          {provider === 'ollama' && (
            <div className="settings-section" role="tabpanel" aria-labelledby="provider-tab-ollama">
              <p className="settings-description">
                Configure your local Ollama instance for AI-powered diagram operations.
              </p>

              <div className="settings-field">
                <label htmlFor="ollama-endpoint">Ollama Endpoint</label>
                <div className="input-with-button">
                  <input
                    id="ollama-endpoint"
                    type="text"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    onBlur={handleEndpointBlur}
                    placeholder="http://127.0.0.1:11434/v1"
                    className="api-key-input"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="button-secondary test-conn-btn"
                  >
                    {isTesting ? 'Testing…' : 'Test Connection'}
                  </button>
                </div>
                <p className="settings-hint">Default: http://127.0.0.1:11434/v1</p>
              </div>

              {ollamaDiscoveryError && <p className="settings-hint" role="alert">{ollamaDiscoveryError}</p>}
              <div className="settings-field">
                <label htmlFor="ollama-model">Ollama Model</label>
                <input
                  id="ollama-model"
                  type="text"
                  list="available-models-list"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-oss:20b"
                  className="api-key-input"
                />
                <datalist id="available-models-list">
                  {availableModels.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
                <p className="settings-hint">
                  Default: gpt-oss:20b {availableModels.length > 0 && `(found ${availableModels.length} models locally)`}
                </p>
              </div>

              <div className="settings-field">
                <label htmlFor="ollama-embedding-model">Embedding Model</label>
                <input
                  id="ollama-embedding-model"
                  type="text"
                  list="available-embeddings-list"
                  value={embeddingModel}
                  onChange={(e) => setEmbeddingModel(e.target.value)}
                  placeholder="nomic-embed-text"
                  className="api-key-input"
                />
                <datalist id="available-embeddings-list">
                  {availableModels.filter(m => m.includes('embed') || m.includes('nomic')).map((m) => (
                    <option key={m} value={m} />
                  ))}
                  {availableModels.length > 0 && !availableModels.some(m => m.includes('embed') || m.includes('nomic')) &&
                    availableModels.map((m) => (
                      <option key={m} value={m} />
                    ))
                  }
                </datalist>
                <p className="settings-hint">Model used for RAG embeddings. Default: nomic-embed-text</p>
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
                <p className="settings-hint">Context window size (num_ctx) for Ollama. Default: 16384</p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              OPENAI PANEL
          ══════════════════════════════════════════════════ */}
          {provider === 'openai' && (
            <div className="settings-section" role="tabpanel" aria-labelledby="provider-tab-openai">
              <p className="settings-description">
                {browserRuntime ? 'Connect with an OpenAI API key. ChatGPT subscriptions and Codex account logins are separate; account login remains available in the desktop app.' : 'Connect with an OpenAI API key or a ChatGPT/Codex account.'}
              </p>

              {openaiDiscoveryError && <p className="settings-hint" role="alert">{openaiDiscoveryError}</p>}
              {/* ── Auth Type Selector ── */}
              <div className="settings-field">
                <label>Authentication Method</label>
                <div className="openai-auth-tabs">
                  <button
                    id="openai-auth-apikey"
                    className={`auth-tab ${openaiAuthType === 'apikey' ? 'active' : ''}`}
                    onClick={() => setOpenaiAuthType('apikey')}
                  >
                    API Key
                  </button>
                  <button
                    disabled={browserRuntime}
                    title={browserRuntime ? "Account access is available in the desktop app" : undefined}
                    id="openai-auth-token"
                    className={`auth-tab ${openaiAuthType === 'token' ? 'active' : ''}`}
                    onClick={() => setOpenaiAuthType('token')}
                  >
                    Access Token
                  </button>
                  <button
                    disabled={browserRuntime}
                    title={browserRuntime ? "Account login is available in the desktop app" : undefined}
                    id="openai-auth-device"
                    className={`auth-tab ${openaiAuthType === 'device' ? 'active' : ''}`}
                    onClick={() => { setOpenaiAuthType('device'); setDeviceFlowState('idle') }}
                  >
Device Code / Browser
                  </button>
                </div>
              </div>

              {/* ── API Key ── */}
              {openaiAuthType === 'apikey' && (
                <div className="settings-field">
                  <label htmlFor="openai-api-key">OpenAI API Key</label>
                  <div className="api-key-input-wrapper">
                    <input
                      id="openai-api-key"
                      type={showApiKey ? 'text' : 'password'}
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="api-key-input"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => setShowApiKey(v => !v)}
                      aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="settings-hint">
                    Your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a>
                  </p>
                </div>
              )}

              {/* ── Access Token ── */}
              {openaiAuthType === 'token' && (
                <div className="settings-field">
                  <label htmlFor="openai-access-token">OpenAI Access Token</label>
                  <div className="api-key-input-wrapper">
                    <input
                      id="openai-access-token"
                      type={showAccessToken ? 'text' : 'password'}
                      value={openaiAccessToken}
                      onChange={(e) => setOpenaiAccessToken(e.target.value)}
                      placeholder="Paste your access token here..."
                      className="api-key-input"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => setShowAccessToken(v => !v)}
                      aria-label={showAccessToken ? 'Hide token' : 'Show token'}
                    >
                      {showAccessToken ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="settings-hint">
                    Paste an access token obtained from ChatGPT or via the Device Code flow below.
                  </p>
                </div>
              )}

              {/* ── Device Code Flow ── */}
              {openaiAuthType === 'device' && (
                <div className="settings-field">
                  <label>OpenAI Account Login (Device Code)</label>

                  {deviceFlowState === 'idle' && (
                    <div className="device-code-box device-code-idle">
                      <p className="settings-hint" style={{ marginBottom: '12px' }}>
                        Click below to initiate a browser-based OpenAI login. A code will appear that you'll enter on the OpenAI authorization page.
                      </p>
                      <button
                        id="openai-device-auth-start"
                        type="button"
                        className="button-primary"
                        onClick={handleStartDeviceAuth}
                      >
Login with OpenAI Account
                      </button>
                    </div>
                  )}

                  {deviceFlowState === 'fetching' && (
                    <div className="device-code-box">
                      <span className="device-code-spinner" aria-label="Loading" /> Requesting device code…
                    </div>
                  )}

                  {(deviceFlowState === 'awaiting' || deviceFlowState === 'polling') && deviceAuthInfo && (
                    <div className="device-code-box device-code-active">
                      <div className="device-code-instruction">
                        1. Open the verification URL in your browser:
                      </div>
                      <a
                        href={deviceAuthInfo.verification_uri_complete || deviceAuthInfo.verification_uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="device-code-link"
                        id="openai-device-auth-link"
                      >
                        {deviceAuthInfo.verification_uri}
                      </a>
                      <div className="device-code-instruction" style={{ marginTop: '10px' }}>
                        2. Enter this code when prompted:
                      </div>
                      <div className="device-code-display" id="openai-device-code-display">
                        {deviceAuthInfo.user_code}
                      </div>
                      <div className="device-code-status">
                        <span className="device-code-spinner" aria-label="Loading" />
                        {deviceFlowState === 'polling' ? 'Waiting for authorization…' : 'Opening browser…'}
                      </div>
                      <button
                        type="button"
                        className="button-secondary"
                        style={{ marginTop: '12px', fontSize: '12px' }}
                        onClick={handleCancelDeviceAuth}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {deviceFlowState === 'success' && (
                    <div className="device-code-box device-code-success">
                      <strong>Login successful</strong>
                      <p className="settings-hint" style={{ marginTop: '6px' }}>
                        Access token obtained and stored. Click <em>Save</em> to persist your settings.
                      </p>
                    </div>
                  )}

                  {deviceFlowState === 'error' && (
                    <div className="device-code-box device-code-error">
                      <strong>Authentication failed:</strong> {deviceFlowError}
                      <br />
                      <button
                        type="button"
                        className="button-secondary"
                        style={{ marginTop: '10px', fontSize: '12px' }}
                        onClick={() => setDeviceFlowState('idle')}
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Test Connection ── */}
              <div className="settings-field">
                <div className="input-with-button" style={{ justifyContent: 'flex-end' }}>
                  <button
                    id="openai-test-connection"
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="button-secondary test-conn-btn"
                  >
                    {isTesting ? 'Testing…' : 'Test OpenAI Connection'}
                  </button>
                </div>
              </div>

              {/* ── Model Selection ── */}
              <div className="settings-field">
                <label htmlFor="openai-model">Chat Model</label>
                <div className="input-with-button">
                  <input
                    id="openai-model"
                    type="text"
                    value={openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                    placeholder="Type a model name…"
                    className="api-key-input"
                  />
                  <button
                    type="button"
                    className="button-secondary test-conn-btn"
                    onClick={() => fetchOpenAIModels()}
                  >
                    Load Models
                  </button>
                </div>
                {availableOpenAIChatModels.length > 0 && (
                  <div className="settings-field" style={{ marginTop: '8px', marginBottom: 0 }}>
                    <label htmlFor="openai-discovered-model">Models returned by your account ({availableOpenAIChatModels.length})</label>
                    <select
                      id="openai-discovered-model"
                      className="api-key-input"
                      value={openaiModel}
                      onChange={(e) => { if (e.target.value) setOpenaiModel(e.target.value) }}
                    >
                      {!availableOpenAIChatModels.includes(openaiModel) && openaiModel && (
                        <option value={openaiModel}>Custom model: {openaiModel}</option>
                      )}
                      <option value="">Choose a discovered model…</option>
                      {availableOpenAIChatModels.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                )}
                <p className="settings-hint">The picker contains every model returned by the Codex catalog. You can still type a compatible model name manually.</p>
              </div>

              {/* ── Embedding Provider ── */}
              <div className="settings-field">
                <label>Embedding Provider (for RAG / Knowledge Base)</label>
                <div className="openai-auth-tabs">
                  <button
                    id="embed-provider-openai"
                    className={`auth-tab ${embeddingProvider === 'openai' ? 'active' : ''}`}
                    onClick={() => setEmbeddingProvider('openai')}
                  >
OpenAI Embeddings
                  </button>
                  <button
                    id="embed-provider-ollama"
                    className={`auth-tab ${embeddingProvider === 'ollama' ? 'active' : ''}`}
                    onClick={() => setEmbeddingProvider('ollama')}
                  >
Ollama Embeddings
                  </button>
                </div>
              </div>

              {/* OpenAI embedding model — only shown when embedding provider is OpenAI */}
              {embeddingProvider === 'openai' && (
                <div className="settings-field">
                  <label htmlFor="openai-embedding-model">OpenAI Embedding Model</label>
                  <input
                    id="openai-embedding-model"
                    type="text"
                    list="openai-embed-models-list"
                    value={openaiEmbeddingModel}
                    onChange={(e) => setOpenaiEmbeddingModel(e.target.value)}
                    placeholder="text-embedding-3-small"
                    className="api-key-input"
                  />
                  <datalist id="openai-embed-models-list">
                    {availableOpenAIEmbedModels.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                  <p className="settings-hint">Default: text-embedding-3-small</p>
                </div>
              )}

              {/* Ollama embedding fields — shown when mixing OpenAI chat + Ollama embeddings */}
              {embeddingProvider === 'ollama' && (
                <div className="embed-ollama-mix-box">
                  <div className="settings-field">
                    <label htmlFor="ollama-embed-endpoint-mix">Ollama Endpoint (for Embeddings)</label>
                    <input
                      id="ollama-embed-endpoint-mix"
                      type="text"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      onBlur={handleEndpointBlur}
                      placeholder="http://127.0.0.1:11434/v1"
                      className="api-key-input"
                    />
                    <p className="settings-hint">Default: http://127.0.0.1:11434/v1</p>
                  </div>
                  <div className="settings-field">
                    <label htmlFor="ollama-embed-model-mix">Ollama Embedding Model</label>
                    <input
                      id="ollama-embed-model-mix"
                      type="text"
                      list="available-embeddings-list-mix"
                      value={embeddingModel}
                      onChange={(e) => setEmbeddingModel(e.target.value)}
                      placeholder="nomic-embed-text"
                      className="api-key-input"
                    />
                    <datalist id="available-embeddings-list-mix">
                      {availableModels.filter(m => m.includes('embed') || m.includes('nomic')).map((m) => (
                        <option key={m} value={m} />
                      ))}
                      {availableModels.length > 0 && !availableModels.some(m => m.includes('embed') || m.includes('nomic')) &&
                        availableModels.map((m) => (
                          <option key={m} value={m} />
                        ))
                      }
                    </datalist>
                    <p className="settings-hint">Default: nomic-embed-text</p>
                  </div>
                </div>
              )}

              <div className="settings-field">
                <label htmlFor="openai-endpoint">OpenAI API Endpoint</label>
                <input
                  id="openai-endpoint"
                  type="text"
                  value={openaiEndpoint}
                  onChange={(e) => setOpenaiEndpoint(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="api-key-input"
                />
                <p className="settings-hint">Default: https://api.openai.com/v1. Change only if using a custom proxy or Azure OpenAI.</p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SHARED SETTINGS (both providers)
          ══════════════════════════════════════════════════ */}
          <div className="settings-section">
            <h3>General AI Settings</h3>

            <div className="settings-field" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <label htmlFor="ollama-auto-fix" style={{ cursor: 'pointer', marginBottom: 0 }}>
                  Auto AI Fix Syntax Errors
                </label>
                <p className="settings-hint" style={{ marginTop: '2px' }}>
                  Automatically trigger AI Fix whenever a diagram code syntax error occurs.
                </p>
              </div>
              <input
                id="ollama-auto-fix"
                type="checkbox"
                checked={autoAIFix}
                onChange={(e) => setAutoAIFix(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
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
            <button id="settings-save" onClick={handleSave} className="button-primary">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
