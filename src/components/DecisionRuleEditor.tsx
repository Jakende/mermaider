import {flowId} from '../decision/flow'
import type {FlowQuestion} from '../decision/flow'
import {ruleDescription} from '../decision/rules'
interface Props {question:FlowQuestion;onChange:(question:FlowQuestion)=>void}
export default function DecisionRuleEditor({question,onChange}:Props){
  const rule=question.evaluation
  const type=rule?.type||'choice'
  const switchType=(type:string)=>{
    if(type==='choice'){onChange({...question,evaluation:{type:'choice'}});return}
    const options=question.options.length>=3?question.options:[...question.options,{id:flowId('a'),label:'Unclear',nextId:undefined}]
    const shared={lowId:options[1].id,highId:options[0].id,uncertainId:options[2].id}
    onChange({...question,options,evaluation:type==='score'?{type:'score',rubric:['Low','Medium','High'],low:0.5,high:1.5,...shared}:{type:'noul',low:0.2,high:0.8,...shared}})
  }
  return <div className="flow-rule-editor">
    <label>Evaluation type<select aria-label="Evaluation type" value={type} onChange={event=>switchType(event.target.value)}><option value="choice">Choice · answer options</option><option value="score">Score · ordered rubric</option><option value="noul">Noul · probability of a statement</option></select></label>
    {rule&&rule.type!=='choice'&&<>
      <details><summary>Rule settings</summary>
      {rule.type==='score'&&<div><p className="flow-hint">Ordered rubric · first level = 0</p>{rule.rubric.map((level,index)=><div className="flow-option" key={index}><span>{index}</span><input aria-label={`Rubric level ${index}`} value={level} maxLength={300} onChange={event=>onChange({...question,evaluation:{...rule,rubric:rule.rubric.map((item,i)=>i===index?event.target.value:item)}})}/></div>)}<button disabled={rule.rubric.length>=12} onClick={()=>onChange({...question,evaluation:{...rule,rubric:[...rule.rubric,'New level']}})}>+ Rubric level</button><button disabled={rule.rubric.length<=2} onClick={()=>{const high=Math.min(rule.high,rule.rubric.length-2);onChange({...question,evaluation:{...rule,rubric:rule.rubric.slice(0,-1),high,low:Math.min(rule.low,high-0.05)}})}}>− Rubric level</button></div>}
      {rule.type==='noul'&&<p className="flow-hint">Phrase the question as a statement. The model returns P(true) between 0 and 1.</p>}
      <div className="flow-rule-bounds">{(['low','high'] as const).map(bound=><label key={bound}>{bound==='low'?'Low ≤':'High ≥'}<input type="number" aria-label={`${bound==='low'?'Low':'High'} threshold`} min={0} max={rule.type==='noul'?1:rule.rubric.length-1} step={0.05} value={rule[bound]} onChange={event=>{if(Number.isFinite(event.target.valueAsNumber))onChange({...question,evaluation:{...rule,[bound]:event.target.valueAsNumber}})}}/></label>)}</div>
      {(['lowId','highId','uncertainId'] as const).map((target,index)=><label key={target}>{['Low answer','High answer','Unclear answer'][index]}<select aria-label={['Low answer','High answer','Unclear answer'][index]} value={rule[target]} onChange={event=>{const updated={...rule,[target]:event.target.value};for(const other of ['lowId','highId','uncertainId'] as const)if(other!==target&&rule[other]===event.target.value)updated[other]=rule[target];onChange({...question,evaluation:updated})}}>{question.options.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select></label>)}
      </details>
      <p className="flow-hint">{ruleDescription(question)} {rule.type==='score'?'Score results always require review.':'Unclear results always require review.'}</p>
    </>}
  </div>
}
