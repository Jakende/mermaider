import {test} from 'node:test'
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
test('local update API enforces token, origin and version while keeping updates reviewable',async()=>{
 const token='test-only-token-at-least-16',child=spawn(process.execPath,['--import','tsx','src/decision/updateApi.ts'],{env:{...process.env,MERMAIDER_UPDATES_PORT:'0',MERMAIDER_UPDATES_TOKEN:token},stdio:['ignore','ignore','pipe']})
 try{
  const endpoint=await new Promise<string>((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(new Error('Local API startup timeout')),10000);child.once('exit',()=>{clearTimeout(timer);reject(new Error('Local API exited'))});child.stderr.on('data',chunk=>{log+=chunk;const match=log.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0])}})})
  const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json',Origin:'https://mermaider.appwrite.network'}
  const update={format:'mermaider-state-update',version:1,id:'test',sessionId:'flow-test',expectedRevision:2,state:'Approval revoked',source:'Test'}
  assert.equal((await fetch(endpoint+'/updates/flow-test')).status,401)
  assert.equal((await fetch(endpoint+'/updates',{method:'POST',headers:{...headers,Origin:'https://other.example'},body:JSON.stringify(update)})).status,403)
  assert.equal((await fetch(endpoint+'/updates',{method:'POST',headers,body:JSON.stringify({...update,version:2})})).status,400)
  assert.equal((await fetch(endpoint+'/updates',{method:'POST',headers,body:JSON.stringify(update)})).status,202)
  const pending=await fetch(endpoint+'/updates/flow-test',{headers});assert.equal(pending.headers.get('Access-Control-Allow-Origin'),headers.Origin);assert.deepEqual(await pending.json(),update)
  assert.equal((await fetch(endpoint+'/updates/flow-test',{headers})).status,200)
 }finally{child.kill()}
})
