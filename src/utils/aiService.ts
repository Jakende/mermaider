/**
 * AI-powered service for Mermaid diagram generation and fixing using Ollama
 */

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
  systemPrompt?: string
}

const DEFAULT_ENDPOINT = 'http://127.0.0.1:11434/v1'
const DEFAULT_MODEL = 'gpt-oss:20b'
const DEFAULT_SYSTEM_PROMPT = `You are a helpful and technical Mermaid.js assistant.
Your goal is to help the user with their diagrams, whether it's fixing syntax, editing structure, generating new diagrams, or analyzing relationships.

[SUPPORTED DIAGRAMS]
You support all standard Mermaid types:
- Flowcharts (flowchart / graph)
- Sequence Diagrams (sequenceDiagram)
- Class Diagrams (classDiagram)
- State Diagrams (stateDiagram-v2 / stateDiagram)
- Entity Relationship Diagrams (erDiagram)
- Gantt Charts (gantt)
- Pie Charts (pie)
- Git Graphs (gitGraph)
- User Journeys (journey)

[SYNTAX & STYLE]
- Always use double quotes for labels with special characters: ["My Label"].
- Prefer "flowchart" over "graph" for flow diagrams.
- Use stateDiagram-v2 for state diagrams if possible.
- Use clear indentation and logical structure.
- NEVER use markdown code blocks (backticks) for Mermaid code.

[COMMUNICATION]
- Be technical and direct. Avoid small talk.
- FOR EDITS: Provide 2-4 sentences explaining the changes, then the tag "[CODE_START]" followed by the raw code.
- FOR ANALYSIS (ASK mode): Provide a structured response using Markdown. Interpret terms like "knot", "box", or "bubble" as nodes.

[MODELS]
- If you are unsure about a specific term, interpret it in the context of the current diagram structure.
- If you are asked to generate a new diagram, provide a structured response using Markdown.`


async function callOllama(
  messages: OllamaMessage[],
  config: OllamaConfig,
  temperature: number = 0.3
): Promise<string> {
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
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        max_tokens: 6000
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `Ollama API error: ${response.status} ${response.statusText}`)
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
      throw error
    }
    throw new Error('Unknown error occurred while calling Ollama API')
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

  return cleaned
    .replace(/^```mermaid\s*/i, '')
    .replace(/^```\w*\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
}


export async function fixMermaidErrorWithAI(
  code: string,
  errorMessage: string,
  config: OllamaConfig
): Promise<string> {
  const systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT

  const userPrompt = `Fix this Mermaid syntax error:

Error: ${errorMessage}

Broken Code:
${code}

Provide the brief explanation followed by the fixed code:`

  const messages: OllamaMessage[] = [
    { role: 'system', content: systemPrompt },
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

  const userPrompt = `Edit the following Mermaid code based on this instruction: "${instruction}"

Current Code:
${code}

Provide the brief explanation of changes followed by the updated code.`

  const messages: OllamaMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]

  return await callOllama(messages, config, 0.3)
}

export async function convertJsonToMermaidWithAI(
  jsonContent: string,
  config: OllamaConfig
): Promise<string> {
  const systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT

  const userPrompt = `Convert the following JSON data to a Mermaid flowchart or diagram that best represents the structure and relationships described in the data.

JSON Data:
${jsonContent}

Provide a brief explanation of how you mapped the JSON to Mermaid, followed by the "[CODE_START]" tag and the raw Mermaid code.`

  const messages: OllamaMessage[] = [
    { role: 'system', content: systemPrompt },
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
        systemPrompt: parsed.systemPrompt // might be undefined, which is fine, fallback to default
      }
    } catch (e) {
      console.error('Failed to parse stored config', e)
    }
  }
  return {
    endpoint: DEFAULT_ENDPOINT,
    model: DEFAULT_MODEL
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

  const userPrompt = `Analyze the following Mermaid diagram and answer this question: "${question}"

Current Code:
${code}

Provide your analysis. Do not include a new code block unless it's necessary for the answer.`

  const messages: OllamaMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]

  return await callOllama(messages, config, 0.7)
}
