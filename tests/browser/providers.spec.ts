import { test, expect } from '@playwright/test'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { gatewayRequest } from '../../functions/ai-gateway/src/main.js'

let server: ReturnType<typeof createServer>
let ollama: string
let authReceived = ''
test.beforeAll(async () => {
  const origin = process.env.E2E_BASE_URL || 'http://127.0.0.1:5174'
  server = createServer((req,res) => {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Private-Network', 'true')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
    if (req.method === 'OPTIONS') {res.writeHead(204); return res.end()}
    res.setHeader('Content-Type','application/json')
    res.end(JSON.stringify({models:[{name:'gpt-oss:20b'},{name:'nomic-embed-text'}]}))
  })
  server.listen(0,'127.0.0.1'); await once(server,'listening')
  ollama = `http://127.0.0.1:${(server.address() as any).port}/v1`
})
test.afterAll(() => {server.closeAllConnections();server.close()})

test('browser connects directly to Ollama and uses hosted API transport, retaining tab credentials after reload', async ({ page, context }) => {
  await context.grantPermissions(['local-network-access'])
  await page.route('https://fra.cloud.appwrite.io/v1/functions/mermaider-ai-gateway/executions', async route => {
    const execution = route.request().postDataJSON()
    const result = await gatewayRequest(JSON.parse(execution.body), async (url:string,options:RequestInit) => {
      authReceived = new Headers(options.headers).get('authorization') || ''
      if (url.endsWith('/models')) return Response.json({data:[{id:'gpt-test-model'}]})
      return new Response('data: {"choices":[{"delta":{"content":"OK"}}]}\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}})
    })
    await route.fulfill({json:{status:'completed',responseStatusCode:result.status,responseBody:result.body,responseHeaders:[{name:'content-type',value:result.headers['content-type']}]}})
  })
  await page.goto('/')
  await page.getByTitle('Settings').click()
  await expect(page.locator('#browser-ai-bridge')).toHaveCount(0)
  await page.locator('#ollama-endpoint').fill(ollama)
  await page.getByRole('button',{name:'Test Connection',exact:true}).click()
  await expect(page.locator('.test-result-alert')).toContainText('Connection Succeeded')
  await page.locator('#provider-tab-openai').click()
  await expect(page.locator('#openai-auth-token')).toBeDisabled()
  await expect(page.locator('#openai-auth-device')).toBeDisabled()
  await page.locator('#openai-api-key').fill('browser-test-api-key')
  await page.getByRole('button',{name:'Load Models',exact:true}).click()
  await expect(page.locator('#openai-model')).toHaveValue('gpt-test-model')
  await page.locator('#openai-test-connection').click()
  await expect(page.locator('.test-result-alert')).toContainText('Connection Succeeded')
  expect(authReceived).toBe('Bearer browser-test-api-key')
  page.once('dialog',dialog=>dialog.accept())
  await page.locator('#settings-save').click()
  expect(await page.evaluate(()=>localStorage.getItem('ollama-config'))).not.toContain('browser-test-api-key')
  await page.reload()
  await page.getByTitle('Settings').click()
  await expect(page.locator('#openai-api-key')).toHaveValue('browser-test-api-key')
  await page.locator('#openai-test-connection').click()
  await expect(page.locator('.test-result-alert')).toContainText('Connection Succeeded')
})

test('production browser can execute hosted AI health without an admin key', async ({page}) => {
  test.skip(!process.env.E2E_BASE_URL,'Requires the deployed Appwrite function')
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const response = await fetch('https://fra.cloud.appwrite.io/v1/functions/mermaider-ai-gateway/executions',{
      method:'POST',credentials:'omit',headers:{'Content-Type':'application/json','X-Appwrite-Project':'6abe2e810023326f2b87'},
      body:JSON.stringify({async:false,path:'/health',method:'GET'}),
    })
    return {status:response.status,execution:await response.json()}
  })
  expect(result.status).toBe(201)
  expect(result.execution.responseStatusCode).toBe(200)
  expect(JSON.parse(result.execution.responseBody).name).toBe('mermaider-ai-gateway')
})
