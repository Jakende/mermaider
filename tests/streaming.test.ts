import {test} from 'node:test'
import assert from 'node:assert/strict'
import {streamingGatewayRequest} from '../functions/ai-gateway/src/main.js'
const payload={url:'https://api.openai.com/v1/responses',method:'POST',authorization:'Bearer example-key-only',body:'{}'}
test('streaming preserves incremental SSE and rejects arbitrary targets before network access',async()=>{
  let next:ReadableStreamDefaultController<Uint8Array> | undefined
  const response=await streamingGatewayRequest(payload,async()=>new Response(new ReadableStream({start(controller){next=controller;controller.enqueue(new TextEncoder().encode('data: first\n\n'))}}),{headers:{'Content-Type':'text/event-stream'}}))
  const reader=response.body!.getReader()
  assert.equal(new TextDecoder().decode((await reader.read()).value),'data: first\n\n')
  next!.enqueue(new TextEncoder().encode('data: second\n\n'));next!.close()
  assert.equal(new TextDecoder().decode((await reader.read()).value),'data: second\n\n')
  assert.equal((await reader.read()).done,true)
  const denied=await streamingGatewayRequest({...payload,url:'http://127.0.0.1/private'},async()=>{throw new Error('Must not fetch')})
  assert.equal(denied.status,403)
})
test('streaming caps response bytes and never relays upstream credential errors',async()=>{
  const oversized=await streamingGatewayRequest(payload,async()=>new Response(new Uint8Array(512*1024+1)))
  await assert.rejects(oversized.text(),/512 KB/)
  const denied=await streamingGatewayRequest(payload,async()=>new Response('example-key-only',{status:401}))
  assert.equal(denied.status,401);assert.ok(!(await denied.text()).includes('example-key-only'))
})
