import { test, expect } from '@playwright/test'
import { createBridge } from '../../scripts/browser-ai-bridge.mjs'
import { once } from 'node:events'

let server: ReturnType<typeof createBridge>
let bridge: string
let authReceived = ''
test.beforeAll(async () => {
  server = createBridge({ origins: [process.env.E2E_BASE_URL || 'http://127.0.0.1:5174'], fetchImpl: async (url: string, options: RequestInit) => {
    if (url.includes('/api/tags')) return Response.json({ models: [{ name: 'gpt-oss:20b' }, { name: 'nomic-embed-text' }] })
    authReceived = new Headers(options.headers).get('authorization') || ''
    if (url.includes('/models')) return Response.json({ models: [{ slug: 'codex-test-model' }] })
    return new Response('data: {"type":"response.output_text.delta","delta":"OK"}\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
  } })
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  bridge = `http://127.0.0.1:${(server.address() as any).port}`
})
test.afterAll(() => { server.closeAllConnections(); server.close() })

test('browser uses real local bridge for Ollama and Codex, preserving tab credentials after reload', async ({ page, context }) => {
  await context.grantPermissions(['local-network-access'])
  await page.goto('/')
  await page.getByTitle('Settings').click()
  const standalone = await page.request.get('/website/mermaider-browser-bridge.mjs')
  expect(standalone.ok()).toBe(true)
  expect(await standalone.text()).toContain('export function createBridge')
  await page.locator('#browser-ai-bridge').fill(bridge)
  await page.getByRole('button', { name: 'Test Connection', exact: true }).click()
  await expect(page.locator('.test-result-alert')).toContainText('Connection Succeeded')
  await page.locator('#provider-tab-openai').click()
  await page.locator('#openai-auth-token').click()
  await page.locator('#openai-access-token').fill('browser-test-access-token')
  await page.getByRole('button', { name: 'Load Models', exact: true }).click()
  await expect(page.locator('#openai-model')).toHaveValue('codex-test-model')
  await page.locator('#openai-test-connection').click()
  await expect(page.locator('.test-result-alert')).toContainText('Connection Succeeded')
  expect(authReceived).toBe('Bearer browser-test-access-token')
  page.once('dialog', dialog => dialog.accept())
  await page.locator('#settings-save').click()
  expect(await page.evaluate(() => localStorage.getItem('ollama-config'))).not.toContain('browser-test-access-token')
  await page.reload()
  await page.getByTitle('Settings').click()
  await expect(page.locator('#openai-access-token')).toHaveValue('browser-test-access-token')
  await page.locator('#openai-test-connection').click()
  await expect(page.locator('.test-result-alert')).toContainText('Connection Succeeded')
})
