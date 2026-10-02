import { z } from 'zod'
import type { DecisionRequest } from './types'
import { decisionLabel } from './diagram'
const id = z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,47}$/).refine(value => !['constructor', 'prototype'].includes(value))
const optionSchema = z.object({ id, label: z.string().max(300), nextId: id.nullish().transform(value => value || undefined) })
export const flowSchema = z.object({ title: z.string().max(200), startId: id, questions: z.array(z.object({ id, text: z.string().max(1000), options: z.array(optionSchema).min(2).max(12) })).min(1).max(20) })
export type FlowPlan = z.infer<typeof flowSchema>
export type FlowQuestion = FlowPlan['questions'][number]
export interface FlowSelection { optionId: string; source: 'manual' | 'model'; probability?: number }
export interface FlowSuggestion { optionId: string; probability: number; revision: number; provider: string; model: string }
export interface FlowSnapshot { plan: FlowPlan | null; goal: string; context: string; selections: Record<string, FlowSelection>; note: string }
export interface FlowSession {
  version: 1; id: string; revision: number; goal: string; context: string; plan: FlowPlan | null
  selections: Record<string, FlowSelection>; suggestions: Record<string, FlowSuggestion>; history: FlowSnapshot[]; linked: boolean
}
export const flowId = (prefix = 'q') => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0,16)}`
export const newFlowSession = (): FlowSession => ({ version:1, id:flowId('session'), revision:0, goal:'', context:'', plan:null, selections:{}, suggestions:{}, history:[], linked:false })
export function validateFlow(value: unknown): FlowPlan {
  const parsed = flowSchema.safeParse(value)
  if (!parsed.success) throw new Error('The flow has invalid questions or answer options. Retry generation or edit the questions manually.')
  const plan = parsed.data
  const ids = new Set(plan.questions.map(question => question.id))
  if (ids.size !== plan.questions.length || !ids.has(plan.startId)) throw new Error('Questions need unique IDs and an existing start question.')
  const nodeIds = plan.questions.flatMap(question => [question.id, ...question.options.map(option => `${question.id}__${option.id}`)])
  if (new Set(nodeIds).size !== nodeIds.length) throw new Error('Question and answer IDs must produce unique diagram nodes.')
  for (const question of plan.questions) {
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
  return { questions, options, edges, pending }
}
export function changeFlow(session: FlowSession, patch: Partial<Pick<FlowSession,'plan'|'context'|'goal'|'selections'|'linked'>>, note: string): FlowSession {
  const plan = patch.plan === undefined ? session.plan : patch.plan ? validateFlow(patch.plan) : null
  const context = patch.context ?? session.context
  const selections = { ...(patch.selections ?? session.selections) }
  for (const [questionId, selection] of Object.entries(selections)) {
    const before = session.plan?.questions.find(question => question.id === questionId)
    const after = plan?.questions.find(question => question.id === questionId)
    if (!after?.options.some(option => option.id === selection.optionId) || (patch.plan !== undefined && JSON.stringify(before && {text:before.text,options:before.options.map(({id,label})=>({id,label}))}) !== JSON.stringify(after && {text:after.text,options:after.options.map(({id,label})=>({id,label}))})) || ((context !== session.context || patch.goal !== undefined && patch.goal !== session.goal) && selection.source === 'model')) delete selections[questionId]
  }
  const visible = flowPath({ plan, selections }).questions
  for (const questionId of Object.keys(selections)) if (!visible.includes(questionId)) delete selections[questionId]
  return { ...session, ...patch, plan, context, selections, suggestions:{}, revision:session.revision + 1,
    history:['Updated state','Updated goal'].includes(note) && session.history[session.history.length-1]?.note===note ? session.history : [...session.history, { plan:session.plan, goal:session.goal, context:session.context, selections:session.selections, note }].slice(-10) }
}
export function chooseFlow(session: FlowSession, questionId: string, optionId: string, source: FlowSelection['source'] = 'manual', probability?: number) {
  if (!flowPath(session).questions.includes(questionId) || !session.plan?.questions.find(question => question.id === questionId)?.options.some(option => option.id === optionId)) throw new Error('Only a reachable, defined answer can select the path.')
  return changeFlow(session, { selections:{ ...session.selections, [questionId]:{ optionId, source, probability } } }, 'Selected answer')
}
export function undoFlow(session: FlowSession): FlowSession {
  const previous = session.history[session.history.length - 1]
  if (!previous) return session
  return { ...session, ...previous, revision:session.revision + 1, suggestions:{}, history:session.history.slice(0,-1) }
}
export function restoreFlow(value: unknown): FlowSession | undefined {
  try {
    const parsed = z.object({ version:z.literal(1), id, revision:z.number().int().nonnegative(), goal:z.string().max(12000), context:z.string().max(12000), plan:flowSchema.nullable(), selections:z.record(z.string(),z.object({ optionId:id, source:z.enum(['manual','model']), probability:z.number().min(0).max(1).optional() })), linked:z.boolean() }).parse(value)
    const plan = parsed.plan ? validateFlow(parsed.plan) : null
    const selections = Object.fromEntries(Object.entries(parsed.selections).filter(([questionId, selection]) => plan?.questions.find(question=>question.id===questionId)?.options.some(option=>option.id===selection.optionId)))
    const reachable = flowPath({plan,selections}).questions
    for (const questionId of Object.keys(selections)) if (!reachable.includes(questionId)) delete selections[questionId]
    const historyValue = (value as FlowSession).history
    const history: FlowSnapshot[] = Array.isArray(historyValue) ? historyValue.slice(-10).flatMap(snapshot => {
      const checked = restoreFlow({ ...parsed, ...snapshot, history:[] })
      return checked ? [{plan:checked.plan, goal:checked.goal, context:checked.context, selections:checked.selections,note:typeof snapshot.note==='string'?snapshot.note.slice(0,100):'Changed flow'}] : []
    }) : []
    return { ...parsed, plan, selections, history, suggestions:{} }
  } catch { return undefined }
}
export function flowRequest(session: FlowSession, questionId: string): DecisionRequest {
  const question = session.plan?.questions.find(item => item.id === questionId)
  if (!question || !question.text.trim() || question.options.some(option => !option.label.trim())) throw new Error('Finish the question and answer texts before evaluating.')
  return { state:{ goal:session.goal, update:session.context, path:flowPath(session).questions.flatMap(id => {
    const selected = session.selections[id]; const item = session.plan?.questions.find(question=>question.id===id)
    return selected ? [{question:item?.text,answer:item?.options.find(option=>option.id===selected.optionId)?.label,source:selected.source}] : []
  }) }, questions:{ [questionId]:{ type:'choice', instructions:question.text, criteria:Object.fromEntries(question.options.map(option=>[option.id,option.label])) } } }
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
