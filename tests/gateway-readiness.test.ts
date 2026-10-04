import {test} from 'node:test'
import assert from 'node:assert/strict'
// Deployment scripts are plain JavaScript, shared with CI.
import {verifyGatewayReadiness,executionSummary} from '../scripts/gateway-readiness.mjs'
const health={status:'completed',responseStatusCode:200,responseBody:JSON.stringify({name:'mermaider-ai-gateway'})}
test('readiness retries a failed cold start and still verifies endpoint rejection',async()=>{
  let calls=0;const paths:string[]=[];const logs:string[]=[]
  const result=await verifyGatewayReadiness(async(path:string)=>{paths.push(path);calls++;return calls===1?{status:'failed',responseStatusCode:0,errors:'Runtime connection timeout secret-value'}:path==='/health'?health:{status:'completed',responseStatusCode:403}},{wait:async()=>{},log:(value:string)=>logs.push(value)})
  assert.equal(result.health.responseStatusCode,200);assert.deepEqual(paths,['/health','/health','/request'])
  assert.ok(!logs.join('').includes('secret-value'))
  assert.deepEqual(executionSummary({errors:'out of memory',responseStatusCode:500}),{status:'unknown',http:500,reason:'memory'})
})
test('unexpected successful health and permissive targets fail without retries',async()=>{
  let calls=0
  await assert.rejects(verifyGatewayReadiness(async()=>{calls++;return {...health,responseBody:'{}'}},{wait:async()=>{},log:()=>{}}),/unexpected/)
  assert.equal(calls,1);calls=0
  await assert.rejects(verifyGatewayReadiness(async(path:string)=>{calls++;return path==='/health'?health:{responseStatusCode:200}},{wait:async()=>{},log:()=>{}}),/restriction/)
  assert.equal(calls,2)
})
test('persistent failures stop after a bounded number of attempts and 401 fails immediately',async()=>{
  let calls=0
  await assert.rejects(verifyGatewayReadiness(async()=>{calls++;return {status:'failed',responseStatusCode:500}},{wait:async()=>{},log:()=>{}}),/3 attempts/)
  assert.equal(calls,3)
  calls=0
  await assert.rejects(verifyGatewayReadiness(async()=>{calls++;throw Object.assign(new Error('Unauthorized'),{status:401})},{wait:async()=>{},log:()=>{}}),/Unauthorized/)
  assert.equal(calls,1)
})
