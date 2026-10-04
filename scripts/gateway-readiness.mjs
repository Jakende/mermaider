const transient = status => [0,429,500,502,503,504].includes(status)
export function executionSummary(execution) {
  const details=String(execution.errors||'')
  const reason=/tim(e|ed) ?out/i.test(details)?'timeout':/connect/i.test(details)?'connection':/memory/i.test(details)?'memory':/runtime|container|start/i.test(details)?'startup':'unspecified'
  return {status:execution.status||'unknown',http:execution.responseStatusCode??0,reason}
}
/** Probe only idempotent health/blocked-target requests. Never retry a permissive target response. */
export async function verifyGatewayReadiness(execute,{attempts=3,wait=()=>new Promise(resolve=>setTimeout(resolve,5000)),log=console.log}={}) {
  let last=''
  for(let attempt=1;attempt<=attempts;attempt++){
    try {
      const health=await execute('/health','GET')
      const summary=executionSummary(health)
      log(`AI readiness ${attempt}/${attempts}: health=${JSON.stringify(summary)}`)
      if(health.responseStatusCode!==200){
        last=`Health ${JSON.stringify(summary)}`
        if(!transient(summary.http))throw new Error(last)
      }else{
        let name
        try { name=JSON.parse(health.responseBody).name }catch{/* Invalid successful payload is a hard failure. */}
        if(name!=='mermaider-ai-gateway')throw new Error('Health returned an unexpected successful payload')
        const rejection=await execute('/request','POST',{url:'http://127.0.0.1:11434/api/tags',method:'GET',authorization:'Bearer test-not-a-real-key'})
        const summary=executionSummary(rejection)
        log(`AI readiness ${attempt}/${attempts}: restriction=${JSON.stringify(summary)}`)
        if(rejection.responseStatusCode===403)return {health,rejection}
        last=`Endpoint restriction ${JSON.stringify(summary)}`
        if(!transient(summary.http))throw new Error(last)
      }
    }catch(failure){
      if(!transient(failure.status))throw failure
      last=`Execution API HTTP ${failure.status}`
      log(`AI readiness ${attempt}/${attempts}: ${last}`)
    }
    if(attempt<attempts)await wait()
  }
  throw new Error(`Hosted AI did not become healthy after ${attempts} attempts: ${last}`)
}
