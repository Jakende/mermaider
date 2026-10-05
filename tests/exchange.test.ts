import {test} from 'node:test'
import assert from 'node:assert/strict'
import {changeFlow,chooseFlow,newFlowSession,validateFlow,restoreFlow,flowRequest} from '../src/decision/flow'
import {applyStateUpdate,compareEvents,exportReport,replayEvent,stateUpdate} from '../src/decision/exchange'
import {exportFlow,importFlow} from '../src/decision/sessionFile'
const plan=()=>validateFlow({title:'Approval',startId:'a',questions:[{id:'a',text:'Approved?',options:[{id:'yes',label:'Yes',nextId:'b'},{id:'no',label:'No'}]},{id:'b',text:'Ship?',options:[{id:'yes',label:'Yes'},{id:'no',label:'No'}],requirements:{mode:'all',answers:[{questionId:'a',optionId:'yes'}]}}]})
const session=()=>changeFlow(newFlowSession(),{plan:plan(),goal:'Ship safely',context:'Tests passed'},'Plan')
test('combined requirements validate dependency paths and never use unconfirmed answers',()=>{
  let s=chooseFlow(session(),'a','yes');s=chooseFlow(s,'b','yes')
  s=changeFlow(s,{context:'Tests now failed'},'Updated state')
  assert.throws(()=>chooseFlow(s,'b','yes'),/preceding answers/)
  assert.throws(()=>flowRequest(s,'b'),/preceding answers/)
  assert.throws(()=>validateFlow({...plan(),questions:plan().questions.map(q=>q.id==='a'?{...q,requirements:{mode:'all',answers:[{questionId:'b',optionId:'yes'}]}}:q)}),/preceding answer path/)
  const file=JSON.parse(exportFlow(s));assert.equal(file.version,4)
  assert.ok(importFlow(JSON.stringify(file)).plan!.questions[1].requirements)
  file.version=3;assert.throws(()=>importFlow(JSON.stringify(file)),/version 4/)
  assert.throws(()=>validateFlow({title:'Conflicting branches',startId:'a',questions:[
    {id:'a',text:'Branch?',options:[{id:'b',label:'B',nextId:'b'},{id:'c',label:'C',nextId:'c'}]},
    {id:'b',text:'B?',options:[{id:'yes',label:'Yes',nextId:'d'},{id:'no',label:'No'}]},
    {id:'c',text:'C?',options:[{id:'yes',label:'Yes',nextId:'d'},{id:'no',label:'No'}]},
    {id:'d',text:'Both?',options:[{id:'yes',label:'Yes'},{id:'no',label:'No'}],requirements:{mode:'all',answers:[{questionId:'b',optionId:'yes'},{questionId:'c',optionId:'yes'}]}}
  ]}),/together on one path/)
})
test('external updates reject wrong sessions and stale or repeated revisions and require review',()=>{
  const s=chooseFlow(session(),'a','yes'),update=stateUpdate(s,'Approval revoked')
  const changed=applyStateUpdate(s,update)
  assert.equal(changed.context,'Approval revoked');assert.equal(changed.selections.a.needsReview,true)
  assert.throws(()=>applyStateUpdate(changed,update),/outdated revision/)
  assert.throws(()=>applyStateUpdate(s,{...update,sessionId:'other'}),/another session/)
})
test('full retained history replays after reload and reports exclude injected provider keys',()=>{
  const initial=session(),chosen=chooseFlow(initial,'a','yes'),changed=changeFlow(chosen,{context:'A'.repeat(3000)},'Updated state')
  const recovered=restoreFlow(JSON.parse(JSON.stringify(changed)))!
  const snapshot=recovered.events.find(event=>event.note==='Selected answer')!
  const replayed=replayEvent(recovered,snapshot.id)
  assert.equal(replayed.context,'Tests passed');assert.equal(replayed.selections.a.optionId,'yes')
  assert.ok(replayed.revision>recovered.revision)
  const report=JSON.parse(exportReport({...recovered,apiKey:'never-share'} as any))
  assert.ok(!JSON.stringify(report).includes('never-share'));assert.equal(report.events.at(-1).snapshot.context.length,3000)
  const comparison=JSON.parse(compareEvents(recovered,snapshot.id,recovered.events.at(-1)!.id))
  assert.equal(comparison.state.after.length,3000)
})
