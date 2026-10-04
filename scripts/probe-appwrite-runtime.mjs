import {mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {execFileSync} from 'node:child_process'
import {randomUUID} from 'node:crypto'
const endpoint=process.env.APPWRITE_ENDPOINT,project=process.env.APPWRITE_PROJECT_ID,key=process.env.APPWRITE_API_KEY
if(!endpoint||!project||!key)throw new Error('Missing Appwrite configuration')
const functionId=`mermaider-probe-${randomUUID().slice(0,8)}`
const root=mkdtempSync(join(tmpdir(),'mermaider-runtime-probe-'))
let created=false
async function api(path,method='GET',body){
  const response=await fetch(endpoint+path,{method,headers:{'X-Appwrite-Project':project,'X-Appwrite-Key':key,...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(65000)})
  const data=await response.json()
  if(!response.ok)throw new Error(`Diagnostic API ${method} ${path}: HTTP ${response.status}; ${data.type||'unknown'}`)
  return data
}
const redacted=value=>String(value||'').replaceAll(key,'[redacted]').replace(/Bearer\s+\S+/gi,'Bearer [redacted]').replace(/[A-Za-z0-9+/_=-]{40,}/g,'[redacted]').slice(0,1200)
try{
  const runtimes=await api('/functions/runtimes')
  console.log('Available Node runtimes:',(runtimes.runtimes||[]).filter(runtime=>['node-22','node-20'].includes(runtime.$id)).map(runtime=>({id:runtime.$id,version:runtime.version})))
  mkdirSync(join(root,'src'))
  writeFileSync(join(root,'package.json'),JSON.stringify({type:'module',private:true}))
  // Isolated probe has no provider routes, credentials, inputs or application dependencies.
  writeFileSync(join(root,'src/main.js'),"export default ({res})=>res.json({name:'mermaider-runtime-probe',node:process.version})\n")
  const archive=join(root,'code.tar.gz');execFileSync('tar',['-czf',archive,'-C',root,'package.json','src'])
  const {readFileSync}=await import('node:fs')
  for(const runtime of ['node-22','node-20']){
    const settings={name:'Mermaider temporary runtime diagnostic',runtime,execute:['any'],events:[],schedule:'',timeout:60,enabled:true,logging:true,entrypoint:'src/main.js',commands:'',scopes:[]}
    if(!created){await api('/functions','POST',{functionId,...settings});created=true}else await api(`/functions/${functionId}`,'PUT',settings)
    const form=new FormData();form.set('code',new Blob([readFileSync(archive)]),'code.tar.gz');form.set('activate','true');form.set('entrypoint','src/main.js');form.set('commands','')
    const deployment=await api(`/functions/${functionId}/deployments`,'POST',form)
    let ready=false
    for(let attempt=0;attempt<36;attempt++){
      const state=await api(`/functions/${functionId}/deployments/${deployment.$id}`)
      if(state.status==='ready'){ready=true;break}
      if(['failed','canceled'].includes(state.status))break
      await new Promise(resolve=>setTimeout(resolve,5000))
    }
    if(!ready){console.log(`Runtime probe ${runtime}: deployment not ready`);continue}
    const response=await fetch(`${endpoint}/functions/${functionId}/executions`,{method:'POST',headers:{'X-Appwrite-Project':project,'Content-Type':'application/json'},body:JSON.stringify({async:false,path:'/health',method:'GET'}),signal:AbortSignal.timeout(65000)})
    const execution=await response.json()
    // Only this isolated, known health request can have its diagnostic errors shown.
    console.log(JSON.stringify({runtime,apiStatus:response.status,status:execution.status,http:execution.responseStatusCode,body:redacted(execution.responseBody),errors:redacted(execution.errors),logs:redacted(execution.logs)}))
  }
}finally{
  if(created)await api(`/functions/${functionId}`,'DELETE')
  rmSync(root,{recursive:true,force:true})
  console.log('Temporary runtime probe removed')
}
