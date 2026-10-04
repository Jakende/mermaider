import {test} from 'node:test'
import assert from 'node:assert/strict'
import {newFlowSession,changeFlow,flowRequest,chooseFlow,restoreFlow,undoFlow,redoFlow,recordFlowEvent,validateFlow} from '../src/decision/flow'
import type {FlowQuestion} from '../src/decision/flow'
import {mapDecisionAnswer} from '../src/decision/rules'
import {exportFlow,importFlow} from '../src/decision/sessionFile'
const question=(type:'score'|'noul'):FlowQuestion=>({id:'ready',text:'The release is ready.',options:[{id:'yes',label:'Ready',nextId:undefined},{id:'no',label:'Needs work',nextId:undefined},{id:'unknown',label:'Unclear',nextId:undefined}],evaluation:type==='score'?{type:'score',rubric:['Blocked','Needs review','Ready'],low:0.5,high:1.5,lowId:'no',highId:'yes',uncertainId:'unknown'}:{type:'noul',low:0.2,high:0.8,lowId:'no',highId:'yes',uncertainId:'unknown'}})
const metadata={provider:'jev' as const,model:'test',timestamp:1000,elapsedMs:5}
const start=(type:'score'|'noul')=>changeFlow(newFlowSession(),{plan:{title:'Release',startId:'ready',questions:[question(type)]},context:'Tests pass'},'Plan')
test('score uses the expected rubric index, inclusive explicit boundaries and never an invented option confidence',()=>{
  const q=question('score')
  for(const [value,id] of [[0.5,'no'],[1.25,'unknown'],[1.5,'yes']] as const){
    const mapped=mapDecisionAnswer(q,{type:'score',value,probabilities:{0:0.1,1:0.3,2:0.6},confidence:0.4},metadata)
    assert.equal(mapped.optionId,id);assert.equal(mapped.probability,undefined);assert.equal(mapped.autoEligible,false)
    assert.equal(mapped.evidence.value,value);assert.equal(mapped.evidence.confidence,0.4)
  }
  assert.deepEqual(flowRequest(start('score'),'ready').questions.ready,{type:'score',instructions:q.text,criteria:['Blocked','Needs review','Ready']})
  assert.throws(()=>mapDecisionAnswer(q,{type:'score',value:3},metadata),/out-of-range/)
})
test('noul routes true/false by probability and retains an uncertainty band without automatic adoption',()=>{
  const q=question('noul')
  const low=mapDecisionAnswer(q,{type:'noul',value:0.1},metadata)
  assert.equal(low.optionId,'no');assert.equal(low.probability,0.9);assert.equal(low.autoEligible,true)
  const middle=mapDecisionAnswer(q,{type:'noul',value:0.5},metadata)
  assert.equal(middle.optionId,'unknown');assert.equal(middle.probability,undefined);assert.equal(middle.autoEligible,false)
  const high=mapDecisionAnswer(q,{type:'noul',value:0.9},metadata)
  assert.equal(high.optionId,'yes');assert.equal(high.probability,0.9)
  assert.equal(high.evidence.confidence,undefined)
  assert.equal(flowRequest(start('noul'),'ready').questions.ready.type,'noul')
  assert.throws(()=>mapDecisionAnswer(q,{type:'choice',value:'yes'},metadata),/type/)
})
test('invalid rule scales and targets are rejected; rule edits invalidate model decisions; numeric files use version 2',()=>{
  const original=start('score');const q=question('score')
  const invalid=structuredClone(original.plan!);(invalid.questions[0].evaluation as any).high=3
  assert.throws(()=>validateFlow(invalid),/scale/)
  ;(invalid.questions[0].evaluation as any).high=1.5;(invalid.questions[0].evaluation as any).uncertainId='yes'
  assert.throws(()=>validateFlow(invalid),/distinct/)
  const mapped=mapDecisionAnswer(q,{type:'score',value:1.8},metadata)
  const selected=chooseFlow(original,'ready',mapped.optionId,'model',mapped.probability,mapped.evidence)
  const updated=structuredClone(original.plan!);(updated.questions[0].evaluation as any).high=1.9
  assert.equal(changeFlow(selected,{plan:updated},'Edited question').selections.ready,undefined)
  const text=exportFlow(selected);assert.equal(JSON.parse(text).version,2)
  const imported=importFlow(text);assert.equal(imported.selections.ready.evidence?.value,1.8);assert.equal(imported.plan!.questions[0].evaluation?.type,'score')
  assert.deepEqual(imported.events,[])
  const downgraded=JSON.parse(text);downgraded.version=1;assert.throws(()=>importFlow(JSON.stringify(downgraded)),/version 2/)
})
test('audit records model evidence and manual selections, persists through undo/redo, excludes arbitrary run fields and stays bounded',()=>{
  let session=start('noul')
  const mapped=mapDecisionAnswer(question('noul'),{type:'noul',value:0.9},{...metadata,apiKey:'do-not-retain',input:'private-provider-payload'} as any)
  assert.ok(!JSON.stringify(mapped.evidence).includes('do-not-retain'));assert.ok(!JSON.stringify(mapped.evidence).includes('private-provider-payload'))
  session=recordFlowEvent(session,'Model evaluated',{question:question('noul').text,answer:'Ready',source:'model',evidence:mapped.evidence})
  session=chooseFlow(session,'ready','yes','model',0.9,mapped.evidence)
  session=undoFlow(session);session=redoFlow(session)
  const restored=restoreFlow(JSON.parse(JSON.stringify(session)))!
  assert.equal(restored.events.length,5);assert.equal(restored.events[2].evidence!.value,0.9)
  assert.equal(restored.events[3].note,'Undo: Selected answer')
  session=chooseFlow(restored,'ready','no');assert.equal(session.events[5].source,'manual')
  for(let i=0;i<60;i++)session=recordFlowEvent(session,'Model evaluated')
  assert.equal(session.events.length,50)
  session=changeFlow(session,{context:'a'.repeat(1500)},'Updated state');session=changeFlow(session,{context:'b'},'Updated state')
  assert.equal(session.events.length,50);assert.equal(session.events[49].context,'b')
})
