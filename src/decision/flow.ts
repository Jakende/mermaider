import { z } from 'zod'
import type { DecisionRequest } from './types'
import { decisionLabel } from './diagram'
import { evaluationSchema, evidenceSchema, ruleDescription } from './rules'
import type { FlowEvidence } from './rules'
const id = z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,47}$/).refine(value => !['constructor', 'prototype'].includes(value))
const optionSchema = z.object({ id, label: z.string().max(300), nextId: id.nullish().transform(value => value || undefined) })
export const flowSchema = z.object({ title: z.string().max(200), startId: id, questions: z.array(z.object({ id, text: z.string().max(1000), options: z.array(optionSchema).min(2).max(12), evaluation:evaluationSchema.optional() })).min(1).max(20) })
export type FlowPlan = z.infer<typeof flowSchema>
export type FlowQuestion = FlowPlan['questions'][number]
export interface FlowSelection { optionId: string; source: 'manual' | 'model'; probability?: number; evidence?:FlowEvidence; needsReview?:boolean }
export interface FlowSuggestion { optionId: string; probability?: number; revision: number; provider: string; model: string; autoEligible?:boolean; evidence?:FlowEvidence }
export interface FlowSnapshot { plan: FlowPlan | null; goal: string; context: string; selections: Record<string, FlowSelection>; note: string }
export interface FlowEvent {
  id:string; timestamp:number; revision:number; note:string; context:string
  question?:string; answer?:string; goal?:string; rule?:string; source?:'manual'|'model'; evidence?:FlowEvidence
}
export interface FlowSession {
  version: 1; id: string; revision: number; goal: string; context: string; plan: FlowPlan | null
  selections: Record<string, FlowSelection>; suggestions: Record<string, FlowSuggestion>; history: FlowSnapshot[]; future: FlowSnapshot[]; events:FlowEvent[]; linked: boolean
}
export const flowId = (prefix = 'q') => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0,16)}`
export const newFlowSession = (): FlowSession => ({ version:1, id:flowId('session'), revision:0, goal:'', context:'', plan:null, selections:{}, suggestions:{}, history:[], future:[], events:[], linked:false })
export function validateFlow(value: unknown): FlowPlan {
  const parsed = flowSchema.safeParse(value)
  if (!parsed.success) throw new Error('The flow has invalid questions or answer options. Retry generation or edit the questions manually.')
  const plan = parsed.data
  const ids = new Set(plan.questions.map(question => question.id))
  if (ids.size !== plan.questions.length || !ids.has(plan.startId)) throw new Error('Questions need unique IDs and an existing start question.')
  const nodeIds = plan.questions.flatMap(question => [question.id, ...question.options.map(option => `${question.id}__${option.id}`)])
  if (new Set(nodeIds).size !== nodeIds.length) throw new Error('Question and answer IDs must produce unique diagram nodes.')
  for (const question of plan.questions) {
    const rule=question.evaluation
    if(rule&&rule.type!=='choice'){
      if(rule.low>=rule.high||rule.type==='score'&&rule.high>rule.rubric.length-1)throw new Error('Rules need low < high within the model scale.')
      const targets=[rule.lowId,rule.highId,rule.uncertainId]
      if(new Set(targets).size!==3||targets.some(id=>!question.options.some(option=>option.id===id)))throw new Error('Numeric rules need three distinct, defined low/high/uncertain answers.')
    }
    if (new Set(question.options.map(option => option.id)).size !== question.options.length) throw new Error('Answer IDs must be unique within a question.')
    if (question.options.some(option => option.nextId && !ids.has(option.nextId))) throw new Error('A follow-up refers to a missing question.')
  }
  const visiting = new Set<string>(); const visited = new Set<string>()
  const visit = (questionId: string) => {
    if (visiting.has(questionId)) throw new Error('Follow-ups must not create a loop. Use a new question for a repeated step.')
    if (visited.has(questionId)) return
    visiting.add(questionId)
    for (const option of plan.questions.find(question => question.id === questionId)!.options) if (option.nextId) visit(option.nextId)
    visiting.delete(questionId); visited.add(questionId)
  }
  for (const question of plan.questions) visit(question.id)
  return plan
}
export function flowPath(session: Pick<FlowSession,'plan'|'selections'>) {
  const questions: string[] = []; const options: string[] = []; const edges: [string,string][] = []
  let current = session.plan?.startId
  while (current && !questions.includes(current)) {
    const question: FlowQuestion | undefined = session.plan?.questions.find(item => item.id === current)
    if (!question) break
    questions.push(current)
    const option = question.options.find(item => item.id === session.selections[current!]?.optionId)
    if (!option) break
    const optionNode = `${question.id}__${option.id}`
    options.push(optionNode); edges.push([question.id, optionNode])
    if (option.nextId) edges.push([optionNode, option.nextId])
    current = option.nextId
  }
  const pending = questions.find(questionId => !session.selections[questionId])
  const review=questions.filter(id=>session.selections[id]?.needsReview)
  return { questions, options, edges, pending, review }
}
export function changeFlow(session: FlowSession, patch: Partial<Pick<FlowSession,'plan'|'context'|'goal'|'selections'|'linked'>>, note: string, detail:Partial<Pick<FlowEvent,'question'|'answer'|'source'|'evidence'|'rule'>>={}): FlowSession {
  const plan = patch.plan === undefined ? session.plan : patch.plan ? validateFlow(patch.plan) : null
  const context = patch.context ?? session.context
  const factsChanged=context!==session.context || patch.goal!==undefined&&patch.goal!==session.goal
  const selections = { ...(patch.selections ?? session.selections) }
  for (const [questionId, selection] of Object.entries(selections)) {
    const before = session.plan?.questions.find(question => question.id === questionId)
    const after = plan?.questions.find(question => question.id === questionId)
    if (!after?.options.some(option => option.id === selection.optionId) || (patch.plan !== undefined && JSON.stringify(before && {text:before.text,evaluation:before.evaluation,options:before.options.map(({id,label})=>({id,label}))}) !== JSON.stringify(after && {text:after.text,evaluation:after.evaluation,options:after.options.map(({id,label})=>({id,label}))})) || ((context !== session.context || patch.goal !== undefined && patch.goal !== session.goal) && selection.source === 'model')) delete selections[questionId]
  }
  // A converging branch can still reach the same question with different facts.
  // Model decisions depend on the preceding answers, not just reachability.
  const priorPath = (currentPlan: FlowPlan | null, currentSelections: Record<string, FlowSelection>, target: string) => {
    const path = flowPath({plan:currentPlan,selections:currentSelections}).questions
    return path.slice(0,path.indexOf(target)).map(id=>[id,currentSelections[id]?.optionId])
  }
  for (const [questionId, selection] of Object.entries(selections)) {
    const pathChanged=JSON.stringify(priorPath(session.plan,session.selections,questionId))!==JSON.stringify(priorPath(plan,selections,questionId))
    if(selection.source==='model'&&pathChanged)delete selections[questionId]
    else if(selection.source==='manual'&&(factsChanged||pathChanged))selections[questionId]={...selection,needsReview:true}
  }
  const visible = flowPath({ plan, selections }).questions
  for (const questionId of Object.keys(selections)) if (!visible.includes(questionId)) delete selections[questionId]
  const changed={ ...session, ...patch, plan, context, selections, suggestions:{}, revision:session.revision + 1,
    events:session.events,
    future:[], history:!session.future.length && ['Updated state','Updated goal'].includes(note) && session.history[session.history.length-1]?.note===note ? session.history : [...session.history, { plan:session.plan, goal:session.goal, context:session.context, selections:session.selections, note }].slice(-10) }
  return recordFlowEvent(changed,note,detail)
}
export function chooseFlow(session: FlowSession, questionId: string, optionId: string, source: FlowSelection['source'] = 'manual', probability?: number, evidence?:FlowEvidence) {
  if (!flowPath(session).questions.includes(questionId) || !session.plan?.questions.find(question => question.id === questionId)?.options.some(option => option.id === optionId)) throw new Error('Only a reachable, defined answer can select the path.')
  const preceding=flowPath(session).questions.slice(0,flowPath(session).questions.indexOf(questionId))
  if(preceding.some(id=>session.selections[id]?.needsReview))throw new Error('Review preceding answers before continuing.')
  const next=changeFlow(session, { selections:{ ...session.selections, [questionId]:{ optionId, source, probability, evidence } } }, 'Selected answer')
  const event=next.events[next.events.length-1]
  const question=session.plan!.questions.find(item=>item.id===questionId)!
  return {...next,events:[...next.events.slice(0,-1),{...event,question:question.text,answer:question.options.find(option=>option.id===optionId)!.label,source,evidence,rule:ruleDescription(question)}]}
}
function snapshotFlow(session:FlowSession, note:string):FlowSnapshot {
  return {plan:session.plan,goal:session.goal,context:session.context,selections:session.selections,note}
}
export function undoFlow(session: FlowSession): FlowSession {
  const previous = session.history[session.history.length - 1]
  if (!previous) return session
  return recordFlowEvent({ ...session, ...previous, revision:session.revision + 1, suggestions:{}, history:session.history.slice(0,-1),
    future:[...session.future,snapshotFlow(session,previous.note)].slice(-10) },`Undo: ${previous.note}`)
}
export function redoFlow(session: FlowSession): FlowSession {
  const next = session.future[session.future.length - 1]
  if (!next) return session
  return recordFlowEvent({ ...session, ...next, revision:session.revision + 1, suggestions:{}, future:session.future.slice(0,-1),
    history:[...session.history,snapshotFlow(session,next.note)].slice(-10) },`Redo: ${next.note}`)
}
export function recordFlowEvent(session:FlowSession,note:string,detail:Partial<Pick<FlowEvent,'question'|'answer'|'source'|'evidence'|'rule'>>={}):FlowSession {
  const event:FlowEvent={id:flowId('event'),timestamp:Date.now(),revision:session.revision,note:note.slice(0,100),context:session.context.slice(0,1000),goal:session.goal.slice(0,1000),...detail}
  const coalesce=['Updated state','Updated goal'].includes(note)&&session.events[session.events.length-1]?.note===note
  return {...session,events:[...(coalesce?session.events.slice(0,-1):session.events),event].slice(-50)}
}
const eventSchema=z.object({id,timestamp:z.number().nonnegative(),revision:z.number().int().nonnegative(),note:z.string().max(100),context:z.string().max(1000),goal:z.string().max(1000).optional(),rule:z.string().max(2000).optional(),question:z.string().max(1000).optional(),answer:z.string().max(300).optional(),source:z.enum(['manual','model']).optional(),evidence:evidenceSchema.optional()})
export function restoreFlow(value: unknown): FlowSession | undefined {
  try {
    const parsed = z.object({ version:z.literal(1), id, revision:z.number().int().nonnegative(), goal:z.string().max(12000), context:z.string().max(12000), plan:flowSchema.nullable(), selections:z.record(z.string(),z.object({ optionId:id, source:z.enum(['manual','model']), probability:z.number().min(0).max(1).optional(), evidence:evidenceSchema.optional(), needsReview:z.boolean().optional() })), linked:z.boolean() }).parse(value)
    const plan = parsed.plan ? validateFlow(parsed.plan) : null
    const selections = Object.fromEntries(Object.entries(parsed.selections).filter(([questionId, selection]) => plan?.questions.find(question=>question.id===questionId)?.options.some(option=>option.id===selection.optionId)))
    const reachable = flowPath({plan,selections}).questions
    for (const questionId of Object.keys(selections)) if (!reachable.includes(questionId)) delete selections[questionId]
    const restoreSnapshots=(items:unknown):FlowSnapshot[] => Array.isArray(items) ? items.slice(-10).flatMap(snapshot => {
      if(!snapshot || typeof snapshot!=='object')return []
      const checked = restoreFlow({ ...parsed, ...snapshot, history:[], future:[], events:[] })
      return checked ? [{plan:checked.plan, goal:checked.goal, context:checked.context, selections:checked.selections,note:typeof snapshot.note==='string'?snapshot.note.slice(0,100):'Changed flow'}] : []
    }) : []
    const stored=value as FlowSession
    return { ...parsed, plan, selections, history:restoreSnapshots(stored.history), future:restoreSnapshots(stored.future), events:Array.isArray(stored.events)?stored.events.slice(-50).flatMap(event=>{const parsed=eventSchema.safeParse(event);return parsed.success?[parsed.data]:[]}):[], suggestions:{} }
  } catch { return undefined }
}
export function flowRequest(session: FlowSession, questionId: string): DecisionRequest {
  const question = session.plan?.questions.find(item => item.id === questionId)
  if (!question || !question.text.trim() || question.options.some(option => !option.label.trim())) throw new Error('Finish the question and answer texts before evaluating.')
  const rule=question.evaluation
  if(rule?.type==='score'&&rule.rubric.some(level=>!level.trim()))throw new Error('Finish the rubric texts before evaluating.')
  const definition = !rule||rule.type==='choice'?{type:'choice' as const,instructions:question.text,criteria:Object.fromEntries(question.options.map(option=>[option.id,option.label]))}:rule.type==='score'?{type:'score' as const,instructions:question.text,criteria:rule.rubric}:{type:'noul' as const,instructions:question.text}
  const path=flowPath(session).questions
  if(!path.includes(questionId))throw new Error('Only a reachable question can be evaluated.')
  if(path.slice(0,path.indexOf(questionId)).some(id=>session.selections[id]?.needsReview))throw new Error('Review preceding answers before evaluating this question.')
  // Re-evaluation must not feed the target's previous answer (or later answers)
  // back to the model as supporting facts.
  return { state:{ goal:session.goal, update:session.context, path:path.slice(0,path.indexOf(questionId)).flatMap(id => {
    const selected = session.selections[id]; const item = session.plan?.questions.find(question=>question.id===id)
    return selected ? [{question:item?.text,answer:item?.options.find(option=>option.id===selected.optionId)?.label,source:selected.source}] : []
  }) }, questions:{ [questionId]:definition } }
}
export function flowDiagram(plan: FlowPlan): string {
  const lines = ['flowchart TD']
  for (const question of plan.questions) {
    lines.push(`  ${question.id}{"${decisionLabel(question.text || 'New question')}"}`)
    for (const option of question.options) {
      const node = `${question.id}__${option.id}`
      lines.push(`  ${question.id} --> ${node}["${decisionLabel(option.label || 'New answer')}"]`)
      if (option.nextId) lines.push(`  ${node} --> ${option.nextId}`)
    }
  }
  return lines.join('\n')
}
