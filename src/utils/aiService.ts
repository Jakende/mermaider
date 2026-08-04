/**
 * AI-powered service for Mermaid diagram generation and fixing.
 * Supports Ollama (local) and OpenAI (cloud) providers.
 * Enhanced with MCP (Model Context Protocol) diagram awareness.
 */

import {
  buildMCPSystemPromptSupplement,
  buildTemplateReferenceFromCode,
  validateAndSuggestFix,
  buildDiagramTypesContext,
} from './mcpService'
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'
import { invoke } from '@tauri-apps/api/core'

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OllamaResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

// ─── Config Types ────────────────────────────────────────────────────────────

export interface OllamaConfig {
  endpoint: string
  model: string
  embeddingModel?: string
  systemPrompt?: string
  temperature?: number
  generationDepth?: number
  numCtx?: number
  autoAIFix?: boolean
  // Provider selection (defaults to 'ollama' when missing)
  provider?: 'ollama' | 'openai'
  // Independent embedding provider — allows mixing e.g. OpenAI chat + Ollama embeddings
  embeddingProvider?: 'ollama' | 'openai'
  // OpenAI-specific fields
  openaiEndpoint?: string
  openaiModel?: string
  openaiEmbeddingModel?: string
  openaiApiKey?: string
  openaiAccessToken?: string
  openaiRefreshToken?: string
  openaiTokenExpiresAt?: number
  openaiAccountId?: string
  openaiIdToken?: string
  openaiAuthType?: 'device' | 'token' | 'apikey'
}

/** Alias kept for semantic clarity in OpenAI-specific code paths */
export type AIConfig = OllamaConfig

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_ENDPOINT = 'http://127.0.0.1:11434/v1'
const DEFAULT_MODEL = 'gpt-oss:20b'
const DEFAULT_EMBEDDING_MODEL = 'nomic-embed-text'

const DEFAULT_OPENAI_ENDPOINT = 'https://api.openai.com/v1'
// OpenAI/Codex models are account-dependent and must be discovered after login.
const DEFAULT_OPENAI_MODEL = ''
const DEFAULT_OPENAI_EMBEDDING_MODEL = ''

interface OpenAISecrets {
  apiKey: string
  accessToken: string
  refreshToken: string
  idToken: string
}

let cachedOpenAISecrets: OpenAISecrets | null = null

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__
}

async function loadOpenAISecrets(): Promise<OpenAISecrets> {
  if (cachedOpenAISecrets) return cachedOpenAISecrets
  if (!isTauriRuntime()) return { apiKey: '', accessToken: '', refreshToken: '', idToken: '' }
  cachedOpenAISecrets = await invoke<OpenAISecrets>('load_openai_secrets')
  return cachedOpenAISecrets
}

async function saveOpenAISecrets(secrets: OpenAISecrets): Promise<void> {
  cachedOpenAISecrets = secrets
  if (isTauriRuntime()) await invoke('save_openai_secrets', { secrets })
}

async function withStoredOpenAISecrets(config: OllamaConfig): Promise<OllamaConfig> {
  if (config.openaiApiKey || config.openaiAccessToken) return config
  const secrets = await loadOpenAISecrets()
  return {
    ...config,
    openaiApiKey: secrets.apiKey,
    openaiAccessToken: secrets.accessToken,
    openaiRefreshToken: secrets.refreshToken,
    openaiIdToken: secrets.idToken,
  }
}

export async function getStoredConfigWithSecrets(): Promise<OllamaConfig> {
  return withStoredOpenAISecrets(getStoredConfig())
}

const DEFAULT_SYSTEM_PROMPT = `You are a deterministic Mermaid.js code generator and editor.

You operate in strict execution modes defined by the user prompt.

GENERAL RULES:
- Output MUST follow the exact required format.
- Do NOT include explanations unless explicitly required.
- NEVER use markdown code fences.
- ALWAYS validate Mermaid syntax before output.

SYNTAX RULES:
- Use "flowchart" instead of "graph" for flow diagrams.
- Use ["Label"] for nodes with spaces or special characters.
- Ensure consistent indentation.
- Avoid unsupported constructs.

VALIDATION STEP (MANDATORY):
Before returning output:
1. Check for syntax errors.
2. Ensure diagram type is valid.
3. Ensure node references are consistent.

FAILURE HANDLING:
If the request is ambiguous:
- Infer the most logical structure based on relationships
- Do NOT ask questions.`

// OpenAI uses the identical Mermaid behavior prompt as Ollama. The only
// difference is its output transport: Codex responses are written directly to
// the editor, so markers and explanatory prose would become invalid Mermaid.
const DEFAULT_OPENAI_SYSTEM_PROMPT = `${DEFAULT_SYSTEM_PROMPT}

OPENAI/CODEX OUTPUT TRANSPORT:
- Return ONLY the final Mermaid source code as plain text.
- Do NOT emit explanations, headings, markdown fences, YAML front matter (--- / config:), [CODE_START], or [CODE_END].
- Emit exactly one complete diagram; never repeat the input or the result.
- After the final Mermaid line, stop.`

function getSystemPrompt(config: OllamaConfig): string {
  if (config.systemPrompt?.trim()) return config.systemPrompt
  return config.provider === 'openai' ? DEFAULT_OPENAI_SYSTEM_PROMPT : DEFAULT_SYSTEM_PROMPT
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getBaseUrl(endpoint: string): string {
  let cleanEndpoint = endpoint.replace(/\/$/, '')
  try {
    const url = new URL(cleanEndpoint)
    return `${url.protocol}//${url.host}`
  } catch (e) {
    return cleanEndpoint.replace('/v1', '')
  }
}

function getTemperature(preferred: number, config: OllamaConfig): number {
  return config.temperature !== undefined ? config.temperature : preferred;
}

async function performFetch(url: string, options: RequestInit) {
  const isTauri = !!(window as any).__TAURI_INTERNALS__
  if (isTauri) {
    // Always use the native HTTP plugin in packaged apps. Falling back to the
    // WebView fetch hides a scope error behind an unhelpful "Load failed" and
    // is subject to CORS in release builds.
    try {
      return await tauriFetch(url, options as any)
    } catch (tauriErr: any) {
      const detail = tauriErr?.message || String(tauriErr)
      throw new Error(`Native HTTP request to ${url} failed: ${detail}`)
    }
  } else {
    return await fetch(url, options)
  }
}

/** Returns the bearer token or API key to use for OpenAI requests, or null if none set. */
function getOpenAIAuthHeader(config: OllamaConfig): string | null {
  if (config.openaiAccessToken) return `Bearer ${config.openaiAccessToken}`
  if (config.openaiApiKey) return `Bearer ${config.openaiApiKey}`
  return null
}

function usesCodexOAuth(config: OllamaConfig): boolean {
  return config.openaiAuthType === 'device' ||
    (config.openaiAuthType === 'token' && !!config.openaiAccessToken)
}

function getJwtClaim(token: string, claim: string): string | undefined {
  try {
    const payload = token.split('.')[1]
    if (!payload) return undefined
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')))
    return typeof json[claim] === 'string'
      ? json[claim]
      : json['https://api.openai.com/auth']?.[claim]
  } catch {
    return undefined
  }
}

function getOpenAIAccountId(config: OllamaConfig): string | undefined {
  return config.openaiAccountId ||
    (config.openaiIdToken && getJwtClaim(config.openaiIdToken, 'chatgpt_account_id')) ||
    (config.openaiAccessToken && getJwtClaim(config.openaiAccessToken, 'chatgpt_account_id'))
}

// ─── Ollama Provider ──────────────────────────────────────────────────────────

async function callOllama(
  messages: OllamaMessage[],
  config: OllamaConfig,
  temperature: number = 0.3
): Promise<string> {
  const finalTemperature = getTemperature(temperature, config);

  // Ensure endpoint ends with /chat/completions if not present, but handle v1 base
  let endpoint = config.endpoint.replace(/\/$/, '')
  if (!endpoint.endsWith('/chat/completions')) {
    if (endpoint.endsWith('/v1')) {
      endpoint += '/chat/completions'
    } else {
      endpoint += '/v1/chat/completions'
    }
  }

  // Windows workaround: fetch might try IPv6 (::1) for localhost while Ollama listens on IPv4 (127.0.0.1)
  endpoint = endpoint.replace('localhost', '127.0.0.1')

  try {
    const response = await performFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: finalTemperature,
        max_tokens: 6000,
        options: {
          num_ctx: config.numCtx || 16384
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errText = typeof errorData.error === 'object' ? errorData.error?.message : errorData.error
      throw new Error(errText || `Ollama API error: ${response.status} ${response.statusText}`)
    }

    const data: OllamaResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error('AI returned an empty choice list. Check if the model is loaded correctly in Ollama.')
    }

    const content = data.choices[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('AI returned an empty response content. This can happen if the model is too restrictive or safety-triggered.')
    }

    return content
  } catch (error: any) {
    const errMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Unbekannter Fehler'

    if (
      errMsg.includes('fetch') || 
      errMsg.includes('NetworkError') || 
      errMsg.includes('Failed to fetch') || 
      errMsg.includes('Connection refused') ||
      errMsg.includes('plugin:http') ||
      errMsg.includes('grant')
    ) {
      throw new Error(`Verbindung zu Ollama fehlgeschlagen (${errMsg}). Bitte stelle sicher, dass Ollama im Hintergrund läuft (z. B. durch Ausführen des Befehls 'ollama serve' im Terminal oder Starten der Ollama Desktop-Anwendung) und dein Endpunkt korrekt konfiguriert ist: ${config.endpoint}`)
    }
    throw new Error(`Ollama API Kommunikation fehlgeschlagen: ${errMsg}`)
  }
}

// ─── OpenAI Provider ──────────────────────────────────────────────────────────

/** ChatGPT/Codex OAuth is not an OpenAI Platform API credential. It must use
 * the ChatGPT backend Responses endpoint, otherwise the Platform API reports
 * misleading billing errors such as "no credits remaining". */
async function callOpenAICodex(
  messages: OllamaMessage[],
  config: OllamaConfig,
  _temperature: number = 0.3
): Promise<string> {
  const authHeader = getOpenAIAuthHeader(config)
  if (!authHeader) throw new Error('OpenAI OAuth authentication is not configured.')

  const endpoint = 'https://chatgpt.com/backend-api/codex/responses'
  const accountId = getOpenAIAccountId(config)
  const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n')
  const input = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role,
    content: [{ type: 'input_text', text: m.content }],
  }))

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'Authorization': authHeader,
    'Originator': 'codex_cli_rs',
    'User-Agent': 'codex-cli',
    'OpenAI-Beta': 'responses=experimental',
    'session_id': crypto.randomUUID(),
  }
  if (accountId) headers['ChatGPT-Account-Id'] = accountId

  const response = await performFetch(endpoint, {
    method: 'POST', headers,
    body: JSON.stringify({
      model: config.openaiModel || (() => {
        throw new Error('No Codex model is selected. Load the available models after signing in.')
      })(),
      instructions: system,
      input,
      stream: true,
      store: false,
    }),
  })

  const raw = await response.text()
  if (!response.ok) {
    throw new Error(`Codex API error: ${raw}`)
  }

  // The Codex endpoint is SSE-first, even for a single response. Some
  // deployments return a plain Responses JSON object, so support both forms.
  let result = ''
  const appendOutput = (event: any) => {
    if (event.type === 'error' || event.type === 'response.error' || event.type === 'response.failed') {
      const error = event.error?.message || event.message || event.response?.error?.message
      if (error) throw new Error(`Codex API error: ${error}`)
    }

    // A Codex response provides the same answer as delta events, output-item
    // events, and a completed event. Use deltas when present; the latter two
    // are fallbacks only. Appending all three caused the triple diagrams.
    if (typeof event.output_text === 'string') {
      result += event.output_text
      return
    }
    if (event.type === 'response.output_text.delta' || event.type === 'response.text.delta') {
      if (typeof event.delta === 'string') result += event.delta
      return
    }
    if (result) return
    if (event.type === 'response.output_text.done' && typeof event.text === 'string') {
      result = event.text
      return
    }
    if (event.item?.content) {
      for (const part of event.item.content) if (typeof part.text === 'string') result += part.text
      if (result) return
    }
    if (event.type === 'response.completed' || event.type === 'response.done') {
      for (const item of event.response?.output || []) for (const part of item.content || []) {
        if (typeof part.text === 'string') result += part.text
      }
    }
  }
  try {
    const json = JSON.parse(raw)
    appendOutput(json)
    if (!result && json.response) appendOutput(json.response)
  } catch { /* SSE response */ }
  for (const line of raw.split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue
    const value = line.slice(5).trim()
    if (!value || value === '[DONE]') continue
    try {
      appendOutput(JSON.parse(value))
    } catch { /* ignore non-JSON SSE keep-alives */ }
  }
  if (!result.trim()) throw new Error('Codex API returned no text output.')
  return result.trim()
}

async function callOpenAI(
  messages: OllamaMessage[],
  config: OllamaConfig,
  temperature: number = 0.3
): Promise<string> {
  const authHeader = getOpenAIAuthHeader(config)
  if (!authHeader) {
    throw new Error('OpenAI authentication is not configured. Please set an API key or log in via Device Code / Browser in Settings.')
  }

  const finalTemperature = getTemperature(temperature, config)
  const baseEndpoint = (config.openaiEndpoint || DEFAULT_OPENAI_ENDPOINT).replace(/\/$/, '')
  const endpoint = baseEndpoint.endsWith('/chat/completions')
    ? baseEndpoint
    : `${baseEndpoint}/chat/completions`

  const model = config.openaiModel || DEFAULT_OPENAI_MODEL
  if (!model) throw new Error('No OpenAI model is selected. Load the available models and choose one in Settings.')

  // o-series models (o1, o3) don't support temperature or system messages
  const isReasoningModel = /^o\d/.test(model)

  const requestMessages = isReasoningModel
    ? messages.filter(m => m.role !== 'system')
    : messages

  const body: Record<string, any> = {
    model,
    messages: requestMessages,
    max_completion_tokens: 6000,
  }

  if (!isReasoningModel) {
    body.temperature = finalTemperature
  }

  try {
    const response = await performFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errText = typeof errorData.error === 'object'
        ? errorData.error?.message
        : (errorData.error || `HTTP ${response.status}`)
      throw new Error(`OpenAI API error: ${errText}`)
    }

    const data: OllamaResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error('OpenAI returned an empty choice list.')
    }

    const content = data.choices[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('OpenAI returned an empty response. The model may have been safety-triggered or the prompt is too long.')
    }

    return content
  } catch (error: any) {
    const errMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Unknown error'
    throw new Error(`OpenAI API communication failed: ${errMsg}`)
  }
}

/** Internal dispatcher: routes to Ollama or OpenAI based on config.provider */
async function callAI(
  messages: OllamaMessage[],
  config: OllamaConfig,
  temperature: number = 0.3
): Promise<string> {
  config = await withStoredOpenAISecrets(config)
  if (config.provider === 'openai') {
    return usesCodexOAuth(config)
      ? callOpenAICodex(messages, config, temperature)
      : callOpenAI(messages, config, temperature)
  }
  return callOllama(messages, config, temperature)
}

// ─── Embeddings ───────────────────────────────────────────────────────────────

async function generateOpenAIEmbedding(text: string, config: OllamaConfig): Promise<number[]> {
  const authHeader = getOpenAIAuthHeader(config)
  if (!authHeader) {
    throw new Error('OpenAI authentication is not configured. Cannot generate embeddings.')
  }

  const baseEndpoint = (config.openaiEndpoint || DEFAULT_OPENAI_ENDPOINT).replace(/\/$/, '')
  const endpoint = `${baseEndpoint}/embeddings`

  try {
    const response = await performFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        model: config.openaiEmbeddingModel || DEFAULT_OPENAI_EMBEDDING_MODEL,
        input: text,
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errText = typeof errorData.error === 'object'
        ? errorData.error?.message
        : (errorData.error || `HTTP ${response.status}`)
      throw new Error(`OpenAI Embeddings API error: ${errText}`)
    }

    const data = await response.json()
    if (!data.data || !data.data[0]?.embedding) {
      throw new Error('OpenAI Embeddings API returned unexpected data structure.')
    }
    return data.data[0].embedding as number[]
  } catch (error: any) {
    const errMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Unknown error'
    throw new Error(`OpenAI Embeddings communication failed: ${errMsg}`)
  }
}

export async function generateEmbedding(text: string, config: OllamaConfig): Promise<number[]> {
  config = await withStoredOpenAISecrets(config)
  // embeddingProvider is independent of the chat provider, defaulting to the chat provider
  const effectiveEmbedProvider = config.embeddingProvider ?? config.provider ?? 'ollama'
  if (effectiveEmbedProvider === 'openai') {
    if (usesCodexOAuth(config)) {
      throw new Error('OpenAI Codex account authentication does not provide the Platform Embeddings API. Use an API key or Ollama embeddings for the knowledge base.')
    }
    return generateOpenAIEmbedding(text, config)
  }

  // Ollama embedding path (unchanged)
  const baseUrl = getBaseUrl(config.endpoint).replace('localhost', '127.0.0.1')
  const endpoint = `${baseUrl}/api/embeddings`

  try {
    const response = await performFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.embeddingModel || DEFAULT_EMBEDDING_MODEL,
        prompt: text,
        options: {
          num_ctx: config.numCtx || 16384
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errText = typeof errorData.error === 'object' ? errorData.error?.message : errorData.error
      throw new Error(errText || `Ollama Embedding API error: ${response.status}`)
    }

    const data = await response.json()
    return data.embedding
  } catch (error: any) {
    const errMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Unbekannter Fehler'

    if (
      errMsg.includes('fetch') || 
      errMsg.includes('NetworkError') || 
      errMsg.includes('Failed to fetch') || 
      errMsg.includes('Connection refused') ||
      errMsg.includes('plugin:http') ||
      errMsg.includes('grant')
    ) {
      throw new Error(`Verbindung zu Ollama für Embeddings fehlgeschlagen (${errMsg}). Bitte stelle sicher, dass Ollama läuft und dein Endpunkt korrekt konfiguriert ist: ${config.endpoint}`)
    }
    throw new Error(`Ollama Embedding Kommunikation fehlgeschlagen: ${errMsg}`)
  }
}

// ─── Ollama Model Discovery ───────────────────────────────────────────────────

export async function getAvailableModels(endpoint: string): Promise<string[]> {
  const baseUrl = getBaseUrl(endpoint).replace('localhost', '127.0.0.1')
  const tagsUrl = `${baseUrl}/api/tags`

  const isTauri = !!(window as any).__TAURI_INTERNALS__

  async function performFetchLocal(url: string) {
    if (isTauri) {
      try {
        return await tauriFetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
      } catch (tauriErr) {
        // Fallback to native window.fetch if tauriFetch fails (e.g. plugin IPC issues)
        console.warn('tauriFetch failed in getAvailableModels, falling back to window.fetch:', tauriErr)
        return await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
      }
    } else {
      return await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
    }
  }

  try {
    const response = await performFetchLocal(tagsUrl)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errText = typeof errorData.error === 'object' ? errorData.error?.message : errorData.error
      throw new Error(errText || `Ollama API HTTP Fehler: ${response.status}`)
    }

    const data = await response.json()
    if (data && Array.isArray(data.models)) {
      return data.models.map((m: any) => m.name)
    }
    return []
  } catch (error: any) {
    const errMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Unbekannter Fehler'
    
    if (
      errMsg.includes('fetch') || 
      errMsg.includes('NetworkError') || 
      errMsg.includes('Failed to fetch') || 
      errMsg.includes('Connection refused') ||
      errMsg.includes('plugin:http') ||
      errMsg.includes('grant')
    ) {
      throw new Error(`Verbindung zu Ollama unter '${tagsUrl}' fehlgeschlagen (${errMsg}). Bitte überprüfe, ob die Ollama Desktop-Anwendung läuft oder führe 'ollama serve' im Terminal aus.`)
    }
    
    throw new Error(`Fehler beim Abrufen der Ollama-Modelle: ${errMsg}`)
  }
}

export async function testOllamaConnection(
  endpoint: string,
  model: string,
  embeddingModel: string
): Promise<{ success: boolean; message: string }> {
  try {
    const models = await getAvailableModels(endpoint)
    
    const cleanModel = model.trim().toLowerCase()
    const cleanEmbeddingModel = embeddingModel.trim().toLowerCase()
    
    const hasModel = models.some(m => {
      const name = m.toLowerCase()
      return name === cleanModel || 
             name === `${cleanModel}:latest` || 
             cleanModel === `${name}:latest` ||
             name.split(':')[0] === cleanModel.split(':')[0]
    })
    
    const hasEmbeddingModel = models.some(m => {
      const name = m.toLowerCase()
      return name === cleanEmbeddingModel || 
             name === `${cleanEmbeddingModel}:latest` || 
             cleanEmbeddingModel === `${name}:latest` ||
             name.split(':')[0] === cleanEmbeddingModel.split(':')[0]
    })
    
    if (!hasModel) {
      return {
        success: false,
        message: `Ollama läuft, aber das Chat-Modell '${model}' wurde lokal nicht gefunden. Bitte führe 'ollama pull ${model}' in deinem Terminal aus oder wähle ein anderes Modell in den Einstellungen.`
      }
    }
    
    if (!hasEmbeddingModel) {
      return {
        success: true,
        message: `Ollama läuft und das Modell '${model}' ist bereit! Das Embedding-Modell '${embeddingModel}' wurde jedoch nicht gefunden. Der Chat funktioniert, aber die Wissensdatenbank (RAG) könnte fehlschlagen. Du kannst es mit 'ollama pull ${embeddingModel}' herunterladen.`
      }
    }
    
    return {
      success: true,
      message: `Erfolg! Verbindung verifiziert. Sowohl '${model}' als auch '${embeddingModel}' sind installiert und betriebsbereit.`
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unbekannter Verbindungsfehler'
    }
  }
}

// ─── OpenAI Model Discovery & Connection Test ─────────────────────────────────

/**
 * Fetches available models from the OpenAI /v1/models endpoint.
 * Falls back to the well-known list if the request fails (e.g. network issues).
 */
export async function getAvailableOpenAIModels(config: OllamaConfig): Promise<{ chat: string[]; embedding: string[] }> {
  config = await withStoredOpenAISecrets(config)
  const authHeader = getOpenAIAuthHeader(config)
  if (!authHeader) {
    return { chat: [], embedding: [] }
  }

  const baseEndpoint = usesCodexOAuth(config)
    ? 'https://chatgpt.com/backend-api/codex'
    : (config.openaiEndpoint || DEFAULT_OPENAI_ENDPOINT).replace(/\/$/, '')
  // Codex expects a semantic Codex client version, not the integer `1`.
  const modelsUrl = `${baseEndpoint}/models${usesCodexOAuth(config) ? '?client_version=0.99.0' : ''}`

  try {
    const headers: Record<string, string> = { 'Authorization': authHeader, 'Accept': 'application/json' }
    const accountId = getOpenAIAccountId(config)
    if (usesCodexOAuth(config)) {
      headers['Originator'] = 'codex_cli_rs'
      headers['User-Agent'] = 'codex-cli'
      headers['session_id'] = crypto.randomUUID()
      if (accountId) headers['ChatGPT-Account-Id'] = accountId
    }
    // Support both Codex's single catalog response and OpenAI-compatible
    // paginated model lists. Continue until the server says there is no page.
    const modelItems: any[] = []
    let pageUrl: string | null = modelsUrl
    for (let page = 0; pageUrl && page < 20; page++) {
      const response = await performFetch(pageUrl, { method: 'GET', headers })
      if (!response.ok) return { chat: [], embedding: [] }
      const data = await response.json()
      const items = Array.isArray(data) ? data : (data.data || data.models || [])
      modelItems.push(...items)
      const after = data?.last_id || data?.next_page || data?.next
      pageUrl = data?.has_more && after
        ? `${modelsUrl}${modelsUrl.includes('?') ? '&' : '?'}after=${encodeURIComponent(after)}`
        : null
    }
    const allModels: string[] = modelItems.map((m: any) => typeof m === 'string' ? m : (m.id || m.slug || m.model) as string).filter(Boolean)

    const embeddingModels = allModels.filter(id =>
      id.toLowerCase().includes('embed') || id.toLowerCase().includes('embedding')
    )
    // The Codex catalog is account-scoped. Return every entry exactly as the
    // backend provides it rather than applying an assumed model-name filter.
    // This keeps newly released and account-specific model slugs selectable.
    const chatModels = usesCodexOAuth(config)
      ? allModels
      : allModels.filter(id => id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3'))

    return { chat: [...new Set(chatModels)], embedding: [...new Set(embeddingModels)] }
  } catch {
    return { chat: [], embedding: [] }
  }
}

/**
 * Tests the OpenAI connection by sending a minimal chat completion request.
 */
export async function testOpenAIConnection(config: OllamaConfig): Promise<{ success: boolean; message: string }> {
  config = await withStoredOpenAISecrets(config)
  const authHeader = getOpenAIAuthHeader(config)
  if (!authHeader) {
    return {
      success: false,
      message: 'No OpenAI credentials configured. Please set an API key or log in via Device Code / Browser.'
    }
  }

  try {
    const response = await callAI(
      [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Reply with exactly: OK' }
      ],
      { ...config },
      0.0
    )
    const model = config.openaiModel || DEFAULT_OPENAI_MODEL
    return {
      success: true,
      message: `Connection successful! Model '${model}' responded: "${response.substring(0, 80)}"`
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown OpenAI connection error'
    }
  }
}

// ─── OpenAI Device Code / OAuth Flow ─────────────────────────────────────────

export interface OpenAIDeviceAuthResponse {
  device_code: string
  user_code: string
  verification_uri: string
  verification_uri_complete?: string
  expires_in: number
  interval: number
}

export interface OpenAITokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  id_token?: string
  error?: string
  error_description?: string
}

interface OpenAIDeviceCodeResponse {
  device_auth_id: string
  user_code?: string
  usercode?: string
  interval?: number | string
}

interface OpenAIDeviceTokenResponse {
  authorization_code: string
  code_verifier: string
}

/**
 * Initiates the OpenAI Device Authorization Grant flow.
 * The returned object contains the user_code to display and verification_uri to open in a browser.
 *
 * OpenAI's current Codex device flow is not the RFC 8628 endpoint
 * `/oauth/device/code`. It uses the account device-auth endpoints below and
 * returns an authorization code which must subsequently be exchanged at the
 * OAuth token endpoint.
 */
export async function startOpenAIDeviceAuth(_config: OllamaConfig): Promise<OpenAIDeviceAuthResponse> {
  const authBase = 'https://auth.openai.com'
  const deviceAuthUrl = `${authBase}/api/accounts/deviceauth/usercode`
  const clientId = 'app_EMoamEEZ73f0CkXaXp7hrann'

  try {
    const response = await performFetch(deviceAuthUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: clientId })
    })

    const body = await response.text()
    if (!response.ok) {
      throw new Error(`Device auth initiation failed (HTTP ${response.status}): ${body}`)
    }

    const data = JSON.parse(body) as OpenAIDeviceCodeResponse
    const userCode = data.user_code || data.usercode
    if (!data.device_auth_id || !userCode) {
      throw new Error('Device auth response did not contain device_auth_id and user_code')
    }

    return {
      device_code: data.device_auth_id,
      user_code: userCode,
      verification_uri: `${authBase}/codex/device`,
      expires_in: 15 * 60,
      interval: typeof data.interval === 'string' ? Number(data.interval) || 5 : data.interval || 5,
    }
  } catch (error: any) {
    throw new Error(`Failed to start OpenAI device auth: ${error?.message || error}`)
  }
}

/**
 * Polls the OpenAI token endpoint for the result of the Device Code flow.
 * Returns the token response. Check `.error` for 'authorization_pending' or 'slow_down'.
 */
export async function pollOpenAIDeviceToken(
  deviceCode: string,
  userCode: string,
  _config: OllamaConfig
): Promise<OpenAITokenResponse> {
  const oauthBase = 'https://auth.openai.com'
  const deviceTokenUrl = `${oauthBase}/api/accounts/deviceauth/token`
  const tokenUrl = `${oauthBase}/oauth/token`
  const clientId = 'app_EMoamEEZ73f0CkXaXp7hrann'

  try {
    const response = await performFetch(deviceTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ device_auth_id: deviceCode, user_code: userCode })
    })

    const body = await response.text()
    // 403/404 means the user has not completed the browser step yet.
    if (response.status === 403 || response.status === 404) {
      return { access_token: '', token_type: '', error: 'authorization_pending' }
    }
    if (!response.ok) {
      let error: any = {}
      try { error = JSON.parse(body) } catch { /* retain raw response below */ }
      return { access_token: '', token_type: '', error: error.error || `HTTP ${response.status}`, error_description: error.error_description || body }
    }

    const device = JSON.parse(body) as OpenAIDeviceTokenResponse
    const tokenResponse = await performFetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code: device.authorization_code,
        code_verifier: device.code_verifier,
        redirect_uri: `${oauthBase}/deviceauth/callback`,
      }).toString()
    })
    const tokenBody = await tokenResponse.text()
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed (HTTP ${tokenResponse.status}): ${tokenBody}`)
    }
    return JSON.parse(tokenBody) as OpenAITokenResponse
  } catch (error: any) {
    throw new Error(`Failed to poll OpenAI device token: ${error?.message || error}`)
  }
}

// ─── Code Utilities ───────────────────────────────────────────────────────────

function stripOpenAIFrontmatter(code: string): string {
  const trimmed = code.trimStart()
  if (!trimmed.startsWith('---')) return code

  // Codex can emit a YAML `config:` preamble despite the output contract.
  // Remove it through its closing delimiter, or to the Mermaid declaration.
  const closed = trimmed.indexOf('\n---', 3)
  if (closed >= 0) return trimmed.slice(closed + 4).trimStart()
  const diagramStart = trimmed.search(/^\s*(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|quadrantChart|xychart-beta|sankey-beta|block-beta|C4Context|requirementDiagram)\b/m)
  return diagramStart >= 0 ? trimmed.slice(diagramStart) : code
}

function cleanGeneratedCode(code: string, config: OllamaConfig): string {
  return cleanCode(config.provider === 'openai' ? stripOpenAIFrontmatter(code) : code)
}

export function cleanCode(code: string): string {
  let cleaned = code

  // Repeated prior answers may contain multiple markers. The final block is
  // authoritative; retaining the first one would preserve duplicated code.
  if (cleaned.includes('[CODE_START]')) {
    const startIdx = cleaned.lastIndexOf('[CODE_START]')
    cleaned = cleaned.substring(startIdx + '[CODE_START]'.length)
  }

  // If [CODE_END] is present, take everything before it
  if (cleaned.includes('[CODE_END]')) {
    cleaned = cleaned.split('[CODE_END]')[0]
  }

  cleaned = cleaned
    .replace(/^```mermaid\s */i, '')
    .replace(/^```\w*\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()

  // MCP post-validation: auto-fix common issues
  const { code: validatedCode, wasFixed, fixDescription } = validateAndSuggestFix(cleaned)
  if (wasFixed) {
    console.log(`[MCP] Auto-fix applied: ${fixDescription}`)
  }

  return validatedCode
}

// ─── AI Operations (public API — unchanged signatures) ────────────────────────

export async function fixMermaidErrorWithAI(
  code: string,
  errorMessage: string,
  config: OllamaConfig
): Promise<string> {
  const systemPrompt = getSystemPrompt(config)

  // MCP: provide syntax reference for the detected diagram type
  const mcpContext = buildMCPSystemPromptSupplement(code)
  const templateRef = buildTemplateReferenceFromCode(code)

  const userPrompt = `[MODE: FIX]

You must:
- Fix ONLY what is necessary
- Preserve original structure
- Do NOT redesign the diagram
${templateRef ? `\nUse this correct syntax reference for the diagram type:\n${templateRef}\n` : ''}
Validation required.

Error:
${errorMessage}

Broken Code:
${code}

FINAL CHECK:
- Did you only fix the error?
- Is the new code valid Mermaid syntax?
If not -> fix before output.

OUTPUT FORMAT:
Explanation: max 2 sentences
[CODE_START]
<valid Mermaid code>`

  const messages: OllamaMessage[] = [
    { role: 'system', content: systemPrompt + mcpContext },
    { role: 'user', content: userPrompt }
  ]

  const response = await callAI(messages, config, 0.2)
  return cleanGeneratedCode(response, config)
}

export async function editCodeWithAI(
  code: string,
  instruction: string,
  config: OllamaConfig
): Promise<string> {
  const systemPrompt = getSystemPrompt(config)

  // MCP: enrich with diagram type context
  const mcpContext = buildMCPSystemPromptSupplement(code)

  const userPrompt = `[MODE: EDIT]

Instruction:
"${instruction}"

Constraints:
- Apply ONLY requested changes
- Keep naming, structure, and layout unless explicitly changed
- No additional improvements
- Target depth/complexity of changes (1-10): ${config.generationDepth ?? 5}

Current Code:
${code}

FINAL CHECK:
- Is the Mermaid code valid?
- Are all nodes defined?
- Are there syntax violations?
If yes -> fix before output.

OUTPUT FORMAT:
Explanation: max 2 sentences
[CODE_START]
<updated Mermaid code>`

  const messages: OllamaMessage[] = [
    { role: 'system', content: systemPrompt + mcpContext },
    { role: 'user', content: userPrompt }
  ]

  return cleanGeneratedCode(await callAI(messages, config, 0.3), config)
}

export async function convertTextToMermaidWithAI(
  textContent: string,
  config: OllamaConfig
): Promise<string> {
  const systemPrompt = getSystemPrompt(config)

  // MCP: provide full diagram types catalog so the AI picks the best one
  const diagramCatalog = buildDiagramTypesContext()
  const mcpContext = buildMCPSystemPromptSupplement()

  const userPrompt = `[MODE: GENERATE]

Input:
${textContent}

${diagramCatalog}

TASK:
- STEP 1: Identify entities
- STEP 2: Identify relationships
- STEP 3: Choose the most appropriate diagram type from the AVAILABLE MERMAID DIAGRAM TYPES listed above

Complexity and Detail Depth Level: ${config.generationDepth ?? 5}/10 (1 = very high-level/simple, 10 = extremely detailed with many nodes and explanations).

Then generate code representing the hierarchy and relationships clearly based on the specified depth level.

FINAL CHECK:
- Is the Mermaid code valid?
- Are all nodes defined?
- Are there syntax violations?
If yes -> fix before output.

OUTPUT FORMAT:
Explanation (mapping logic: max 3 sentences)
[CODE_START]
<mermaid code>`

  const messages: OllamaMessage[] = [
    { role: 'system', content: systemPrompt + mcpContext },
    { role: 'user', content: userPrompt }
  ]

  const response = await callAI(messages, config, 0.3)
  return cleanGeneratedCode(response, config)
}


export function getStoredConfig(): OllamaConfig {
  const stored = localStorage.getItem('ollama-config')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      const hasLegacySecrets = Boolean(
        parsed.openaiApiKey || parsed.openaiAccessToken || parsed.openaiRefreshToken || parsed.openaiIdToken
      )
      if (hasLegacySecrets && isTauriRuntime()) {
        // One-time migration: retain the parsed values for this call, move them
        // to Keychain/Credential Manager, then immediately remove plaintext.
        void saveOpenAISecrets({
          apiKey: parsed.openaiApiKey || '',
          accessToken: parsed.openaiAccessToken || '',
          refreshToken: parsed.openaiRefreshToken || '',
          idToken: parsed.openaiIdToken || '',
        }).then(() => {
          delete parsed.openaiApiKey
          delete parsed.openaiAccessToken
          delete parsed.openaiRefreshToken
          delete parsed.openaiIdToken
          localStorage.setItem('ollama-config', JSON.stringify(parsed))
        }).catch(error => console.error('Failed to migrate OpenAI credentials to secure storage', error))
      }
      return {
        // Ollama fields
        endpoint: parsed.endpoint || DEFAULT_ENDPOINT,
        model: parsed.model || DEFAULT_MODEL,
        embeddingModel: parsed.embeddingModel || DEFAULT_EMBEDDING_MODEL,
        systemPrompt: parsed.systemPrompt, // might be undefined, which is fine, fallback to default
        temperature: parsed.temperature !== undefined ? Number(parsed.temperature) : 0.3,
        generationDepth: parsed.generationDepth !== undefined ? Number(parsed.generationDepth) : 5,
        numCtx: parsed.numCtx !== undefined ? Number(parsed.numCtx) : 16384,
        autoAIFix: parsed.autoAIFix !== undefined ? Boolean(parsed.autoAIFix) : false,
        // Provider
        provider: parsed.provider === 'openai' ? 'openai' : 'ollama',
        embeddingProvider: parsed.embeddingProvider === 'openai' ? 'openai' : parsed.embeddingProvider === 'ollama' ? 'ollama' : undefined,
        // OpenAI fields
        openaiEndpoint: parsed.openaiEndpoint || DEFAULT_OPENAI_ENDPOINT,
        openaiModel: parsed.openaiModel || DEFAULT_OPENAI_MODEL,
        openaiEmbeddingModel: parsed.openaiEmbeddingModel || DEFAULT_OPENAI_EMBEDDING_MODEL,
        openaiApiKey: parsed.openaiApiKey || '',
        openaiAccessToken: parsed.openaiAccessToken || '',
        openaiRefreshToken: parsed.openaiRefreshToken || '',
        openaiIdToken: parsed.openaiIdToken || '',
        openaiTokenExpiresAt: parsed.openaiTokenExpiresAt,
        openaiAuthType: parsed.openaiAuthType || 'apikey',
      }
    } catch (e) {
      console.error('Failed to parse stored config', e)
    }
  }
  return {
    endpoint: DEFAULT_ENDPOINT,
    model: DEFAULT_MODEL,
    embeddingModel: DEFAULT_EMBEDDING_MODEL,
    temperature: 0.3,
    generationDepth: 5,
    numCtx: 16384,
    autoAIFix: false,
    provider: 'ollama',
    embeddingProvider: undefined,
    openaiEndpoint: DEFAULT_OPENAI_ENDPOINT,
    openaiModel: DEFAULT_OPENAI_MODEL,
    openaiEmbeddingModel: DEFAULT_OPENAI_EMBEDDING_MODEL,
    openaiApiKey: '',
    openaiAccessToken: '',
    openaiRefreshToken: '',
    openaiAuthType: 'apikey',
  }
}

export function storeConfig(config: OllamaConfig): void {
  const secrets: OpenAISecrets = {
    apiKey: config.openaiApiKey || '',
    accessToken: config.openaiAccessToken || '',
    refreshToken: config.openaiRefreshToken || '',
    idToken: config.openaiIdToken || '',
  }
  // Tauri persists secrets in the operating system credential store. Settings
  // metadata remains in localStorage, but never API keys or OAuth tokens.
  void saveOpenAISecrets(secrets).catch(error => console.error('Failed to save OpenAI credentials securely', error))
  const { openaiApiKey, openaiAccessToken, openaiRefreshToken, openaiIdToken, ...safeConfig } = config
  void openaiApiKey; void openaiAccessToken; void openaiRefreshToken; void openaiIdToken
  localStorage.setItem('ollama-config', JSON.stringify(safeConfig))
}

export function clearConfig(): void {
  cachedOpenAISecrets = null
  if (isTauriRuntime()) {
    void invoke('clear_openai_secrets').catch(error => console.error('Failed to clear OpenAI credentials securely', error))
  }
  localStorage.removeItem('ollama-config')
}

export async function askAboutCodeWithAI(
  code: string,
  question: string,
  config: OllamaConfig
): Promise<string> {
  const systemPrompt = getSystemPrompt(config)

  // MCP: enrich with diagram awareness
  const mcpContext = buildMCPSystemPromptSupplement(code)

  const userPrompt = `[MODE: ANALYZE]

Current Code:
${code}

Question:
"${question}"

Provide:
1. Diagram type
2. Key components
3. Relationships
4. Structural issues (if any)
5. Answer to the question.

NO code generation unless explicitly required.

FINAL CHECK:
- Did you answer the user's question accurately?
- Did you provide the analysis without generating new Mermaid code?`

  const messages: OllamaMessage[] = [
    { role: 'system', content: systemPrompt + mcpContext },
    { role: 'user', content: userPrompt }
  ]

  return await callAI(messages, config, 0.7)
}

export async function generateMarkdownReport(
  code: string,
  config: OllamaConfig,
  activeSourcesParam?: string[]
): Promise<string> {
  const systemPrompt = getSystemPrompt(config)

  // MCP: enrich with diagram awareness for better report generation
  const mcpContext = buildMCPSystemPromptSupplement(code)

  let contextString = ""
  try {
    const { searchSimilar } = await import('./vectorStore')
    const queryEmbedding = await generateEmbedding(code, config)
    const similarDocs = await searchSimilar(queryEmbedding, 5, activeSourcesParam)
    if (similarDocs.length > 0) {
      contextString = similarDocs.map(d => `[Source: ${d.source}]\n${d.textChunk}`).join('\n\n')
    }
  } catch (err) {
    console.warn('Could not fetch context for report', err)
  }

  const userPrompt = `[MODE: REPORT]

Diagram Code:
${code}

CONTEXT (MANDATORY USE):
${contextString || '(No contextual sources provided)'}

You MUST:
- Include and explain ALL elements (nodes, relationships, etc.) of the provided graph in your report.
- Reference context explicitly.
- Integrate sources into explanation.
If context is ignored -> response is invalid.

FINAL CHECK:
- Did you explain ALL elements of the graph?
- Did you format the sources correctly?

OUTPUT FORMAT:
Write a clear, structured markdown report with different heading levels explaining the diagram and the process.
At the BEGINNING of the report, add a section called 'Overall Summary' (using an H2 heading) that provides a high-level summary of the entire diagram.
At the very end of the report, use an exactly named H1 heading '# Sources'.
Under this heading, list ALL the unique sources provided in the context (if any) in BibTeX format.
CRITICAL: For sources provided from the context (RAG) or generated by the AI: if they do not contain an explicitly mentioned year, use the current year (${new Date().getFullYear()}) in their BibTeX entry. Do NOT overwrite existing years in sources that already have one.`

  const messages: OllamaMessage[] = [
    { role: 'system', content: systemPrompt + mcpContext },
    { role: 'user', content: userPrompt }
  ]

  return await callAI(messages, config, 0.6)
}
