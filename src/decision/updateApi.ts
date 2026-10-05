import {createServer} from 'node:http'
import {updateSchema} from './exchange'
const host='127.0.0.1',port=Number(process.env.MERMAIDER_UPDATES_PORT||8002)
const token=process.env.MERMAIDER_UPDATES_TOKEN
if(!token||token.length<16)throw new Error('Set MERMAIDER_UPDATES_TOKEN to a random token of at least 16 characters.')
const origin=process.env.MERMAIDER_UPDATES_ORIGIN||'https://mermaider.appwrite.network'
const updates=new Map<string,{data:string;time:number}>()
const server=createServer(async(req,res)=>{
  const allowed=req.headers.origin===origin||!req.headers.origin
  const reply=(status:number,data:unknown)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...(req.headers.origin===origin?{'Access-Control-Allow-Origin':origin,Vary:'Origin'}:{})});res.end(JSON.stringify(data))}
  if(!allowed)return reply(403,{error:'Origin denied'})
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'content-type,authorization','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Private-Network':'true',Vary:'Origin'});return res.end()}
  if(req.headers.authorization!==`Bearer ${token}`)return reply(401,{error:'Local update token required'})
  for(const [key,value] of updates)if(Date.now()-value.time>15*60*1000)updates.delete(key)
  if(req.method==='POST'&&req.url==='/updates'){
    const chunks:Buffer[]=[];let size=0
    try{for await(const chunk of req){size+=chunk.length;chunks.push(chunk);if(size>20000)return reply(413,{error:'Update too large'})}
    const update=updateSchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8')));if(updates.size>=100&&!updates.has(update.sessionId))return reply(429,{error:'Update queue full'});updates.set(update.sessionId,{data:JSON.stringify(update),time:Date.now()});return reply(202,{id:update.id,sessionId:update.sessionId,expectedRevision:update.expectedRevision})}catch{return reply(400,{error:'Invalid versioned state update'})}
  }
  const match=req.method==='GET'&&req.url?.match(/^\/updates\/([A-Za-z0-9_-]{1,80})$/)
  if(match){const value=updates.get(match[1]);return reply(value?200:404,value?JSON.parse(value.data):{error:'No pending update'})}
  reply(404,{error:'Unknown local update route'})
})
server.listen(port,host,()=>{const address=server.address();console.error(`Mermaider update API on http://${host}:${typeof address==='object'&&address?address.port:port}; origin ${origin}`)})
