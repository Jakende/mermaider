import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateDecision, normalizeDecisionResult, validateDecisionRequest, saveDecisionKey, loadDecisionKey } from '../src/decision/service'
import { choiceDiagram } from '../src/decision/diagram'
import type { DecisionRequest } from '../src/decision/types'
const input: DecisionRequest = {state:'Budget approved',questions:{budget:{type:'choice',criteria:{approved:'Budget approved',rejected:'Budget rejected'}}}}
const fixture = {model:'jev-test',answers:{budget:{type:'choice',choice:'approved',confidence:0.8,probabilities:{approved:0.9,rejected:0.1}}}}
Object.assign(globalThis,{window:{location:{origin:'https://mermaider.appwrite.network'}},sessionStorage:(()=>{const values=new Map<string,string>();return {setItem:(k:string,v:string)=>values.set(k,v),getItem:(k:string)=>values.get(k)||null,removeItem:(k:string)=>values.delete(k)}})()})

test('decision contract preserves choice, score and noul semantics without invented confidence',()=>{
  const request:DecisionRequest={state:{budget:true},questions:{...input.questions,score:{type:'score',criteria:['low','medium','high']},yes:{type:'noul'}}}
  validateDecisionRequest(request)
  const result=normalizeDecisionResult({...fixture,answers:{...fixture.answers,score:{type:'score',score:1.25,confidence:0.5,probabilities:{0:0.1,1:0.55,2:0.35}},yes:{type:'noul',noul:0.72}}},request)
  assert.equal(result.budget.value,'approved');assert.equal(result.score.value,1.25);assert.equal(result.yes.value,0.72)
  assert.equal(result.yes.confidence,undefined)
  assert.throws(()=>normalizeDecisionResult({...fixture,answers:{budget:{...fixture.answers.budget,choice:'foreign'}}},input),/Unknown option/)
  assert.throws(()=>normalizeDecisionResult({...fixture,answers:{}},input),/Missing/)
  assert.throws(()=>normalizeDecisionResult({...fixture,answers:{budget:{...fixture.answers.budget,probabilities:{approved:1.1,rejected:-0.1}}}},input),/Invalid option probabilities/)
  // Excess mass must not inflate a selected answer past the auto-follow gate.
  assert.throws(()=>normalizeDecisionResult({...fixture,answers:{budget:{...fixture.answers.budget,probabilities:{approved:0.81,rejected:0.205}}}},input),/Invalid option probabilities/)
  assert.throws(()=>validateDecisionRequest({state:null as any,questions:input.questions}),/Enter/)
})

test('Jev uses hosted transport; Laya stays local; provider errors never trigger a fallback',async()=>{
  const originalFetch=globalThis.fetch;const calls:string[]=[]
  globalThis.fetch=async(url,options)=>{
    calls.push(String(url))
    if(String(url).includes('/executions')) {
      const request=JSON.parse(JSON.parse(options!.body as string).body)
      assert.equal(request.url,'https://api.typesafe.ai/v1/systemone')
      return Response.json({status:'completed',responseStatusCode:200,responseBody:JSON.stringify(fixture)})
    }
    return Response.json({...fixture,model:'multilingual',routing:{model:'multilingual'}})
  }
  try {
    const jev=await evaluateDecision({provider:'jev',endpoint:'https://api.typesafe.ai',model:'jev-latest',apiKey:'test-typesafe-key'},input)
    assert.equal(jev.provider,'jev');assert.equal(jev.model,'jev-test')
    const laya=await evaluateDecision({provider:'laya',endpoint:'http://127.0.0.1:8000',model:'multilingual'},input)
    assert.equal(laya.provider,'laya');assert.deepEqual(laya.routing,{model:'multilingual'})
    assert.equal(calls[1],'http://127.0.0.1:8000/v1/systemone')
    globalThis.fetch=async()=>{calls.push('error');return new Response('',{status:503})}
    await assert.rejects(evaluateDecision({provider:'laya',endpoint:'http://127.0.0.1:8000',model:''},input),/HTTP 503/)
    assert.equal(calls.length,3)
    await assert.rejects(evaluateDecision({provider:'laya',endpoint:'https://external.example',model:''},input),/loopback/)
  } finally {globalThis.fetch=originalFetch}
})

test('decision keys remain separate and can be removed; choice diagrams highlight only a known selected option',async()=>{
  await saveDecisionKey('jev','test-jev-key');await saveDecisionKey('laya','test-laya-key')
  assert.equal(await loadDecisionKey('jev'),'test-jev-key');assert.equal(await loadDecisionKey('laya'),'test-laya-key')
  await saveDecisionKey('jev','');assert.equal(await loadDecisionKey('jev'),'')
  assert.equal(await loadDecisionKey('laya'),'test-laya-key')
  const code=choiceDiagram(input,'budget','approved');assert.match(code,/class option0 selected/);assert.match(code,/linkStyle 0/)
  assert.throws(()=>choiceDiagram(input,'budget','foreign'),/defined choice/)
})

test('malformed metadata and contradictory score distributions never enter decision history',()=>{
  const request:DecisionRequest={state:'Alle Tests bestanden, Freigabe ausstehend.',questions:{release:{type:'score',criteria:['Blockiert','Prüfung offen','Freigegeben']}}}
  const response={model:'multilingual',answers:{release:{type:'score',score:1.25,probabilities:{0:0.1,1:0.55,2:0.35}}}}
  assert.equal(normalizeDecisionResult(response,request).release.value,1.25)
  assert.throws(()=>normalizeDecisionResult({...response,answers:{release:{...response.answers.release,score:1.9}}},request),/disagree/)
  assert.throws(()=>normalizeDecisionResult({...response,answers:{release:{...response.answers.release,probabilities:[0.1,0.55,0.35]}}},request),/probabilities/)
  for(const model of ['', ' '.repeat(3),'x'.repeat(301)])assert.throws(()=>normalizeDecisionResult({...response,model},request),/invalid response/)
  const rounded={...response,answers:{release:{type:'score',score:1.3333,probabilities:{0:0.1111,1:0.4444,2:0.4445}}}}
  assert.equal(normalizeDecisionResult(rounded,request).release.value,1.3333)
  const noulRequest:DecisionRequest={state:request.state,questions:{release:{type:'noul'}}}
  const noul=normalizeDecisionResult({model:'jev',answers:{release:{type:'noul',noul:0.5,probabilities:{unexpected:'provider extension'}}}},noulRequest)
  assert.equal(noul.release.probabilities,undefined)
})
