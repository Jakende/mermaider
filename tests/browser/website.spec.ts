import { test, expect } from '@playwright/test'

test('product page has a working demo and truthful unreleased downloads on desktop and mobile', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/website/')
  await expect(page.getByRole('heading', { name: 'Gedanken werden Diagramme.' })).toBeVisible()
  await expect(page.locator('#example-code')).toContainText('A[Idee]')
  await page.getByRole('button', { name: 'Entscheidung', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Entscheidung', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('#example-code')).toContainText('A{Bereit?}')
  await expect(page.locator('#diagram svg')).toHaveAttribute('aria-label', /Bei Ja teilen/)
  await expect(page.locator('#download-macos')).toBeHidden()
  await expect(page.locator('#download-windows')).toBeHidden()
  await expect(page.locator('#release-status')).toContainText('in Vorbereitung')
  await expect(page.getByRole('link', { name: 'Im Browser öffnen', exact: true })).toHaveAttribute('href', '/')
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await expect(page.getByRole('link', { name: 'Im Browser öffnen', exact: true })).toBeVisible()
  }
  expect(errors).toEqual([])
})

test('only reviewed published HTTPS downloads become visible', async ({ page }) => {
  await page.route('**/website/release.json', route => route.fulfill({ json: {
    version: '1.8.7', published: true, notesUrl: 'https://example.org/releases/1.8.7',
    macos: { url: 'https://example.org/Mermaider.dmg', signed: false },
    windows: { url: 'javascript:alert(1)', signed: true },
  }}))
  await page.goto('/website/')
  await expect(page.locator('#download-macos')).toBeVisible()
  await expect(page.locator('#download-macos')).toHaveAttribute('href', 'https://example.org/Mermaider.dmg')
  await expect(page.locator('#status-macos')).toContainText('Unsignierter Installer')
  await expect(page.locator('#download-windows')).toBeHidden()
  await expect(page.locator('#release-notes')).toHaveAttribute('href', 'https://example.org/releases/1.8.7')
})
