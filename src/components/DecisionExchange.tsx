import {useRef,useState} from 'react'
import type {FlowSession} from '../decision/flow'
import {applyStateUpdate,compareEvents,exportReport,parseStateUpdate,replayEvent} from '../decision/exchange'
import type {StateUpdate} from '../decision/exchange'
interface Props {session:FlowSession;onChange:(session:FlowSession)=>void;pause:()=>void}
export default function DecisionExchange({session,onChange,pause}:Props){
  const input=useRef<HTMLInputElement>(null)
  const latest=useRef(session);latest.current=session
  const [pending,setPending]=useState<StateUpdate|null>(null),[error,setError]=useState('')
  const [first,setFirst]=useState(''),[second,setSecond]=useState(''),[comparison,setComparison]=useState('')
  const [endpoint,setEndpoint]=useState('http://127.0.0.1:8002'),[token,setToken]=useState('')
  const run=(action:()=>void)=>{try{setError('');action()}catch(e){setError(e instanceof Error?e.message:'Could not process the update.')}}
  const download=()=>run(()=>{const blob=new Blob([exportReport(session)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='decision-report.json';link.click();URL.revokeObjectURL(url)})
  const load=async(file:File)=>{const revision=session.revision;try{if(file.size>1024*1024)throw new Error('Updates must be smaller than 1 MB.');const update=parseStateUpdate(await file.text());if(latest.current.revision!==revision)throw new Error('Session changed while reading the update.');setPending(update);setError('')}catch(e){setError(e instanceof Error?e.message:'Could not read update.')}}
  const fetchUpdate=async()=>{try{const url=new URL(endpoint);if(!['http:','https:'].includes(url.protocol)||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.username||url.password||url.search||url.hash)throw new Error('Updates must use a local loopback endpoint.');const response=await fetch(`${url.origin}/updates/${encodeURIComponent(session.id)}`,{headers:token?{Authorization:`Bearer ${token}`}:{},credentials:'omit',signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error(`Update endpoint returned HTTP ${response.status}.`);setPending(parseStateUpdate(await response.text()));setError('')}catch(e){setError(e instanceof Error?e.message:'Could not reach the local update endpoint.')}}
  const events=session.events.filter(event=>event.snapshot)
  return <details className="flow-settings"><summary>Reports, replay & external updates</summary>
    {error&&<p role="alert">{error}</p>}
    <div className="flow-actions"><button disabled={!session.plan} onClick={download}>Export state report</button><button onClick={()=>input.current?.click()}>Review state update file</button></div>
    <p>Reports contain the current flow and retained full history snapshots, never provider settings or stored keys. Review private facts before sharing.</p>
    <input ref={input} hidden type="file" accept=".json" aria-label="External state update file" onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void load(file)}}/>
    <p>Session: <code>{session.id}</code> · Revision: {session.revision}</p>
    <label>Local update endpoint<input aria-label="Local update endpoint" value={endpoint} onChange={event=>setEndpoint(event.target.value)}/></label>
    <label>Local update token<input aria-label="Local update token" type="password" autoComplete="off" value={token} onChange={event=>setToken(event.target.value)}/></label>
    <button onClick={()=>void fetchUpdate()}>Fetch external update</button>
    {pending&&<section aria-label="External update preview"><strong>{pending.source}</strong><p>Revision {pending.expectedRevision} → current {session.revision}</p><pre>{pending.state}</pre><button disabled={pending.sessionId!==session.id||pending.expectedRevision!==session.revision} onClick={()=>run(()=>{pause();onChange(applyStateUpdate(session,pending));setPending(null)})}>Apply reviewed state update</button><button onClick={()=>setPending(null)}>Discard update</button></section>}
    {events.length>0&&<><label>Replay snapshot<select aria-label="Replay snapshot" value={first} onChange={event=>setFirst(event.target.value)}><option value="">Choose an event</option>{events.map(event=><option key={event.id} value={event.id}>{event.revision}: {event.note}</option>)}</select></label><button disabled={!first} onClick={()=>run(()=>{pause();onChange(replayEvent(session,first))})}>Restore snapshot</button>
    <label>Compare with<select aria-label="Compare snapshot" value={second} onChange={event=>setSecond(event.target.value)}><option value="">Choose another event</option>{events.map(event=><option key={event.id} value={event.id}>{event.revision}: {event.note}</option>)}</select></label><button disabled={!first||!second} onClick={()=>run(()=>setComparison(compareEvents(session,first,second)))}>Compare snapshots</button>{comparison&&<pre aria-label="Snapshot differences">{comparison}</pre>}</>}
    <p>Up to 50 events and 750 KB are retained locally. Older events from previous versions may lack replay snapshots.</p>
  </details>
}
