/*
MIT License

Copyright (c) 2026 Jakob Endemann

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/** Local-only browser transport for Mermaider; never stores or logs credentials. */
import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { pathToFileURL } from 'node:url'

const DEFAULT_ORIGINS = ['https://mermaider.appwrite.network', 'http://localhost:5173', 'http://127.0.0.1:5173']
const ROUTES = {
  'api.openai.com': /^\/v1\/(models|chat\/completions|responses|embeddings)$/,
  'chatgpt.com': /^\/backend-api\/codex\/(models|responses)$/,
  'auth.openai.com': /^\/(api\/accounts\/deviceauth\/(usercode|token)|oauth\/token)$/,
}
export function allowedTarget(value) {
  try {
    const url = new URL(value)
    if (url.username || url.password || url.hash) return null
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    if (local && url.protocol === 'http:' && url.port === '11434' && /^\/(api\/(tags|embeddings|embed)|v1\/chat\/completions)$/.test(url.pathname)) return url
    if (url.protocol === 'https:' && (!url.port || url.port === '443') && ROUTES[url.hostname]?.test(url.pathname)) return url
  } catch { /* Reject invalid targets. */ }
  return null
}

export function createBridge({ origins = DEFAULT_ORIGINS, fetchImpl = fetch } = {}) {
  const allowedOrigins = new Set(origins)
  return createServer(async (req, res) => {
    const origin = req.headers.origin
    const send = (status, message) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: message })) }
    if (!origin || !allowedOrigins.has(origin)) return send(403, 'Website origin is not allowed by this local bridge.')
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Cache-Control', 'no-store')
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Mermaider-Bridge, Originator, OpenAI-Beta, session_id, ChatGPT-Account-Id')
      res.setHeader('Access-Control-Allow-Private-Network', 'true')
      res.writeHead(204); return res.end()
    }
    // A non-simple header prevents drive-by requests without an allowed preflight.
    if (req.headers['x-mermaider-bridge'] !== '1') return send(403, 'Mermaider bridge request header is required.')
    const incoming = new URL(req.url, 'http://127.0.0.1')
    if (incoming.pathname === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ name: 'mermaider-browser-bridge', version: 1 }))
    }
    if (incoming.pathname !== '/request' || !['GET', 'POST'].includes(req.method)) return send(404, 'Unknown bridge route.')
    const target = allowedTarget(incoming.searchParams.get('url'))
    if (!target) return send(403, 'Only supported Ollama and OpenAI endpoints are allowed.')
    // Authentication endpoints are POST-only; model catalogs are GET-only.
    const catalog = /\/(models|tags)$/.test(target.pathname)
    if (req.method !== (catalog ? 'GET' : 'POST')) return send(405, 'Unsupported method for this provider endpoint.')
    try {
      let size = 0
      const chunks = []
      for await (const chunk of req) {
        size += chunk.length
        if (size > 2 * 1024 * 1024) return send(413, 'Request exceeds 2 MB.')
        chunks.push(chunk)
      }
      const headers = new Headers()
      for (const name of ['content-type', 'accept', 'authorization', 'originator', 'openai-beta', 'session_id', 'chatgpt-account-id']) {
        if (typeof req.headers[name] === 'string') headers.set(name, req.headers[name])
      }
      if (target.hostname === 'chatgpt.com') headers.set('User-Agent', 'codex-cli')
      const response = await fetchImpl(target.href, {
        method: req.method, headers,
        ...(req.method === 'POST' ? { body: Buffer.concat(chunks) } : {}),
        redirect: 'error', signal: AbortSignal.timeout(300000),
      })
      res.writeHead(response.status, { 'Content-Type': response.headers.get('content-type') || 'application/json' })
      if (response.body) {
        const stream = Readable.fromWeb(response.body)
        stream.on('error', () => res.destroy())
        stream.pipe(res)
      } else res.end()
    } catch {
      // Do not echo upstream errors or headers: they can contain user credentials.
      if (!res.headersSent) send(502, 'Provider request failed. Check Ollama, internet connectivity or provider availability.')
      else res.destroy()
    }
  })
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.MERMAIDER_BRIDGE_PORT || 11435)
  const origins = process.env.MERMAIDER_BRIDGE_ORIGINS?.split(',').map(value => value.trim()).filter(Boolean) || DEFAULT_ORIGINS
  const server = createBridge({ origins })
  server.on('error', error => { console.error(`Bridge could not start (${error.code || 'unknown error'}).`); process.exitCode = 1 })
  server.listen(port, '127.0.0.1', () => console.log(`Mermaider browser bridge: http://127.0.0.1:${port}\nKeep this terminal open. Set this address in Mermaider Settings → Browser Connection Bridge.`))
}
