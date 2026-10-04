import { z } from 'zod'
import { flowId, restoreFlow } from './flow'
import type { FlowSession, FlowSelection } from './flow'
export const MAX_FLOW_FILE_BYTES=1024*1024

/** Only portable decision content is exported: no keys, settings, avatars or undo stacks. */
export function exportFlow(session:FlowSession):string {
  const checked=restoreFlow(session)
  if(!checked?.plan)throw new Error('Create a decision flow before exporting.')
  const {version,id,goal,context,plan,selections}=checked
  const fileVersion=Object.values(selections).some(answer=>answer.needsReview)?3:plan.questions.some(question=>question.evaluation&&question.evaluation.type!=='choice')?2:1
  return JSON.stringify({format:'mermaider-decision',version:fileVersion,session:{version,id,goal,context,plan,selections,
    revision:0,linked:true}},null,2)
}
export function importFlow(text:string):FlowSession {
  if(new TextEncoder().encode(text).byteLength>MAX_FLOW_FILE_BYTES)throw new Error('Decision files must be smaller than 1 MB.')
  let value:unknown
  try { value=JSON.parse(text) } catch { throw new Error('The decision file is not valid JSON.') }
  const envelope=z.object({format:z.literal('mermaider-decision'),version:z.union([z.literal(1),z.literal(2),z.literal(3)]),session:z.record(z.string(),z.unknown())}).safeParse(value)
  if(!envelope.success)throw new Error('Choose a Mermaider decision JSON file (version 1, 2 or 3).')
  const original=envelope.data.session
  const restored=restoreFlow(original)
  if(!restored?.plan)throw new Error('The file contains an invalid decision flow.')
  if(envelope.data.version===1&&restored.plan.questions.some(question=>question.evaluation&&question.evaluation.type!=='choice'))throw new Error('Numeric decision rules require file version 2.')
  if(envelope.data.version<3&&Object.values(restored.selections).some(answer=>answer.needsReview))throw new Error('Answers awaiting review require file version 3.')
  // Local recovery can prune corrupt answers; an imported file must pass without losing answers.
  const answers=original.selections as Record<string,FlowSelection>
  if(Object.keys(restored.selections).length!==Object.keys(answers).length || Object.entries(answers).some(([id,answer])=>{
    const checked=restored.selections[id]
    return !checked || checked.optionId!==answer.optionId || checked.source!==answer.source || checked.probability!==answer.probability || checked.needsReview!==answer.needsReview
  }))throw new Error('The file contains invalid or unreachable answers.')
  return {...restored,id:flowId('session'),revision:0,linked:true,suggestions:{},history:[],future:[],events:[]}
}
