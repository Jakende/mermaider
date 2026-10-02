import {test,expect} from '@playwright/test'
import {gatewayRequest} from '../../functions/ai-gateway/src/main.js'

test('Jev suggestion needs adoption and opens a path diagram without replacing the original tab',async({page})=>{
  await page.route('https://fra.cloud.appwrite.io/v1/functions/mermaider-ai-gateway/executions',async route=>{
    const envelope=route.request().postDataJSON()
    const result=await gatewayRequest(JSON.parse(envelope.body),async()=>Response.json({model:'jev-test-model',answers:{decision:{type:'choice',choice:'approved',confidence:0.8,probabilities:{approved:0.9,rejected:0.05,unknown:0.05}}}}))
    await route.fulfill({json:{status:'completed',responseStatusCode:result.status,responseBody:result.body}})
  })
  await page.goto('/')
  await page.getByTitle('Decisions (Preview)').click()
  await page.locator('#decision-key').fill('test-typesafe-key')
  await page.getByRole('button',{name:'Evaluate',exact:true}).click()
  await expect(page.getByRole('region',{name:'Decision results'})).toContainText('jev-test-model')
  await expect(page.getByRole('button',{name:'Open path diagram in new tab'})).toBeDisabled()
  await page.getByRole('button',{name:'Adopt suggestion'}).click()
  await page.getByRole('button',{name:'Open path diagram in new tab'}).click()
  await expect(page.locator('.tab-item')).toHaveCount(2)
  await expect(page.locator('.preview-container svg')).toBeVisible()
  await expect(page.locator('.preview-container svg')).toContainText('Budget approved')
  expect(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)]))))).not.toContain('test-typesafe-key')
})

test('edited decision input invalidates an in-flight suggestion',async({page})=>{
  let received:()=>void=()=>{}
  const started=new Promise<void>(resolve=>{received=resolve})
  let release:()=>void=()=>{}
  const hold=new Promise<void>(resolve=>{release=resolve})
  await page.route('https://fra.cloud.appwrite.io/v1/functions/mermaider-ai-gateway/executions',async route=>{
    received();await hold
    await route.fulfill({json:{status:'completed',responseStatusCode:200,responseBody:JSON.stringify({model:'stale-model',answers:{decision:{type:'choice',choice:'approved',probabilities:{approved:1,rejected:0,unknown:0}}}})}}).catch(()=>{})
  })
  await page.goto('/')
  await page.getByTitle('Decisions (Preview)').click()
  await page.locator('#decision-key').fill('test-typesafe-key')
  await page.getByRole('button',{name:'Evaluate',exact:true}).click()
  await started
  await page.locator('#decision-state').fill('The budget was rejected.')
  release()
  await expect(page.getByRole('region',{name:'Decision results'})).toHaveCount(0)
  await expect(page.locator('#decision-path')).toHaveValue('')
  await expect(page.getByRole('button',{name:'Evaluate',exact:true})).toBeEnabled()
})
