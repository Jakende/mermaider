import { test } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createBridge, allowedTarget } from '../scripts/browser-ai-bridge.mjs'
import { browserProviderFetch, browserBridgeUrl } from '../src/utils/browserTransport'
import { getAvailableModels, getAvailableOpenAIModels, storeConfig, clearConfig } from '../src/utils/aiService'

const origin = 'https://mermaider.appwrite.network'
const storage = () => {
  const values = new Map<string, string>()
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) }
}
Object.assign(globalThis, { window: Object.assign(new EventTarget(), { location: { origin } }), localStorage: storage(), sessionStorage: storage() })

test('bridge rejects untrusted origins, targets, methods and missing preflight marker', async () => {
  let calls = 0
  const server = createBridge({ fetchImpl: async () => { calls++; return new Response('{}') } })
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  const base = `http://127.0.0.1:${(server.address() as any).port}`
  try {
    const request = `${base}/request?url=${encodeURIComponent('https://api.openai.com/v1/models')}`
    assert.equal((await fetch(request, { headers: { Origin: 'https://untrusted.example', 'X-Mermaider-Bridge': '1' } })).status, 403)
    assert.equal((await fetch(request, { headers: { Origin: origin } })).status, 403)
    assert.equal((await fetch(request, { method: 'POST', headers: { Origin: origin, 'X-Mermaider-Bridge': '1' } })).status, 405)
    const preflight = await fetch(request, { method: 'OPTIONS', headers: { Origin: origin } })
    assert.equal(preflight.status, 204)
    assert.equal(preflight.headers.get('access-control-allow-origin'), origin)
    assert.equal(preflight.headers.get('access-control-allow-private-network'), 'true')
    for (const url of ['http://169.254.169.254/', 'https://untrusted.example/v1/models', 'https://api.openai.com.evil.example/v1/models', 'https://user:pass@api.openai.com/v1/models', 'http://127.0.0.1:22/api/tags']) assert.equal(allowedTarget(url), null)
    assert.equal(calls, 0)
    assert.throws(() => browserBridgeUrl('https://remote.example', 'https://api.openai.com/v1/models'), /local address/)
  } finally { server.closeAllConnections(); server.close() }
})

test('real bridge transports models, retains proxy paths and reports auth failures', async () => {
  const requests: { url: string; auth: string | null; redirect: string }[] = []
  const server = createBridge({ fetchImpl: async (url: string, options: RequestInit) => {
    const headers = new Headers(options.headers)
    requests.push({ url, auth: headers.get('authorization'), redirect: options.redirect! })
    if (url.includes('/api/tags')) return Response.json({ models: [{ name: 'gpt-oss:20b' }] })
    if (headers.get('authorization') === 'Bearer invalid-test-key') return Response.json({ error: { message: 'Invalid credential' } }, { status: 401 })
    return Response.json({ data: [{ id: 'o4-mini' }, { id: 'gpt-test' }, { id: 'text-embedding-test' }] })
  } })
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  const bridge = `http://127.0.0.1:${(server.address() as any).port}`
  const originalFetch = globalThis.fetch
  globalThis.fetch = (input, options) => originalFetch(input, { ...options, headers: { ...Object.fromEntries(new Headers(options?.headers)), Origin: origin } })
  try {
    assert.deepEqual(await getAvailableModels('http://127.0.0.1:11434/v1/', bridge), ['gpt-oss:20b'])
    const models = await getAvailableOpenAIModels({ endpoint: '', model: '', browserBridgeEndpoint: bridge, openaiAuthType: 'apikey', openaiApiKey: 'valid-test-key', openaiAccessToken: 'stale-test-oauth-token' })
    assert.deepEqual(models.chat, ['o4-mini', 'gpt-test'])
    assert.equal(requests[1].auth, 'Bearer valid-test-key')
    assert.equal(requests[1].redirect, 'error')
    await assert.rejects(getAvailableOpenAIModels({ endpoint: '', model: '', browserBridgeEndpoint: bridge, openaiAuthType: 'apikey', openaiApiKey: 'invalid-test-key' }), /HTTP 401.*Invalid credential/)
    let target = ''
    globalThis.fetch = async input => { target = String(input); return Response.json({ models: [] }) }
    await getAvailableModels('https://proxy.example/ollama/v1')
    assert.equal(target, 'https://proxy.example/ollama/api/tags')
  } finally { globalThis.fetch = originalFetch; server.closeAllConnections(); server.close() }
})

test('web credentials survive tab reload storage and reset without entering persistent settings', () => {
  storeConfig({ endpoint: 'http://127.0.0.1:11434/v1', model: 'gpt-oss:20b', openaiApiKey: 'test-session-key', openaiAccessToken: 'test-session-token' })
  assert.ok(!localStorage.getItem('ollama-config')!.includes('test-session-key'))
  assert.ok(!localStorage.getItem('ollama-config')!.includes('test-session-token'))
  assert.equal(JSON.parse(sessionStorage.getItem('mermaider-openai-session')!).apiKey, 'test-session-key')
  clearConfig()
  assert.equal(sessionStorage.getItem('mermaider-openai-session'), null)
})

test('browser Codex access without bridge produces actionable feedback', async () => {
  await assert.rejects(browserProviderFetch('https://chatgpt.com/backend-api/codex/models', {}), /requires the local Browser Connection Bridge/)
})
