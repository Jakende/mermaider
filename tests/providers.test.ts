import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gatewayRequest, allowedTarget } from '../functions/ai-gateway/src/main.js'
import { browserProviderFetch, HOSTED_AI } from '../src/utils/browserTransport'
import { getAvailableModels, getAvailableOpenAIModels, storeConfig, clearConfig, getStoredConfig } from '../src/utils/aiService'
const origin = 'https://mermaider.appwrite.network'
const storage = () => {
  const values = new Map<string, string>()
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) }
}
Object.assign(globalThis, { window: Object.assign(new EventTarget(), { location: { origin } }), localStorage: storage(), sessionStorage: storage() })

test('hosted gateway rejects arbitrary URLs, local services, methods and missing credentials before forwarding', async () => {
  let calls = 0
  const upstream = async () => { calls++; return Response.json({}) }
  for (const url of ['http://127.0.0.1:11434/api/tags', 'http://169.254.169.254/', 'https://api.openai.com.evil.example/v1/models', 'https://key@api.openai.com/v1/models', 'https://api.openai.com/v1/models?key=x', 'https://chatgpt.com/backend-api/codex/models', 'https://api.typesafe.ai/unknown']) {
    assert.equal(allowedTarget(url), null)
    assert.equal((await gatewayRequest({ url, method: 'GET' }, upstream)).status, 403)
  }
  assert.equal((await gatewayRequest({ url: 'https://api.openai.com/v1/models', method: 'POST' }, upstream)).status, 405)
  assert.equal((await gatewayRequest({ url: 'https://api.openai.com/v1/models', method: 'GET' }, upstream)).status, 401)
  assert.equal(calls, 0)
})

test('hosted gateway preserves models, SSE and provider errors; bounds body/response sizes and redirects', async () => {
  const base = { url: 'https://api.openai.com/v1/responses', method: 'POST', authorization: 'Bearer test-provider-key', body: '{"model":"gpt-test"}' }
  const result = await gatewayRequest(base, async (url: string, options: RequestInit) => {
    assert.equal(url, base.url); assert.equal(options.redirect, 'error')
    assert.equal(new Headers(options.headers).get('authorization'), base.authorization)
    return new Response('data: {"type":"response.output_text.delta","delta":"OK"}\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
  })
  assert.equal(result.status, 200); assert.match(result.body, /delta/); assert.equal(result.headers['content-type'], 'text/event-stream')
  const invalid = await gatewayRequest(base, async () => Response.json({error:{message:'Invalid test-provider-key'}}, {status:401}))
  assert.equal(invalid.status, 401); assert.ok(!invalid.body.includes('test-provider-key'))
  assert.equal((await gatewayRequest({...base,body:'{'}, fetch)).status, 400)
  assert.equal((await gatewayRequest({...base,body:'x'.repeat(524289)}, fetch)).status, 413)
  assert.equal((await gatewayRequest(base, async () => new Response('x'.repeat(524289)))).status, 502)
  assert.equal((await gatewayRequest(base, async () => { throw new DOMException('timeout', 'TimeoutError') })).status, 504)
})

test('browser routes OpenAI through Appwrite and keeps Ollama direct with proxy prefixes', async () => {
  const originalFetch = globalThis.fetch
  const calls: {url:string;options?:RequestInit}[] = []
  globalThis.fetch = async (input, options) => {
    calls.push({url:String(input),options})
    if (String(input).includes('/executions')) {
      const outer = JSON.parse(options!.body as string); const request = JSON.parse(outer.body)
      assert.equal(request.authorization, 'Bearer valid-test-key')
      assert.equal(new Headers(options?.headers).has('authorization'), false)
      return Response.json({ status: 'completed', responseStatusCode: 200, responseBody: JSON.stringify({data:[{id:'o4-mini'},{id:'text-embedding-test'}]}),responseHeaders:[{name:'content-type',value:'application/json'}] })
    }
    return Response.json({models:[{name:'gpt-oss:20b'}]})
  }
  try {
    assert.deepEqual((await getAvailableOpenAIModels({ endpoint:'',model:'',openaiAuthType:'apikey',openaiApiKey:'valid-test-key',openaiAccessToken:'stale-test-token' })).chat, ['o4-mini'])
    assert.equal(calls[0].url, `${HOSTED_AI.endpoint}/functions/${HOSTED_AI.functionId}/executions`)
    await getAvailableModels('https://proxy.example/ollama/v1')
    assert.equal(calls[1].url, 'https://proxy.example/ollama/api/tags')
    localStorage.setItem('ollama-config', JSON.stringify({ browserBridgeEndpoint:'http://127.0.0.1:11435' }))
    assert.ok(!('browserBridgeEndpoint' in getStoredConfig()))
    await getAvailableModels('http://127.0.0.1:11434/v1')
    assert.equal(calls[2].url, 'http://127.0.0.1:11434/api/tags')
  } finally { globalThis.fetch = originalFetch; clearConfig() }
})

test('browser reports hosted service and upstream auth errors without silent fallback; preserves cancellation', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response('', {status:429})
    await assert.rejects(browserProviderFetch('https://api.openai.com/v1/models', {}), /HTTP 429/)
    globalThis.fetch = async () => Response.json({status:'completed',responseStatusCode:401,responseBody:'{"error":{"message":"Invalid credential"}}'})
    await assert.rejects(getAvailableOpenAIModels({endpoint:'',model:'',openaiAuthType:'apikey',openaiApiKey:'invalid-test-key'}), /HTTP 401.*Invalid credential/)
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
    await assert.rejects(browserProviderFetch('http://127.0.0.1:11434/api/tags', {}), /OLLAMA_ORIGINS/)
    const aborted = new DOMException('Aborted', 'AbortError')
    globalThis.fetch = async () => { throw aborted }
    await assert.rejects(browserProviderFetch('https://api.openai.com/v1/models', {}), error => error === aborted)
  } finally { globalThis.fetch = originalFetch }
})

test('web credentials survive tab reload storage and reset without entering persistent settings', () => {
  storeConfig({ endpoint:'http://127.0.0.1:11434/v1',model:'gpt-oss:20b',openaiApiKey:'test-session-key',openaiAccessToken:'test-session-token' })
  assert.ok(!localStorage.getItem('ollama-config')!.includes('test-session-key'))
  assert.ok(!localStorage.getItem('ollama-config')!.includes('test-session-token'))
  assert.equal(JSON.parse(sessionStorage.getItem('mermaider-openai-session')!).apiKey,'test-session-key')
  clearConfig(); assert.equal(sessionStorage.getItem('mermaider-openai-session'),null)
})

test('browser Codex access reports desktop/API-key options without suggesting a download helper', async () => {
  await assert.rejects(browserProviderFetch('https://chatgpt.com/backend-api/codex/models', {}), /desktop app.*OpenAI API key/)
})
