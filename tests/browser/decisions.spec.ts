import {test,expect} from '@playwright/test'
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
  const blob=await page.locator('.toolbar .user-blob img').getAttribute('src')
  await page.reload();await page.getByTitle('Decisions (Preview)').click()
  await expect(page.getByRole('button',{name:'Choose Public release',exact:true})).toHaveAttribute('aria-pressed','true')
  expect(await page.locator('.toolbar .user-blob img').getAttribute('src')).toBe(blob)
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
  await page.locator('#flow-context').fill('Release is not ready.')
  release()
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
