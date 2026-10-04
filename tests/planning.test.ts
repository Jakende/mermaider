import {test} from 'node:test'
import assert from 'node:assert/strict'
import {validateFlow} from '../src/decision/flow'
import {parsePlannedFlow} from '../src/decision/planning'
const original=()=>validateFlow({title:'Release',startId:'ready',questions:[{id:'ready',text:'Are all release tests passed and is the release ready?',options:[{id:'yes',label:'Yes, every test passed and the release is ready',nextId:'approval'},{id:'no',label:'No, the release is not ready'}]},{id:'approval',text:'The responsible person approved publication.',options:[{id:'yes',label:'Approved'},{id:'no',label:'Rejected'},{id:'unknown',label:'Unknown'}],evaluation:{type:'noul',low:0.2,high:0.8,lowId:'no',highId:'yes',uncertainId:'unknown'}}]})
test('wording simplification preserves numeric evaluation and routing while accepting shorter text',()=>{
  const before=original(),draft=structuredClone(before)
  draft.title='Release review';draft.questions[0].text='Are the release checks complete?';draft.questions[0].options[0].label='Complete'
  const result=parsePlannedFlow('```json\n'+JSON.stringify(draft)+'\n```',before)
  assert.equal(result.questions[0].text,'Are the release checks complete?')
  assert.deepEqual(result.questions[1].evaluation,before.questions[1].evaluation)
  assert.equal(result.questions[0].options[0].nextId,'approval')
  assert.equal(before.questions[0].text,original().questions[0].text)
})
test('wording-only responses cannot silently change branches, answer order or numeric rules',()=>{
  const before=original()
  for(const mutate of [
    (plan:any)=>{plan.startId='approval'},
    (plan:any)=>{plan.questions[0].options[1].nextId='approval'},
    (plan:any)=>{plan.questions[0].options.reverse()},
    (plan:any)=>{plan.questions[1].evaluation.high=0.95},
    (plan:any)=>{plan.questions[1].evaluation={type:'choice'}},
    (plan:any)=>{plan.questions[1].options[2].id='unclear';plan.questions[1].evaluation.uncertainId='unclear'}
  ]){
    const draft=structuredClone(before);mutate(draft)
    assert.throws(()=>parsePlannedFlow(JSON.stringify(draft),before),/structure or evaluation rules/)
  }
})
test('blank, malformed and disconnected planning responses are rejected',()=>{
  assert.throws(()=>parsePlannedFlow('not JSON'),/valid flow/)
  const blank=original();blank.questions[0].options[0].label=' '
  assert.throws(()=>parsePlannedFlow(JSON.stringify(blank)),/must have text/)
  const disconnected=original();disconnected.questions[0].options[0].nextId=undefined
  assert.throws(()=>parsePlannedFlow(JSON.stringify(disconnected)),/disconnected/)
})
