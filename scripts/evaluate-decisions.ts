import {writeFileSync,readFileSync} from 'node:fs'
import {normalizeDecisionResult,validateDecisionRequest} from '../src/decision/service'
import type {DecisionRequest} from '../src/decision/types'
const args=process.argv.slice(2),option=(name:string,fallback:string)=>{const index=args.indexOf(name);return index>=0?args[index+1]||fallback:fallback}
const provider=option('--provider','laya'),model=option('--model',provider==='laya'?'multilingual':'jev-latest')
const endpoint=new URL(option('--endpoint',provider==='laya'?'http://127.0.0.1:8000':'https://api.typesafe.ai'))
if(provider==='laya'?!['127.0.0.1','localhost','[::1]'].includes(endpoint.hostname)||!['http:','https:'].includes(endpoint.protocol):provider!=='jev'||endpoint.origin!=='https://api.typesafe.ai')throw new Error('Use a loopback Laya endpoint or the official Jev endpoint.')
if(endpoint.username||endpoint.password||endpoint.search||endpoint.hash||!['','/'].includes(endpoint.pathname))throw new Error('Use a plain provider base URL.')
const repetitions=Number(option('--repetitions','3'));if(!Number.isInteger(repetitions)||repetitions<1||repetitions>20)throw new Error('Choose 1–20 repetitions.')
const cases=JSON.parse(readFileSync(new URL('../docs/fixtures/model-benchmark.json',import.meta.url),'utf8')) as {id:string;language:string;question:string;yes:string;no:string;states:{text:string;expected:'yes'|'no'}[]}[]
const key=process.env[provider==='laya'?'LAYA_API_KEY':'MERMAIDER_JEV_API_KEY']
if(provider==='jev'&&!key&&!args.includes('--dry-run'))throw new Error('Set MERMAIDER_JEV_API_KEY in the process environment; never put it in a result file.')
const results:{caseId:string;language:string;repetition:number;step:number;expected:string;choice?:string;probability?:number;latencyMs:number;error?:string;model?:string}[]=[]
for(let repetition=0;repetition<repetitions;repetition++)for(const item of cases)for(const [step,state] of item.states.entries()){
 const input:DecisionRequest={state:state.text,questions:{q:{type:'choice',instructions:item.question,criteria:{yes:item.yes,no:item.no}}}};validateDecisionRequest(input)
 if(args.includes('--dry-run'))continue
 const start=performance.now()
 try{const response=await fetch(endpoint.origin+'/v1/systemone',{method:'POST',headers:{'Content-Type':'application/json',...(key?{Authorization:`Bearer ${key}`}:{})},body:JSON.stringify({...input,model}),signal:AbortSignal.timeout(50000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json(),answer=normalizeDecisionResult(data,input).q;results.push({caseId:item.id,language:item.language,repetition,step,expected:state.expected,choice:String(answer.value),probability:answer.probabilities!.yes,latencyMs:Math.round(performance.now()-start),model:data.model})}catch(failure){results.push({caseId:item.id,language:item.language,repetition,step,expected:state.expected,latencyMs:Math.round(performance.now()-start),error:failure instanceof Error&&/^HTTP \d+$/.test(failure.message)?failure.message:'Request or contract failed'})}
}
if(args.includes('--dry-run')){console.log(`${cases.length} bilingual cases × A/B/A × ${repetitions} repetitions = ${cases.length*3*repetitions} planned requests; no inference performed.`);process.exit(0)}
const successful=results.filter(r=>r.choice),sorted=successful.map(r=>r.latencyMs).sort((a,b)=>a-b)
const pairs=cases.flatMap(item=>Array.from({length:repetitions},(_,repetition)=>results.filter(r=>r.caseId===item.id&&r.repetition===repetition))).filter(items=>items.length===3&&items.every(r=>r.choice))
const report={provider,requestedModel:model,endpoint:endpoint.origin,generatedAt:new Date().toISOString(),repetitions,cases:cases.length,requests:results.length,errors:results.filter(r=>r.error).length,accuracy:successful.length?successful.filter(r=>r.choice===r.expected).length/successful.length:null,binaryBrierScore:successful.length?successful.reduce((sum,r)=>sum+(r.probability!-(r.expected==='yes'?1:0))**2,0)/successful.length:null,abaConsistency:pairs.length?pairs.filter(items=>items[0].choice===items[2].choice).length/pairs.length:null,latencyMs:{median:sorted[Math.floor(sorted.length/2)]??null,p95:sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*.95)-1)]??null},limits:'Small authored benchmark; repetitions are correlated, not independent population samples. No reliability guarantee or automatic threshold calibration.',results}
const output=option('--output','decision-benchmark.json');writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(`Recorded ${results.length} real requests in ${output}; ${report.errors} errors. No credentials exported.`)
