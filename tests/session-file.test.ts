import {test} from 'node:test'
import assert from 'node:assert/strict'
import {newFlowSession,changeFlow,chooseFlow} from '../src/decision/flow'
import {exportFlow,importFlow,MAX_FLOW_FILE_BYTES} from '../src/decision/sessionFile'
const session=()=>chooseFlow(changeFlow(newFlowSession(),{goal:'Prepare release',context:'Tests pass',plan:{title:'Release',startId:'ready',questions:[{id:'ready',text:'Ready?',options:[{id:'yes',label:'Yes',nextId:undefined},{id:'no',label:'No',nextId:undefined}]}]}},'Plan'),'ready','yes')
test('portable files round trip question state and exclude credentials, suggestions and private undo history',()=>{
  const original=session()
  const text=exportFlow({...original,apiKey:'must-not-export',history:[{...original.history[0],context:'old-private-context'}]} as any)
  assert.ok(!text.includes('must-not-export'));assert.ok(!text.includes('old-private-context'));assert.ok(!text.includes('suggestions'))
  const restored=importFlow(text)
  assert.deepEqual(restored.plan,JSON.parse(JSON.stringify(original.plan)));assert.deepEqual(restored.selections,JSON.parse(JSON.stringify(original.selections)))
  assert.equal(restored.goal,original.goal);assert.equal(restored.context,original.context)
  assert.notEqual(restored.id,original.id);assert.deepEqual(restored.history,[]);assert.deepEqual(restored.future,[])
  const reordered=JSON.parse(text);reordered.session.selections.ready={source:'manual',optionId:'yes'}
  assert.equal(importFlow(JSON.stringify(reordered)).selections.ready.optionId,'yes')
})
test('unsupported files, oversized files, bad graph links and undefined selections are rejected',()=>{
  assert.throws(()=>importFlow('{'),/valid JSON/)
  assert.throws(()=>importFlow(JSON.stringify({format:'mermaider-decision',version:2})),/version 1/)
  assert.throws(()=>importFlow('x'.repeat(MAX_FLOW_FILE_BYTES+1)),/1 MB/)
  const file=JSON.parse(exportFlow(session()));file.session.plan.questions[0].options[0].nextId='missing'
  assert.throws(()=>importFlow(JSON.stringify(file)),/invalid decision/)
  file.session.plan.questions[0].options[0].nextId=null;file.session.selections.ready.optionId='missing'
  assert.throws(()=>importFlow(JSON.stringify(file)),/invalid or unreachable/)
})

test('the German acceptance fixture imports all three question types with reviewable numeric rules',async()=>{
  const {readFile}=await import('node:fs/promises')
  const session=importFlow(await readFile(new URL('../docs/fixtures/decision-acceptance.de.decision.json',import.meta.url),'utf8'))
  assert.deepEqual(session.plan!.questions.map(question=>question.evaluation?.type),['choice','score','noul'])
  assert.deepEqual(session.selections,{})
  assert.equal(session.plan!.questions[1].evaluation?.type,'score')
  assert.equal(session.goal.includes('Fakten'),true)
  assert.equal(JSON.parse(exportFlow(session)).version,2)
})

test('review flags survive portable files and require a version older clients reject',()=>{
  const updated=changeFlow(session(),{context:'Checks changed'},'Updated state')
  const text=exportFlow(updated);const file=JSON.parse(text)
  assert.equal(file.version,3)
  assert.equal(importFlow(text).selections.ready.needsReview,true)
  file.version=2;assert.throws(()=>importFlow(JSON.stringify(file)),/file version 3/)
  file.version=3;file.session.selections.ready.needsReview='yes'
  assert.throws(()=>importFlow(JSON.stringify(file)),/invalid decision/)
})
