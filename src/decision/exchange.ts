import { z } from 'zod'
import { changeFlow, flowId, restoreFlow } from './flow'
import type { FlowSession } from './flow'
import { exportFlow, MAX_FLOW_FILE_BYTES } from './sessionFile'

export const updateSchema=z.object({format:z.literal('mermaider-state-update'),version:z.literal(1),id:z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),sessionId:z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),expectedRevision:z.number().int().nonnegative(),state:z.string().min(1).max(12000),source:z.string().max(100).default('External update')}).strict()
export type StateUpdate=z.infer<typeof updateSchema>
export function parseStateUpdate(text:string):StateUpdate {
  if(new TextEncoder().encode(text).length>MAX_FLOW_FILE_BYTES)throw new Error('State updates must be smaller than 1 MB.')
  return updateSchema.parse(JSON.parse(text))
}
export function applyStateUpdate(session:FlowSession,update:StateUpdate):FlowSession {
  const checked=updateSchema.parse(update)
  if(checked.sessionId!==session.id||checked.expectedRevision!==session.revision)throw new Error('The update targets another session or an outdated revision. Request a fresh update.')
  return changeFlow(session,{context:checked.state},'External state update')
}
export function stateUpdate(session:FlowSession,state:string,source='MCP'):StateUpdate {
  return updateSchema.parse({format:'mermaider-state-update',version:1,id:flowId('update'),sessionId:session.id,expectedRevision:session.revision,state,source})
}
export function replayEvent(session:FlowSession,eventId:string):FlowSession {
  const event=session.events.find(item=>item.id===eventId)
  if(!event?.snapshot)throw new Error('This older event has no replay snapshot.')
  return changeFlow(session,event.snapshot,'Restored history snapshot')
}
export function exportReport(session:FlowSession):string {
  const checked=restoreFlow(session)
  if(!checked?.plan)throw new Error('Create a flow before exporting a report.')
  return JSON.stringify({format:'mermaider-decision-report',version:1,generatedAt:new Date().toISOString(),decision:JSON.parse(exportFlow(checked)),events:checked.events},null,2)
}
export function compareEvents(session:FlowSession,firstId:string,secondId:string):string {
  const snapshots=[firstId,secondId].map(id=>session.events.find(event=>event.id===id)?.snapshot)
  if(snapshots.some(snapshot=>!snapshot))throw new Error('Select two events with replay snapshots.')
  const [first,second]=snapshots
  const ids=new Set([...Object.keys(first!.selections),...Object.keys(second!.selections)])
  const changes=[...ids].filter(id=>JSON.stringify(first!.selections[id])!==JSON.stringify(second!.selections[id]))
  return JSON.stringify({goal:{before:first!.goal,after:second!.goal},state:{before:first!.context,after:second!.context},changedAnswers:changes.map(id=>({questionId:id,before:first!.selections[id]||null,after:second!.selections[id]||null})),structureChanged:JSON.stringify(first!.plan)!==JSON.stringify(second!.plan)},null,2)
}
