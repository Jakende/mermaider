import {chromium} from '@playwright/test'
import {spawn} from 'node:child_process'
import {writeFileSync,statSync,readdirSync} from 'node:fs'
import os from 'node:os'
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5185','--strictPort'],{stdio:'ignore'})
let browser
try{
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:5185')).ok)break}catch{}await new Promise(resolve=>setTimeout(resolve,100))}
 browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 const page=await browser.newPage({viewport:{width:1440,height:1000}})
 await page.goto('http://127.0.0.1:5185');await page.waitForFunction(()=>window.monaco?.editor.getModels().length)
 const results=[]
 const render=async(code,marker)=>{
  const previous=await page.locator('.preview-container svg').getAttribute('id').catch(()=>null)
  const start=performance.now()
  await page.evaluate(code=>window.monaco.editor.getModels()[0].setValue(code),code)
  await page.waitForFunction(({marker,previous})=>{const svg=document.querySelector('.preview-container svg');return svg&&svg.id!==previous&&svg.textContent.includes(marker)},{marker,previous},{timeout:60000})
  const result=await page.locator('.preview-container svg').evaluate(svg=>({renderMs:Number(svg.dataset.renderMs),cache:svg.dataset.renderCache,svgCharacters:svg.outerHTML.length}))
  return {...result,wallMs:Math.round(performance.now()-start)}
 }
 for(const nodes of [10,50,200])for(let repetition=0;repetition<3;repetition++){
  const marker=`benchmark-${nodes}-${repetition}`,code='flowchart TD\n'+Array.from({length:nodes},(_,i)=>`N${i}["${marker} node ${i}"]${i<nodes-1?` --> N${i+1}`:''}`).join('\n')
  const cold=await render(code,marker)
  await render(`flowchart TD\nreset["reset-${marker}"]`,`reset-${marker}`)
  const warm=await render(code,marker)
  results.push({nodes,repetition,cold,warm})
 }
 const output=process.argv[2]||'render-benchmark.json',assets=readdirSync('dist/assets').map(file=>({file,bytes:statSync(`dist/assets/${file}`).size}))
 writeFileSync(output,JSON.stringify({generatedAt:new Date().toISOString(),reference:{platform:os.platform(),architecture:os.arch(),cpu:os.cpus()[0]?.model,browser:await browser.version(),viewport:'1440×1000'},limits:'Cloud reference measurements, not user device acceptance. Wall time includes the editor debounce and polling; render time includes Mermaid work only. Three correlated runs per size; no cross-device promise.',results,assets},null,2)+'\n')
 console.log(`Recorded ${results.length} cold/cache pairs in ${output}`)
}finally{await browser?.close();server.kill()}
