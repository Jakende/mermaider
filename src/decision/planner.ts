import {generateDecisionPlan} from '../utils/aiService'
import type {FlowPlan,FlowSession} from './flow'
import {planningPrompt,simplificationPrompt,parsePlannedFlow} from './planning'
export async function planFlow(session:FlowSession,signal?:AbortSignal,focusId?:string,diagram?:string){
  if(!session.goal.trim())throw new Error('Describe the goal of the decision flow first.')
  return parsePlannedFlow(await generateDecisionPlan(planningPrompt(session,focusId,diagram),signal))
}
export async function simplifyFlow(plan:FlowPlan,signal?:AbortSignal){
  return parsePlannedFlow(await generateDecisionPlan(simplificationPrompt(plan),signal),plan)
}
