/**
 * AI-powered service for Mermaid diagram generation and fixing using Ollama
 * Enhanced with MCP (Model Context Protocol) diagram awareness.
 */

import {
  buildMCPSystemPromptSupplement,
  buildTemplateReferenceFromCode,
  validateAndSuggestFix,
  buildDiagramTypesContext,
} from './mcpService'
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'

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

export interface OllamaConfig {
  endpoint: string
  model: string
  embeddingModel?: string
  systemPrompt?: string
  temperature?: number
  generationDepth?: number
  numCtx?: number
}

const DEFAULT_ENDPOINT = 'http://127.0.0.1:11434/v1'
const DEFAULT_MODEL = 'gpt-oss:20b'
const DEFAULT_EMBEDDING_MODEL = 'nomic-embed-text'
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
    const isTauri = !!(window as any).__TAURI_INTERNALS__
    const customFetch = isTauri ? tauriFetch : fetch
    const response = await customFetch(endpoint, {
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
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch') || error.message.includes('Connection refused')) {
        throw new Error(`Verbindung zu Ollama fehlgeschlagen (${error.message}). Bitte stelle sicher, dass Ollama im Hintergrund läuft (z. B. durch Ausführen des Befehls 'ollama serve' im Terminal oder Starten der Ollama Desktop-Anwendung) und dein Endpunkt korrekt konfiguriert ist: ${config.endpoint}`)
      }
      throw error
    }
    throw new Error('Ein unbekannter Fehler ist bei der Kommunikation mit der Ollama API aufgetreten.')
  }
}

export async function generateEmbedding(text: string, config: OllamaConfig): Promise<number[]> {
  const baseUrl = getBaseUrl(config.endpoint).replace('localhost', '127.0.0.1')
  const endpoint = `${baseUrl}/api/embeddings`

  const isTauri = !!(window as any).__TAURI_INTERNALS__
  const customFetch = isTauri ? tauriFetch : fetch

  try {
    const response = await customFetch(endpoint, {
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
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch') || error.message.includes('Connection refused')) {
        throw new Error(`Verbindung zu Ollama für Embeddings fehlgeschlagen (${error.message}). Bitte stelle sicher, dass Ollama läuft und dein Endpunkt korrekt konfiguriert ist: ${config.endpoint}`)
      }
      throw error
    }
    throw new Error('Ein unbekannter Fehler ist bei der Kommunikation mit der Ollama Embedding API aufgetreten.')
  }
}

export async function getAvailableModels(endpoint: string): Promise<string[]> {
  const baseUrl = getBaseUrl(endpoint).replace('localhost', '127.0.0.1')
  const tagsUrl = `${baseUrl}/api/tags`

  const isTauri = !!(window as any).__TAURI_INTERNALS__

  async function performFetch(url: string) {
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
    const response = await performFetch(tagsUrl)

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



export function cleanCode(code: string): string {
  let cleaned = code

  // If [CODE_START] is present, take everything after it
  if (cleaned.includes('[CODE_START]')) {
    const startIdx = cleaned.indexOf('[CODE_START]')
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


export async function fixMermaidErrorWithAI(
  code: string,
  errorMessage: string,
  config: OllamaConfig
): Promise<string> {
  const systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT

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

  const response = await callOllama(messages, config, 0.2)
  return cleanCode(response)
}

export async function editCodeWithAI(
  code: string,
  instruction: string,
  config: OllamaConfig
): Promise<string> {
  const systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT

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

  return await callOllama(messages, config, 0.3)
}

export async function convertTextToMermaidWithAI(
  textContent: string,
  config: OllamaConfig
): Promise<string> {
  const systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT

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

  const response = await callOllama(messages, config, 0.3)
  return cleanCode(response)
}


export function getStoredConfig(): OllamaConfig {
  const stored = localStorage.getItem('ollama-config')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      return {
        endpoint: parsed.endpoint || DEFAULT_ENDPOINT,
        model: parsed.model || DEFAULT_MODEL,
        embeddingModel: parsed.embeddingModel || DEFAULT_EMBEDDING_MODEL,
        systemPrompt: parsed.systemPrompt, // might be undefined, which is fine, fallback to default
        temperature: parsed.temperature !== undefined ? Number(parsed.temperature) : 0.3,
        generationDepth: parsed.generationDepth !== undefined ? Number(parsed.generationDepth) : 5,
        numCtx: parsed.numCtx !== undefined ? Number(parsed.numCtx) : 16384
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
    numCtx: 16384
  }
}

export function storeConfig(config: OllamaConfig): void {
  localStorage.setItem('ollama-config', JSON.stringify(config))
}

export function clearConfig(): void {
  localStorage.removeItem('ollama-config')
}

export async function askAboutCodeWithAI(
  code: string,
  question: string,
  config: OllamaConfig
): Promise<string> {
  const systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT

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

  return await callOllama(messages, config, 0.7)
}

export async function generateMarkdownReport(
  code: string,
  config: OllamaConfig,
  activeSourcesParam?: string[]
): Promise<string> {
  const systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT

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

  return await callOllama(messages, config, 0.6)
}
