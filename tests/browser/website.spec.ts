import { test, expect } from '@playwright/test'

test('product page has a working demo and truthful unreleased downloads on desktop and mobile', async ({ page }) => {
  await page.route('**/website/release.json', route => route.fulfill({ json: { version: '1.8.7', published: false, notesUrl: '' } }))
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/website/')
  await expect(page.getByRole('heading', { name: 'Gedanken werden Diagramme.' })).toBeVisible()
  await expect(page.locator('#example-code')).toContainText('A[Idee]')
  await page.getByRole('button', { name: 'Entscheidung', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Entscheidung', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('#example-code')).toContainText('A{Bereit?}')
  await expect(page.locator('#diagram svg')).toHaveAttribute('aria-label', /Bei Ja teilen/)
  const credits = await page.request.get('/website/credits.txt')
  expect(credits.ok()).toBe(true)
  expect(await credits.text()).toContain('Dario Novoa Vergara')
  await expect(page.locator('#download-macos')).toBeHidden()
  await expect(page.locator('#download-windows')).toBeHidden()
  await expect(page.locator('#release-status')).toContainText('in Vorbereitung')
  await expect(page.getByRole('link', { name: 'Im Browser öffnen', exact: true })).toHaveAttribute('href', '/')
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await expect(page.getByRole('link', { name: 'Im Browser öffnen', exact: true })).toBeVisible()
  }
  const enlarged = await page.addStyleTag({ content: 'html { font-size: 200% }' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await enlarged.evaluate(element => element.remove())
  await expect(page.locator('body')).not.toHaveClass(/theme-invert/)
  await page.getByRole('button', { name: 'Helles Design aktivieren' }).click()
  await expect(page.locator('body')).toHaveClass(/theme-invert/)
  expect(await page.evaluate(() => localStorage.getItem('mermaider-theme'))).toBe('light')
  await page.reload()
  await expect(page.locator('body')).toHaveClass(/theme-invert/)
  expect(errors).toEqual([])
})

test('language switch translates the complete website and remembers the choice', async ({ page }) => {
  await page.route('**/website/release.json', route => route.fulfill({ json: {
    version: '1.8.7', published: true, notesUrl: 'https://example.org/releases/1.8.7',
    macos: { url: 'https://example.org/Mermaider.dmg', signed: false },
    windows: { url: 'https://example.org/Mermaider.exe', signed: true },
  } }))
  await page.goto('/website/')
  await page.getByRole('link', { name: 'Switch to English' }).click()
  await expect(page).toHaveURL(/\/website\/en\/$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { name: 'Turn thoughts into diagrams.' })).toBeVisible()
  await expect(page.locator('#example-code')).toContainText('A[Idea]')
  await page.getByRole('button', { name: 'Decision', exact: true }).click()
  await expect(page.locator('#example-code')).toContainText('A{Ready?} -->|Yes| B[Share]')
  await expect(page.locator('#diagram svg')).toHaveAttribute('aria-label', /If yes, share; if no, revise/)
  await expect(page.locator('#release-status')).toHaveText('Version 1.8.7 available.')
  await expect(page.locator('#status-macos')).toContainText('Unsigned installer')
  await expect(page.locator('#status-windows')).toContainText('Signed installer')
  await expect(page.getByRole('link', { name: 'Download for macOS' })).toHaveAttribute('href', 'https://example.org/Mermaider.dmg')
  await expect(page.getByRole('link', { name: 'License & attribution' })).toHaveAttribute('href', '/website/credits.txt')
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toHaveText('Dark')
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
  await page.addStyleTag({ content: 'html { font-size: 200% }' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.goto('/website/')
  await expect(page).toHaveURL(/\/website\/en\/$/)
  await page.getByRole('link', { name: 'Zu Deutsch wechseln' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  await expect(page.getByRole('heading', { name: 'Gedanken werden Diagramme.' })).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(/\/website\/$/)
})

test('English page and language links work when storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage unavailable') }
    Storage.prototype.setItem = () => { throw new Error('Storage unavailable') }
  })
  await page.goto('/website/en/')
  await expect(page.getByRole('heading', { name: 'Turn thoughts into diagrams.' })).toBeVisible()
  await page.getByRole('link', { name: 'Zu Deutsch wechseln' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
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
