import type {FlowPlan} from './flow'
/** Structural review information; no model inference or session mutation. */
export function planChanges(current:FlowPlan|null,draft:FlowPlan){
  const previous=new Map(current?.questions.map(question=>[question.id,question])||[])
  const next=new Map(draft.questions.map(question=>[question.id,question]))
  return {
    added:draft.questions.filter(question=>!previous.has(question.id)),
    changed:draft.questions.filter(question=>previous.has(question.id)&&JSON.stringify(previous.get(question.id))!==JSON.stringify(question)),
    removed:(current?.questions||[]).filter(question=>!next.has(question.id)),
    startChanged:!!current&&current.startId!==draft.startId,
  }
}
