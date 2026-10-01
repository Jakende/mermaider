import { writeFileSync, appendFileSync } from 'node:fs'
const endpoint = process.env.APPWRITE_ENDPOINT?.replace(/\/$/, '')
const project = process.env.APPWRITE_PROJECT_ID
const siteId = process.env.APPWRITE_SITE_ID
const key = process.env.APPWRITE_API_KEY
if (!endpoint || !project || !siteId || !key) throw new Error('Missing Appwrite verification configuration')
async function api(path) {
  const response = await fetch(`${endpoint}${path}`, {
    headers: {'X-Appwrite-Project':project, 'X-Appwrite-Key':key},
    signal:AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Appwrite verification request ${path} failed: HTTP ${response.status}. Check project/site IDs and read scopes.`)
  return response.json()
}
let site = await api(`/sites/${siteId}`)
const deploymentId = process.argv[2] || site.latestDeploymentId
if (!deploymentId) throw new Error('No deployment exists for the configured site')
const deadline = Date.now() + 10 * 60 * 1000
let deployment
let active = false
while (Date.now() < deadline) {
  deployment = await api(`/sites/${siteId}/deployments/${deploymentId}`)
  site = await api(`/sites/${siteId}`)
  console.log(`Deployment ${deploymentId}: ${deployment.status}; active=${site.deploymentId === deploymentId}`)
  if (['failed','canceled'].includes(deployment.status)) throw new Error(`Appwrite deployment is ${deployment.status}; inspect the build logs in the console`)
  if (deployment.status === 'ready' && site.deploymentId === deploymentId) {active=true;break}
  await new Promise(resolve=>setTimeout(resolve,5000))
}
if (!active) throw new Error('Deployment was not ready and active within ten minutes')
if (!site.enabled) throw new Error('The deployed site is disabled')
const report = {siteId,deploymentId,status:deployment.status,active,adapter:site.adapter,urls:[],liveChecks:[]}
try {
  const rules = await api('/proxy/rules')
  console.log('Site domains:', JSON.stringify(rules.rules.filter(rule=>rule.deploymentResourceId === siteId).map(rule=>({domain:rule.domain,type:rule.type,trigger:rule.trigger,status:rule.status,deploymentId:rule.deploymentId}))))
  report.urls = rules.rules.filter(rule=>rule.deploymentResourceId === siteId && rule.type === 'deployment').map(rule=>new URL(`https://${rule.domain}`).href)
} catch (error) {
  console.warn(`Domain lookup unavailable: ${error.message}. Confirm the live URL in Appwrite.`)
}
for (const url of report.urls) {
  // No API credentials are sent to the public site.
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)})
  const html=await response.text()
  const servesApp=response.ok && /<div\s+id=["']root["']/.test(html) && /\/assets\/.*\.js/.test(html)
  report.liveChecks.push({url,status:response.status,servesApp})
  if (!servesApp) console.log('Public response diagnostic:', JSON.stringify({url,status:response.status,body:html.slice(0,800)}))
}
writeFileSync('appwrite-verification.json', JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report,null,2))
if (report.liveChecks.length && !report.liveChecks.some(check=>check.servesApp)) throw new Error('No verified domain serves the deployed application; inspect public response diagnostics')
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,`Appwrite deployment **${deploymentId}** is ready and active.\n\n${report.urls.map(url=>`- ${url}`).join('\n')}\n`)
