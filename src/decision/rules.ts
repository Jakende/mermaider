import {z} from 'zod'
import type {FlowQuestion} from './flow'
import type {DecisionAnswer,DecisionRun} from './types'
const optionId=z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,47}$/)
export const evaluationSchema=z.discriminatedUnion('type',[
  z.object({type:z.literal('choice')}),
  z.object({type:z.literal('score'),rubric:z.array(z.string().max(300)).min(2).max(12),low:z.number().nonnegative(),high:z.number().positive(),lowId:optionId,highId:optionId,uncertainId:optionId}),
  z.object({type:z.literal('noul'),low:z.number().min(0).max(1),high:z.number().min(0).max(1),lowId:optionId,highId:optionId,uncertainId:optionId})
])
export const evidenceSchema=z.object({type:z.enum(['choice','score','noul']),value:z.union([z.string().max(100),z.number().finite()]),provider:z.enum(['jev','laya']),model:z.string().max(300),timestamp:z.number().nonnegative(),elapsedMs:z.number().nonnegative(),explanation:z.string().max(2000),probabilities:z.record(z.string(),z.number().min(0).max(1)).optional(),confidence:z.number().min(0).max(1).optional(),answerConfidence:z.number().min(0).max(1).optional()})
export type FlowEvidence=z.infer<typeof evidenceSchema>
export function ruleDescription(question:FlowQuestion):string {
  const rule=question.evaluation
  if(!rule||rule.type==='choice')return 'Choice: select a defined answer.'
  const label=(id:string)=>question.options.find(option=>option.id===id)?.label||id
  return `${rule.type==='score'?'Score':'P(true)'} ≤ ${rule.low} → ${label(rule.lowId)}; ≥ ${rule.high} → ${label(rule.highId)}; between → ${label(rule.uncertainId)}.`
}
export function mapDecisionAnswer(question:FlowQuestion,answer:DecisionAnswer,run:Pick<DecisionRun,'provider'|'model'|'timestamp'|'elapsedMs'>) {
  const rule=question.evaluation
  const type=rule?.type||'choice'
  if(answer.type!==type)throw new Error('The model answer does not match the question type.')
  let optionId:string;let probability:number|undefined;let autoEligible=true
  if(!rule||rule.type==='choice'){
    optionId=String(answer.value);probability=answer.probabilities?.[optionId]
  }else{
    const value=Number(answer.value)
    if(!Number.isFinite(value)||value<0||value>(rule.type==='noul'?1:rule.rubric.length-1))throw new Error('The model returned an out-of-range value.')
    optionId=value<=rule.low?rule.lowId:value>=rule.high?rule.highId:rule.uncertainId
    autoEligible=rule.type==='noul'&&optionId!==rule.uncertainId
    probability=rule.type==='noul'&&autoEligible?(optionId===rule.highId?value:1-value):undefined
  }
  if(!question.options.some(option=>option.id===optionId))throw new Error('The rule refers to an undefined answer.')
  const explanation=type==='choice'?`Selected option: ${question.options.find(option=>option.id===optionId)!.label}.`:`${ruleDescription(question)} Observed ${type==='score'?'score':'P(true)'}: ${answer.value}.`
  const evidence:FlowEvidence={type,value:answer.value,provider:run.provider,model:run.model,timestamp:run.timestamp,elapsedMs:run.elapsedMs,explanation,probabilities:answer.probabilities,confidence:answer.confidence,answerConfidence:answer.answerConfidence}
  return {optionId,probability,autoEligible,evidence}
}
