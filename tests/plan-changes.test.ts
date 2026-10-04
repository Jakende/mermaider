import {test} from 'node:test'
import assert from 'node:assert/strict'
import {validateFlow} from '../src/decision/flow'
import {planChanges} from '../src/decision/planChanges'
test('draft review identifies changed routes and removed questions without mutating either plan',()=>{
  const current=validateFlow({title:'Release',startId:'ready',questions:[{id:'ready',text:'Ready?',options:[{id:'yes',label:'Yes',nextId:'channel'},{id:'no',label:'No'}]},{id:'channel',text:'Where?',options:[{id:'public',label:'Public'},{id:'private',label:'Private'}]}]})
  const draft=structuredClone(current);draft.questions.pop();draft.questions[0].options[0].nextId=undefined
  const before=JSON.stringify(current), proposed=JSON.stringify(draft)
  const changes=planChanges(current,draft)
  assert.deepEqual(changes.changed.map(q=>q.id),['ready']);assert.deepEqual(changes.removed.map(q=>q.id),['channel'])
  assert.deepEqual(changes.added,[]);assert.equal(changes.startChanged,false)
  assert.equal(JSON.stringify(current),before);assert.equal(JSON.stringify(draft),proposed)
  assert.equal(planChanges(null,current).added.length,2)
})
