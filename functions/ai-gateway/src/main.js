/** MIT — Copyright (c) 2026 Jakob Endemann. Hosted, bounded provider transport. */
const MAX_BYTES = 512 * 1024
const ROUTES = {
  'api.openai.com': /^\/v1\/(models|chat\/completions|responses|embeddings)$/,
  'api.typesafe.ai': /^\/v1\/(models|systemone)$/,
}
const error = (status, message) => ({ status, body: JSON.stringify({ error: { message } }), headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
export function allowedTarget(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search || (url.port && url.port !== '443')) return null
    return ROUTES[url.hostname]?.test(url.pathname) ? url : null
  } catch { return null }
}
export async function gatewayRequest(payload, fetchImpl = fetch) {
  if (!payload || typeof payload !== 'object') return error(400, 'Invalid provider request.')
  const target = allowedTarget(payload.url)
  if (!target) return error(403, 'Unsupported hosted provider endpoint.')
  const method = target.pathname.endsWith('/models') ? 'GET' : 'POST'
  if (payload.method !== method) return error(405, 'Unsupported provider method.')
  const credential = payload.authorization
  if (typeof credential !== 'string' || !/^Bearer [^\s]{8,4096}$/.test(credential)) return error(401, 'A personal provider API key is required.')
  if (method === 'GET' && payload.body) return error(400, 'Model requests cannot include a body.')
  if (method === 'POST' && typeof payload.body !== 'string') return error(400, 'A JSON request body is required.')
  if (typeof payload.body === 'string' && Buffer.byteLength(payload.body) > MAX_BYTES) return error(413, 'Provider request exceeds 512 KB.')
  if (method === 'POST') {
    try { const body = JSON.parse(payload.body); if (!body || typeof body !== 'object' || Array.isArray(body)) return error(400, 'A JSON object is required.') }
    catch { return error(400, 'Invalid provider JSON.') }
  }
  try {
    const response = await fetchImpl(target.href, {
      method, headers: { Authorization: credential, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      ...(method === 'POST' ? { body: payload.body } : {}),
      redirect: 'error', signal: AbortSignal.timeout(50000),
    })
    const chunks = []; let size = 0
    if (response.body) {
      const reader = response.body.getReader()
      try {
        while (true) {
          const chunk = await reader.read(); if (chunk.done) break
          size += chunk.value.byteLength
          if (size > MAX_BYTES) { await reader.cancel(); return error(502, 'Provider response exceeds 512 KB.') }
          chunks.push(Buffer.from(chunk.value))
        }
      } finally { reader.releaseLock() }
    }
    let body = Buffer.concat(chunks).toString('utf8')
    // Never echo a credential if an upstream error happens to contain it.
    if (!response.ok) body = body.replaceAll(credential.slice(7), '[redacted]')
    return { status: response.status, body, headers: { 'content-type': response.headers.get('content-type') || 'application/json', 'cache-control': 'no-store' } }
  } catch (failure) {
    return error(failure?.name === 'TimeoutError' ? 504 : 502, 'Hosted provider did not respond. Please retry or check provider availability.')
  }
}
export default async ({ req, res }) => {
  if (req.path === '/health' && req.method === 'GET') return res.json({ name: 'mermaider-ai-gateway', version: 1 }, 200, { 'cache-control': 'no-store' })
  if (req.path !== '/request' || req.method !== 'POST') return res.json({ error: { message: 'Unknown provider route.' } }, 404)
  if (typeof req.bodyText !== 'string' || Buffer.byteLength(req.bodyText) > MAX_BYTES + 8192) return res.json({ error: { message: 'Request too large or invalid.' } }, 413)
  let payload
  try { payload = JSON.parse(req.bodyText) } catch { return res.json({ error: { message: 'Invalid JSON.' } }, 400) }
  const response = await gatewayRequest(payload)
  return res.text(response.body, response.status, response.headers)
}
