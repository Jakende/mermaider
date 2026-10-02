import {test,expect} from '@playwright/test'
import {readFile} from 'node:fs/promises'
const plan={title:'Release decision',startId:'ready',questions:[{id:'ready',text:'Is the release ready?',options:[{id:'yes',label:'Ready',nextId:'channel'},{id:'no',label:'Needs work'}]},{id:'channel',text:'Which channel?',options:[{id:'public',label:'Public release'},{id:'private',label:'Private test'}]}]}
async function prepare(page:any){
  await page.addInitScript(()=>{
    localStorage.setItem('ollama-config',JSON.stringify({provider:'openai',openaiAuthType:'apikey',openaiModel:'gpt-test'}))
    sessionStorage.setItem('mermaider-openai-session',JSON.stringify({apiKey:'test-openai-key',accessToken:'',refreshToken:'',idToken:''}))
    sessionStorage.setItem('mermaider-decision-key-jev','test-typesafe-key')
  })
  await page.route('https://fra.cloud.appwrite.io/v1/functions/mermaider-ai-gateway/executions',async(route:any)=>{
    const request=JSON.parse(route.request().postDataJSON().body)
    if(request.url.includes('api.openai.com')){
      await route.fulfill({json:{status:'completed',responseStatusCode:200,responseBody:JSON.stringify({choices:[{message:{content:JSON.stringify(plan)}}]})}})
    }else{
      const input=JSON.parse(request.body);const id=Object.keys(input.questions)[0]
      const labels=Object.keys(input.questions[id].criteria)
      await route.fulfill({json:{status:'completed',responseStatusCode:200,responseBody:JSON.stringify({model:'jev-test',answers:{[id]:{type:'choice',choice:labels[0],probabilities:Object.fromEntries(labels.map((label,index)=>[label,index===0?0.95:0.05/(labels.length-1)]))}}})}})
    }
  })
  await page.goto('/')
  await page.getByTitle('Decisions (Preview)').click()
  await page.locator('#flow-goal').fill('Prepare a release decision')
  await page.locator('#flow-context').fill('The release is ready for public distribution.')
  await page.getByRole('button',{name:'Generate flow with AI'}).click()
  await expect(page.getByRole('region',{name:'Proposed flow'})).toBeVisible()
  await expect(page.locator('.tab-item')).toHaveCount(1)
  await page.getByRole('button',{name:'Apply draft',exact:true}).click()
  await expect(page.locator('.tab-item')).toHaveCount(2)
  await expect(page.locator('.preview-container svg')).toContainText('Which channel?')
}
test('questions and answers are editable beside the diagram; path clicks keep the SVG layout and persist after reload',async({page})=>{
  await prepare(page)
  const svgId=await page.locator('.preview-container svg').getAttribute('id')
  await page.locator('.preview-container .node[id^="flowchart-ready__yes-"]').click()
  await expect(page.getByRole('button',{name:'Choose Ready',exact:true})).toHaveAttribute('aria-pressed','true')
  expect(await page.locator('.preview-container svg').getAttribute('id')).toBe(svgId)
  await page.getByRole('button',{name:'Choose Public release',exact:true}).click()
  await page.getByRole('button',{name:'Choose Needs work',exact:true}).click()
  await expect(page.getByRole('button',{name:'Choose Public release',exact:true})).toHaveAttribute('aria-pressed','false')
  await page.getByRole('button',{name:'Undo',exact:true}).click()
  await expect(page.getByRole('button',{name:'Choose Public release',exact:true})).toHaveAttribute('aria-pressed','true')
  const blob=await page.locator('.toolbar .user-blob svg').evaluate(element => element.outerHTML)
  await page.reload();await page.getByTitle('Decisions (Preview)').click()
  await expect(page.getByRole('button',{name:'Choose Public release',exact:true})).toHaveAttribute('aria-pressed','true')
  expect(await page.locator('.toolbar .user-blob svg').evaluate(element => element.outerHTML)).toBe(blob)
  await page.getByRole('region',{name:'Question: Which channel?'}).getByRole('button',{name:'+ Answer',exact:true}).click()
  await expect(page.getByRole('region',{name:'Question: Which channel?'}).getByLabel('Answer text')).toHaveCount(3)
  expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).not.toContain('test-typesafe-key')
})
test('live suggestions remain reviewable; auto follow advances a bounded branch',async({page})=>{
  await prepare(page)
  await page.locator('#flow-mode').selectOption('suggest')
  await expect(page.getByText('Suggested: Ready')).toBeVisible()
  await expect(page.getByRole('button',{name:'Choose Ready',exact:true})).toHaveAttribute('aria-pressed','false')
  await page.getByRole('button',{name:'Adopt suggestion',exact:true}).click()
  await expect(page.getByText('Suggested: Public release')).toBeVisible()
  await page.locator('#flow-mode').selectOption('follow')
  await expect(page.getByRole('button',{name:'Choose Public release',exact:true})).toHaveAttribute('aria-pressed','true')
  await expect(page.getByText('This branch is complete.',{exact:false})).toBeVisible()
})
test('edited state cancels an in-flight answer and cannot apply its stale result',async({page})=>{
  await prepare(page)
  let received:()=>void=()=>{};const started=new Promise<void>(resolve=>{received=resolve})
  let release:()=>void=()=>{};const hold=new Promise<void>(resolve=>{release=resolve})
  await page.route('https://fra.cloud.appwrite.io/v1/functions/mermaider-ai-gateway/executions',async route=>{
    received();await hold
    await route.fulfill({json:{status:'completed',responseStatusCode:200,responseBody:JSON.stringify({model:'stale',answers:{ready:{type:'choice',choice:'yes',probabilities:{yes:1,no:0}}}})}}).catch(()=>{})
  })
  await page.getByRole('region',{name:'Question: Is the release ready?'}).getByRole('button',{name:'Evaluate',exact:true}).click()
  await started
  await expect(page.locator('.decision-workspace .user-blob')).toHaveAttribute('data-busy','true')
  await expect(page.locator('.decision-workspace .user-blob .mo-expr')).toBeVisible()
  await page.locator('#flow-context').fill('Release is not ready.')
  release()
  await expect(page.locator('.decision-workspace .user-blob')).toHaveAttribute('data-busy','false')
  await expect(page.locator('.flow-suggestion')).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Choose Ready',exact:true})).toHaveAttribute('aria-pressed','false')
})

test('a branching diagram node opens interactive conversion without visiting the menu',async({page})=>{
  await page.goto('/')
  await page.locator('.preview-container .node[id^="flowchart-B-"]').click()
  await expect(page.getByRole('region',{name:'Diagram question'})).toBeVisible()
  await page.getByRole('button',{name:'Use this node as a question'}).click()
  await expect(page.locator('.tab-item')).toHaveCount(2)
  await expect(page.getByLabel('Question text')).toHaveValue('Decision')
  await expect(page.getByLabel('Answer text').first()).toHaveValue('Yes · Action 1')
})


test('automatic question adaptation proposes changes without replacing the active flow',async({page})=>{
  await prepare(page)
  await page.getByRole('button',{name:'Choose Ready',exact:true}).click()
  await page.route('https://fra.cloud.appwrite.io/v1/functions/mermaider-ai-gateway/executions',async route=>{
    const adapted=structuredClone(plan);adapted.questions[0].text='Is the private release ready?'
    await route.fulfill({json:{status:'completed',responseStatusCode:200,responseBody:JSON.stringify({choices:[{message:{content:JSON.stringify(adapted)}}]})}})
  })
  await page.getByLabel('Suggest question updates automatically').check()
  await page.locator('#flow-context').fill('We now need a private release.')
  await expect(page.getByRole('region',{name:'Proposed flow'})).toContainText('Is the private release ready?')
  await expect(page.getByRole('button',{name:'Choose Ready',exact:true})).toHaveAttribute('aria-pressed','true')
  await expect(page.locator('.preview-container svg')).toContainText('Is the release ready?')
  await page.getByRole('button',{name:'Apply draft',exact:true}).click()
  await expect(page.getByLabel('Question text').first()).toHaveValue('Is the private release ready?')
  await expect(page.getByRole('button',{name:'Choose Ready',exact:true})).toHaveAttribute('aria-pressed','false')
})


test('decision panel resizes with dragging and keyboard, persists its width and remains bounded on mobile',async({page})=>{
  await prepare(page)
  const panel=page.getByRole('complementary',{name:'Decision workspace'})
  const grip=page.getByRole('separator',{name:'Resize decision panel'})
  const svgId=await page.locator('.preview-container svg').getAttribute('id')
  const bounds=(await grip.boundingBox())!
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+150)
  await page.mouse.down();await page.mouse.move(bounds.x+bounds.width/2-150,bounds.y+150);await page.mouse.up()
  await expect(grip).toHaveAttribute('aria-valuenow','530')
  expect(Math.round((await panel.boundingBox())!.width)).toBe(530)
  expect(await page.locator('.preview-container svg').getAttribute('id')).toBe(svgId)
  await grip.focus();await page.keyboard.press('ArrowLeft')
  await expect(grip).toHaveAttribute('aria-valuenow','550')
  await page.reload();await page.getByTitle('Decisions (Preview)').click()
  await expect(grip).toHaveAttribute('aria-valuenow','550')
  await page.setViewportSize({width:390,height:844})
  await expect(grip).toHaveAttribute('aria-valuenow','351')
  expect((await panel.boundingBox())!.width).toBeLessThanOrEqual(351)
  await page.setViewportSize({width:1440,height:1000})
  await expect(grip).toHaveAttribute('aria-valuenow','550')
  await grip.focus();await page.keyboard.press('Home');await expect(grip).toHaveAttribute('aria-valuenow','280')
  await page.keyboard.press('End');await expect(grip).toHaveAttribute('aria-valuenow','760')
  expect((await page.locator('.preview-container').boundingBox())!.width).toBeGreaterThan(250)
  const touchBounds=(await grip.boundingBox())!
  const client=await page.context().newCDPSession(page)
  const point={x:touchBounds.x+4,y:touchBounds.y+150}
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]})
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,x:point.x+80}]})
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  await expect(grip).toHaveAttribute('aria-valuenow','680')
  expect(await page.evaluate(()=>document.body.style.cursor)).toBe('')
})

test('redo survives reload and exported decisions import into a separate tab; invalid files preserve the flow',async({page})=>{
  await prepare(page)
  await page.getByRole('button',{name:'Choose Ready',exact:true}).click()
  await page.getByRole('button',{name:'Choose Needs work',exact:true}).click()
  await page.getByRole('button',{name:'Undo',exact:true}).click()
  await page.reload();await page.getByTitle('Decisions (Preview)').click()
  await expect(page.getByRole('button',{name:'Redo',exact:true})).toBeEnabled()
  await page.getByRole('button',{name:'Redo',exact:true}).click()
  await expect(page.getByRole('button',{name:'Choose Needs work',exact:true})).toHaveAttribute('aria-pressed','true')
  await page.getByText('Save / load flow',{exact:true}).click()
  const downloadPromise=page.waitForEvent('download')
  await page.getByRole('button',{name:'Export decision JSON'}).click()
  const download=await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.decision\.json$/)
  const exported=await readFile((await download.path())!,'utf8')
  expect(exported).not.toContain('test-typesafe-key');expect(exported).not.toContain('test-openai-key')
  await page.locator('#flow-goal').fill('Changed after export')
  await page.getByLabel('Decision JSON file').setInputFiles({name:'release.decision.json',mimeType:'application/json',buffer:Buffer.from(exported)})
  await expect(page.locator('.tab-item')).toHaveCount(3)
  await expect(page.locator('#flow-goal')).toHaveValue('Prepare a release decision')
  await expect(page.getByRole('button',{name:'Choose Needs work',exact:true})).toHaveAttribute('aria-pressed','true')
  await expect(page.locator('#flow-mode')).toHaveValue('manual')
  await page.getByText('Save / load flow',{exact:true}).click()
  await page.getByLabel('Decision JSON file').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{"format":"mermaider-decision","version":99}')})
  await expect(page.getByRole('complementary',{name:'Decision workspace'}).getByRole('alert')).toContainText('version 1')
  await expect(page.locator('.tab-item')).toHaveCount(3)
  await page.locator('.tab-item').nth(1).click()
  await expect(page.locator('#flow-goal')).toHaveValue('Changed after export')
})

test('score rules stay reviewable in auto follow and their applied evidence survives reload in the history',async({page})=>{
  await prepare(page)
  const card=page.getByRole('region',{name:'Question: Is the release ready?'})
  await card.getByLabel('Evaluation type',{exact:true}).selectOption('score')
  await page.route('https://fra.cloud.appwrite.io/v1/functions/mermaider-ai-gateway/executions',async route=>{
    const request=JSON.parse(route.request().postDataJSON().body);const input=JSON.parse(request.body);const id=Object.keys(input.questions)[0];const definition=input.questions[id]
    const labels=Object.keys(definition.criteria)
    const answer=definition.type==='score'?{type:'score',score:1.75,confidence:0.99,probabilities:{0:0.05,1:0.15,2:0.8}}:{type:'choice',choice:labels[0],probabilities:Object.fromEntries(labels.map((label,index)=>[label,index===0?0.95:0.05/(labels.length-1)]))}
    await route.fulfill({json:{status:'completed',responseStatusCode:200,responseBody:JSON.stringify({model:'rules-test',answers:{[id]:answer}})}})
  })
  await page.locator('#flow-mode').selectOption('follow')
  await expect(card.locator('.flow-suggestion')).toContainText('Observed score: 1.75')
  await expect(card.getByRole('button',{name:'Choose Ready',exact:true})).toHaveAttribute('aria-pressed','false')
  await card.getByRole('button',{name:'Adopt suggestion'}).click()
  await expect(card.getByRole('button',{name:'Choose Ready',exact:true})).toHaveAttribute('aria-pressed','true')
  await page.locator('.flow-history > summary').click()
  await expect(page.locator('.flow-history')).toContainText('Observed score: 1.75')
  await expect(page.locator('.flow-history')).toContainText('rules-test')
  await page.reload();await page.getByTitle('Decisions (Preview)').click()
  await expect(card.getByLabel('Evaluation type',{exact:true})).toHaveValue('score')
  await page.locator('.flow-history > summary').click()
  await expect(page.locator('.flow-history')).toContainText('Observed score: 1.75')
  await card.getByText('Rule settings',{exact:true}).click()
  await card.getByLabel('High threshold').fill('0.4')
  await expect(page.getByRole('complementary',{name:'Decision workspace'}).getByRole('alert')).toContainText('low < high')
  await expect(card.getByLabel('High threshold')).toHaveValue('1.5')
})

test('noul uncertainty requires review; clear positive and negative results follow explicit rules',async({page})=>{
  await prepare(page)
  await page.getByRole('region',{name:'Question: Is the release ready?'}).getByLabel('Evaluation type',{exact:true}).selectOption('noul')
  await page.getByLabel('Question text').first().fill('The release is ready.')
  const card=page.getByRole('region',{name:'Question: The release is ready.'})
  let value=0.5
  await page.route('https://fra.cloud.appwrite.io/v1/functions/mermaider-ai-gateway/executions',async route=>{
    const request=JSON.parse(route.request().postDataJSON().body);const input=JSON.parse(request.body);const id=Object.keys(input.questions)[0];const definition=input.questions[id]
    const labels=Object.keys(definition.criteria||{})
    const answer=definition.type==='noul'?{type:'noul',noul:value,confidence:0.05}:{type:'choice',choice:labels[0],probabilities:Object.fromEntries(labels.map((label,index)=>[label,index===0?0.95:0.05/(labels.length-1)]))}
    await route.fulfill({json:{status:'completed',responseStatusCode:200,responseBody:JSON.stringify({model:'noul-test',answers:{[id]:answer}})}})
  })
  await page.locator('#flow-mode').selectOption('follow')
  await expect(card.locator('.flow-suggestion')).toContainText('Suggested: Unclear')
  await expect(card.getByRole('button',{name:'Choose Unclear',exact:true})).toHaveAttribute('aria-pressed','false')
  value=0.95;await page.locator('#flow-context').fill('All release checks passed.')
  await expect(card.getByRole('button',{name:'Choose Ready',exact:true})).toHaveAttribute('aria-pressed','true')
  value=0.05;await page.locator('#flow-context').fill('The release is blocked by failed checks.')
  await expect(card.getByRole('button',{name:'Choose Needs work',exact:true})).toHaveAttribute('aria-pressed','true')
  await page.locator('.flow-history > summary').click()
  await expect(page.locator('.flow-history')).toContainText('Observed P(true): 0.05')
  await expect(page.locator('.flow-history')).toContainText('Provider confidence: 0.05')
})
