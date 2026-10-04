import { test, expect } from '@playwright/test'
import { MERMAID_TEMPLATES } from '../../src/utils/mermaidTemplates'

test('editing, persistence, invalid syntax recovery, rapid changes and SVG download', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('.preview-container svg .node').first()).toBeVisible()
  await expect(page.locator('.monaco-editor textarea').first()).toBeAttached({timeout:30000})
  const setCode = async (code: string) => page.evaluate(code => {
    (window as any).monaco.editor.getModels()[0].setValue(code)
  }, code)
  for (let i = 0; i < 5; i++) {
    await setCode(`graph TD\nA[Start] --> B{Decision ${i}}`)
    await expect(page.locator('.preview-container svg')).toContainText(`Decision ${i}`)
  }
  await page.reload()
  await expect(page.locator('.preview-container svg')).toContainText('Decision 4')
  await expect(page.locator('.monaco-editor textarea').first()).toBeAttached({timeout:30000})
  await setCode('graph TD\nA[broken')
  await expect(page.locator('.error-preview')).toBeVisible()
  await setCode('sequenceDiagram\nAlice->>Bob: Recovered')
  await expect(page.locator('.preview-container svg')).toContainText('Recovered')
  await page.evaluate(async () => {
    for (let i=0;i<12;i++) {
      (window as any).monaco.editor.getModels()[0].setValue(`graph TD\nA[Latest ${i}] --> B[Done]`)
      await new Promise(resolve=>setTimeout(resolve,30))
    }
  })
  await expect(page.locator('.preview-container svg')).toContainText('Latest 11')
  const svgId = await page.locator('.preview-container svg').getAttribute('id')
  await page.locator('[title="Zoom In"]').click()
  await page.waitForTimeout(300)
  expect(await page.locator('.preview-container svg').getAttribute('id')).toBe(svgId)
  await page.locator('[title="Export Diagram (⌘S)"]').click()
  const downloadEvent = page.waitForEvent('download')
  await page.locator('.export-modal .export-footer .button-primary').click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toMatch(/\.svg$/)
  expect(errors).toEqual([])
})

test('all curated templates render without unhandled errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error=>errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('.monaco-editor textarea').first()).toBeAttached({timeout:30000})
  for (const template of MERMAID_TEMPLATES) {
    const previousId = await page.locator('.preview-container svg').getAttribute('id').catch(()=>null)
    await page.evaluate(code=>(window as any).monaco.editor.getModels()[0].setValue(code),template.code)
    await expect.poll(async () => {
      const saved = await page.evaluate(()=>JSON.parse(localStorage.getItem('mermaider-tabs')!)[0].code)
      return saved
    }).toBe(template.code)
    await expect.poll(()=>page.locator('.preview-container svg').getAttribute('id').catch(()=>null), { message: template.id }).not.toBe(previousId)
    await expect(page.locator('.error-preview'), template.id).toHaveCount(0)
    await expect(page.locator('.preview-container svg'),template.id).toHaveCount(1)
  }
  expect(errors).toEqual([])
})

test('visual editor retains parallel edges and inline target shapes during label edits', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('.monaco-editor textarea').first()).toBeAttached({timeout:30000})
  await page.evaluate(()=>(window as any).monaco.editor.getModels()[0].setValue('graph TD\nA[Start] -->|One| B{Choice}\nA -->|Two| B'))
  await expect(page.locator('.preview-container svg')).toContainText('Choice')
  await page.locator('[title="Switch to visual edit mode"]').click()
  await expect(page.locator('.react-flow__node')).toHaveCount(2)
  await expect(page.locator('.react-flow__edge')).toHaveCount(2)
  page.once('dialog',dialog=>dialog.accept('Updated choice'))
  await page.locator('.react-flow__node[data-id="B"]').dblclick()
  await expect(page.locator('.react-flow__node[data-id="B"]')).toContainText('Updated choice')
  await page.locator('[title="Switch to preview mode"]').click()
  await expect(page.locator('.preview-container svg')).toContainText('Updated choice')
  const code = await page.evaluate(()=>JSON.parse(localStorage.getItem('mermaider-tabs')!)[0].code)
  expect(code).toContain('B{"Updated choice"}')
  expect(errors).toEqual([])
})
