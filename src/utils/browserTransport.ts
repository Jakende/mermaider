/** Browser-only transport. Packaged apps continue to use native HTTP. */
export function browserBridgeUrl(endpoint: string, target: string): string {
  const bridge = new URL(endpoint.trim())
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(bridge.hostname) ||
      !['http:', 'https:'].includes(bridge.protocol) || bridge.username || bridge.password ||
      bridge.search || bridge.hash || bridge.pathname !== '/') {
    throw new Error('Browser Connection Bridge must be a local address such as http://127.0.0.1:11435.')
  }
  return `${bridge.origin}/request?url=${encodeURIComponent(target)}`
}
export async function browserProviderFetch(url: string, options: RequestInit, bridgeEndpoint = ''): Promise<Response> {
  const target = new URL(url)
  if (!bridgeEndpoint.trim() && ['chatgpt.com', 'auth.openai.com'].includes(target.hostname)) {
    throw new Error('ChatGPT/Codex account access in the web app requires the local Browser Connection Bridge. Download and start the bridge from Settings, then set http://127.0.0.1:11435 in Settings, or use the desktop app. A ChatGPT login is separate from an OpenAI API key.')
  }
  const headers = new Headers(options.headers)
  const requestUrl = bridgeEndpoint.trim() ? browserBridgeUrl(bridgeEndpoint, url) : url
  if (bridgeEndpoint.trim()) headers.set('X-Mermaider-Bridge', '1')
  try { return await fetch(requestUrl, { ...options, headers, credentials: 'omit' }) }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    if (bridgeEndpoint.trim()) {
      throw new Error('Local browser bridge could not be reached. Keep the local bridge running and allow local-network access for this website in your browser.')
    }
    if (['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname)) {
      throw new Error(`Ollama could not be reached from this website. Even when Ollama is running, browser access needs an allowed website origin and local-network permission. Use the Browser Connection Bridge, or allow ${window.location.origin} in OLLAMA_ORIGINS and restart Ollama.`)
    }
    throw new Error('Provider request failed in the browser. Check connectivity and whether this endpoint allows access from this website (CORS).')
  }
}
