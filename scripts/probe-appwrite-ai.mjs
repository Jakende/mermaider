// Read-only capability check. Never print API keys or server error bodies.
const endpoint = process.env.APPWRITE_ENDPOINT
const project = process.env.APPWRITE_PROJECT_ID
const key = process.env.APPWRITE_API_KEY
if (!endpoint || !project || !key) throw new Error('Missing Appwrite configuration')
for (const path of ['/functions?queries[]=' + encodeURIComponent(JSON.stringify({method:'limit',values:[1]})), '/functions/runtimes']) {
  const response = await fetch(endpoint + path, { headers: { 'X-Appwrite-Project': project, 'X-Appwrite-Key': key }, signal: AbortSignal.timeout(20000) })
  console.log(JSON.stringify({path: path.split('?')[0], status: response.status}))
  if (!response.ok) throw new Error(`Appwrite ${path.split('?')[0]} requires function read scopes (HTTP ${response.status}).`)
  const data = await response.json()
  if (data.runtimes) console.log('Node runtimes:', data.runtimes.filter(r => r.$id.startsWith('node-')).map(r => r.$id).join(', '))
}
const response = await fetch(endpoint + '/health/version', { headers: { Origin: 'https://mermaider.appwrite.network', 'X-Appwrite-Project': project }, signal: AbortSignal.timeout(20000) })
console.log(JSON.stringify({ browserApiStatus: response.status, allowedOrigin: response.headers.get('access-control-allow-origin') }))
