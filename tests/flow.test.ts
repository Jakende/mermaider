import {test} from 'node:test'
import assert from 'node:assert/strict'
import {newFlowSession,validateFlow,changeFlow,chooseFlow,flowPath,flowDiagram,flowRequest,restoreFlow,undoFlow,redoFlow} from '../src/decision/flow'
const plan=()=>validateFlow({title:'Release',startId:'ready',questions:[
  {id:'ready',text:'Ready?',options:[{id:'yes',label:'Ready',nextId:'ship'},{id:'no',label:'Needs changes'}]},
  {id:'ship',text:'Which channel?',options:[{id:'public',label:'Public release'},{id:'private',label:'Private test'}]}
]})
test('branch switches invalidate downstream answers and undo restores decisions; context invalidates only model choices',()=>{
  let session=changeFlow(newFlowSession(),{plan:plan(),goal:'Prepare release',context:'Ready for public distribution'},'Plan')
  session=chooseFlow(session,'ready','yes')
  session=chooseFlow(session,'ship','public','model',0.95)
  assert.deepEqual(flowPath(session).questions,['ready','ship'])
  const switched=chooseFlow(session,'ready','no')
  assert.deepEqual(Object.keys(switched.selections),['ready'])
  assert.equal(switched.selections.ready.optionId,'no')
  assert.equal(undoFlow(switched).selections.ship.optionId,'public')
  const updated=changeFlow(session,{context:'Private distribution only'},'Updated state')
  assert.equal(updated.selections.ready.optionId,'yes')
  assert.equal(updated.selections.ship,undefined)
  assert.equal(flowPath(updated).pending,'ship')
  const request=flowRequest(updated,'ship')
  assert.equal(request.questions.ship.type,'choice')
  assert.equal((request.state as any).path[0].answer,'Ready')
})
test('criteria edits invalidate selections, follow-up link edits preserve the unchanged answer meaning',()=>{
  let session=changeFlow(newFlowSession(),{plan:plan()},'Plan');session=chooseFlow(session,'ready','yes')
  const changed=plan();changed.questions[0].options[0].label='Not ready'
  assert.equal(changeFlow(session,{plan:changed},'Edit').selections.ready,undefined)
  const linked=plan();linked.questions[0].options[0].nextId=undefined
  assert.equal(changeFlow(session,{plan:linked},'Relink').selections.ready.optionId,'yes')
  assert.throws(()=>chooseFlow(changeFlow(newFlowSession(),{plan:plan()},'Plan'),'ship','public'),/reachable/)
})
test('invalid graphs and corrupted sessions cannot enter the engine; valid history survives reload',()=>{
  const cyclic=plan();cyclic.questions[1].options[0].nextId='ready';assert.throws(()=>validateFlow(cyclic),/loop/)
  const missing=plan();missing.questions[0].options[0].nextId='missing';assert.throws(()=>validateFlow(missing),/missing/)
  const duplicate=plan();duplicate.questions[1].id='ready';assert.throws(()=>validateFlow(duplicate),/unique/)
  const collision=plan();collision.questions[1].id='ready__yes';collision.questions[0].options[0].nextId='ready__yes';assert.throws(()=>validateFlow(collision),/unique diagram/);
  assert.equal(restoreFlow({version:99}),undefined)
  let session=changeFlow(newFlowSession(),{plan:plan()},'Plan');session=chooseFlow(session,'ready','yes')
  const restored=restoreFlow(JSON.parse(JSON.stringify(session)))!
  assert.equal(restored.selections.ready.optionId,'yes');assert.equal(restored.history.length,2)
  assert.equal(undoFlow(restored).selections.ready,undefined)
  const source=flowDiagram(plan())
  assert.ok(!source.includes('selected'));assert.match(source,/ready__yes --> ship/)
  assert.equal(flowDiagram(session.plan!),source)
})

test('typing coalesces into one undo step and retains revision protection',()=>{
  let session=changeFlow(newFlowSession(),{context:'a'},'Updated state')
  session=changeFlow(session,{context:'ab'},'Updated state')
  session=changeFlow(session,{context:'abc'},'Updated state')
  assert.equal(session.history.length,1);assert.equal(session.revision,3)
  assert.equal(undoFlow(session).context,'')
})


test('redo restores a pruned branch after reload and a new edit discards the redo branch',()=>{
  let session=changeFlow(newFlowSession(),{plan:plan(),context:'Ready'},'Plan')
  session=chooseFlow(session,'ready','yes');session=chooseFlow(session,'ship','public','model',0.95)
  const before=session
  session=chooseFlow(session,'ready','no');session=undoFlow(session)
  assert.deepEqual(session.selections,before.selections)
  assert.equal(session.future.length,1)
  session=restoreFlow(JSON.parse(JSON.stringify(session)))!
  const redone=redoFlow(session)
  assert.equal(redone.selections.ready.optionId,'no');assert.equal(redone.selections.ship,undefined)
  assert.equal(redone.revision,session.revision+1);assert.equal(redone.future.length,0)
  assert.deepEqual(undoFlow(redone).selections,JSON.parse(JSON.stringify(before.selections)))
  const edited=changeFlow(session,{context:'New update'},'Updated state')
  assert.equal(edited.future.length,0);assert.equal(redoFlow(edited),edited)
})

test('older sessions migrate without redo and corrupted history cannot recurse',()=>{
  const old={...newFlowSession(),future:undefined}
  assert.deepEqual(restoreFlow(old)?.future,[])
  assert.deepEqual(restoreFlow({...old,history:[null],future:[null]})?.history,[])
  let session=changeFlow(newFlowSession(),{context:'a'},'Updated state')
  session=changeFlow(session,{context:'b'},'Updated state');session=undoFlow(session)
  session=changeFlow(session,{context:'c'},'Updated state')
  assert.equal(undoFlow(session).context,'')
})
