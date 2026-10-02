/** Browser transport: local providers stay local; hosted providers use Appwrite. */
export const HOSTED_AI = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  project: '6abe2e810023326f2b87',
  functionId: 'mermaider-ai-gateway',
}
export async function browserProviderFetch(url: string, options: RequestInit): Promise<Response> {
  const target = new URL(url)
  if (['chatgpt.com', 'auth.openai.com'].includes(target.hostname)) {
    throw new Error('ChatGPT/Codex account login is available in the desktop app. For the web app, connect with an OpenAI API key; a ChatGPT subscription does not include API access.')
  }
  const hosted = ['api.openai.com', 'api.typesafe.ai'].includes(target.hostname)
  try {
    if (!hosted) return await fetch(url, { ...options, credentials: 'omit' })
    const authorization = new Headers(options.headers).get('authorization') || ''
    const response = await fetch(`${HOSTED_AI.endpoint}/functions/${HOSTED_AI.functionId}/executions`, {
      method: 'POST', credentials: 'omit', signal: options.signal,
      headers: { 'X-Appwrite-Project': HOSTED_AI.project, 'Content-Type': 'application/json' },
      body: JSON.stringify({ async: false, path: '/request', method: 'POST', body: JSON.stringify({
        url, method: options.method || 'GET', authorization, body: options.body || undefined,
      }) }),
    })
    if (!response.ok) throw new Error(`Hosted AI service returned HTTP ${response.status}. ${response.status === 429 ? 'Too many requests; please wait and retry.' : 'Please retry or check the service configuration.'}`)
    const execution = await response.json()
    if (execution.status !== 'completed' || !Number.isInteger(execution.responseStatusCode) || execution.responseStatusCode < 200 || execution.responseStatusCode > 599 || typeof execution.responseBody !== 'string') {
      throw new Error('Hosted AI request did not complete. Please retry; if this persists, check the service deployment.')
    }
    const headers = new Headers()
    for (const header of execution.responseHeaders || []) {
      if (header.name?.toLowerCase() === 'content-type') headers.set('Content-Type', header.value)
    }
    return new Response([204, 205, 304].includes(execution.responseStatusCode) ? null : execution.responseBody, { status: execution.responseStatusCode, headers })
  } catch (failure) {
    if (options.signal?.aborted || failure instanceof DOMException && failure.name === 'AbortError') throw failure
    if (failure instanceof Error && failure.message.startsWith('Hosted AI')) throw failure
    if (['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname)) {
      throw new Error(`Local provider could not be reached. Allow local-network access for this website in your browser and allow ${window.location.origin} in the provider CORS configuration. For Ollama, set OLLAMA_ORIGINS to this origin and fully restart Ollama.`)
    }
    throw new Error(hosted ? 'Hosted AI service could not be reached. Check your internet connection and retry.' : 'Provider request failed. Check connectivity and the endpoint browser access (CORS).')
  }
}
