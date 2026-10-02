import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const endpoint = process.env.APPWRITE_ENDPOINT
const project = process.env.APPWRITE_PROJECT_ID
const key = process.env.APPWRITE_API_KEY
const id = 'mermaider-ai-gateway'
const origin = 'https://mermaider.appwrite.network'
if (!endpoint || !project || !key) throw new Error('Missing Appwrite configuration')
async function api(path, method = 'GET', body) {
  const headers = { 'X-Appwrite-Project': project, 'X-Appwrite-Key': key }
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'
  const response = await fetch(endpoint + path, { method, headers, ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}), signal: AbortSignal.timeout(65000) })
  const data = await response.json()
  if (!response.ok) {
    const scopes = [...new Set(data.message?.match(/(?:functions|execution|deployment|runtime|platform|projects)\.[a-z]+/g) || [])]
    const failure = new Error(`Appwrite ${method} ${path}: HTTP ${response.status}; type=${data.type || 'unknown'}; required scopes=${scopes.join(', ') || 'check function deployment permissions'}`)
    failure.status = response.status; throw failure
  }
  return data
}
const settings = { name: 'Mermaider AI Gateway', runtime: 'node-22', execute: ['any'], events: [], schedule: '', timeout: 60, enabled: true, logging: false, entrypoint: 'src/main.js', commands: '', scopes: [] }
let current
try { current = await api(`/functions/${id}`) } catch (failure) { if (failure.status !== 404) throw failure }
if (current) {
  if (current.name !== settings.name) throw new Error('Function ID belongs to another function; no changes made')
  await api(`/functions/${id}`, 'PUT', settings)
} else await api('/functions', 'POST', { functionId: id, ...settings })
const archive = join(tmpdir(), 'mermaider-ai-gateway.tar.gz')
execFileSync('tar', ['-czf', archive, '-C', 'functions/ai-gateway', '.'])
const form = new FormData()
form.set('code', new Blob([readFileSync(archive)], { type: 'application/gzip' }), 'code.tar.gz')
form.set('activate', 'true'); form.set('entrypoint', settings.entrypoint); form.set('commands', settings.commands)
const upload = await api(`/functions/${id}/deployments`, 'POST', form)
const deadline = Date.now() + 600000
let ready = false
while (Date.now() < deadline) {
  const deployment = await api(`/functions/${id}/deployments/${upload.$id}`)
  console.log(`AI deployment ${upload.$id}: ${deployment.status}`)
  if (['failed', 'canceled'].includes(deployment.status)) throw new Error(`AI deployment ${deployment.status}; inspect build logs in Appwrite`)
  if (deployment.status === 'ready') { ready = true; break }
  await new Promise(resolve => setTimeout(resolve, 5000))
}
if (!ready) throw new Error('AI deployment did not become ready')
current = await api(`/functions/${id}`)
if (current.deploymentId !== upload.$id || current.logging !== false || !current.enabled) throw new Error('AI deployment is not active, enabled and logging disabled')
// Verify the client API, with no administrative key, using the production origin.
const preflight = await fetch(`${endpoint}/functions/${id}/executions`, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,x-appwrite-project' } })
const allowedOrigin = preflight.headers.get('access-control-allow-origin')
if (!preflight.ok || allowedOrigin !== origin) throw new Error(`Appwrite browser origin is not allowed: HTTP ${preflight.status}. Add mermaider.appwrite.network as a Web platform hostname in the project.`)
async function publicExecution(path, method, payload) {
  const response = await fetch(`${endpoint}/functions/${id}/executions`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Appwrite-Project': project }, body: JSON.stringify({ async: false, path, method, body: payload ? JSON.stringify(payload) : '' }), signal: AbortSignal.timeout(65000) })
  if (!response.ok) throw new Error(`Public AI execution failed: HTTP ${response.status}`)
  return response.json()
}
const health = await publicExecution('/health', 'GET')
const rejection = await publicExecution('/request', 'POST', { url: 'http://127.0.0.1:11434/api/tags', method: 'GET', authorization: 'Bearer test-not-a-real-key' })
if (health.responseStatusCode !== 200 || JSON.parse(health.responseBody).name !== 'mermaider-ai-gateway' || rejection.responseStatusCode !== 403) throw new Error('Live hosted AI health or endpoint restriction failed')
const upstreamProbes = []
for (const host of ['api.openai.com', 'api.typesafe.ai']) {
  // Deliberately invalid key: verify network/auth forwarding without account access or inference charges.
  const execution = await publicExecution('/request', 'POST', { url: `https://${host}/v1/models`, method: 'GET', authorization: 'Bearer mermaider-invalid-probe-key' })
  let json = false
  try { JSON.parse(execution.responseBody); json = true } catch { /* Not a provider JSON response. */ }
  const reachable = json && [200, 401, 403].includes(execution.responseStatusCode)
  upstreamProbes.push({ host, status: execution.responseStatusCode, reachable, validCredentialsUsed: false })
  console.log(`Hosted provider probe ${host}: HTTP ${execution.responseStatusCode}; providerJSON=${json}`)
  if (!reachable) throw new Error(`Hosted provider ${host} could not be verified; inspect provider reachability without logging credentials.`)
}
writeFileSync('ai-gateway-verification.json', JSON.stringify({ functionId: id, deploymentId: upload.$id, ready, logging: current.logging, origin: allowedOrigin, publicHealth: health.responseStatusCode, localTargetRejection: rejection.responseStatusCode, upstreamProbes }, null, 2) + '\n')
console.log('Hosted AI service verified. Real provider credentials have not been exercised.')
