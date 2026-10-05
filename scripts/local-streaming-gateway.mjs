import {createServer} from 'node:http'
import {streamingGatewayRequest} from '../functions/ai-gateway/src/main.js'
const origin=process.env.MERMAIDER_GATEWAY_ORIGIN||'https://mermaider.appwrite.network'
const port=Number(process.env.MERMAIDER_GATEWAY_PORT||8003)
let active=0
createServer(async(req,res)=>{
 if(req.headers.origin&&req.headers.origin!==origin){res.writeHead(403);return res.end('Origin denied')}
 const cors={'Access-Control-Allow-Origin':origin,Vary:'Origin','Cache-Control':'no-store'}
 if(req.method==='OPTIONS'){res.writeHead(204,{...cors,'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Private-Network':'true'});return res.end()}
 if(req.url!=='/request'||req.method!=='POST'){res.writeHead(404,cors);return res.end()}
 if(active>=4){res.writeHead(429,cors);return res.end('Too many active requests')}
 active++;const abort=new AbortController();res.on('close',()=>abort.abort())
 try{
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;chunks.push(chunk);if(size>512*1024+8192){res.writeHead(413,cors);res.end('Request too large');return}}
  let payload;try{payload=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{res.writeHead(400,cors);res.end('Invalid JSON');return}
  const response=await streamingGatewayRequest(payload,fetch,abort.signal)
  res.writeHead(response.status,{...cors,'Content-Type':response.headers.get('Content-Type')||'application/json'})
  if(response.body){const reader=response.body.getReader();try{while(!abort.signal.aborted){const chunk=await reader.read();if(chunk.done)break;if(!res.write(Buffer.from(chunk.value)))await new Promise(resolve=>{const done=()=>{res.off('drain',done);res.off('close',done);resolve()};res.once('drain',done);res.once('close',done)})}}finally{await reader.cancel().catch(()=>{});reader.releaseLock()}}
  res.end()
 }catch{if(!res.headersSent)res.writeHead(502,cors);res.end()}finally{active--}
}).listen(port,'127.0.0.1',()=>console.error(`Local streaming relay on http://127.0.0.1:${port}; allowed browser origin ${origin}`))
