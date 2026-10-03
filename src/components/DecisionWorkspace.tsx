import { useEffect, useRef, useState } from 'react'
import { changeFlow, chooseFlow, flowId, flowPath, flowRequest, undoFlow, redoFlow, recordFlowEvent } from '../decision/flow'
import type { FlowPlan, FlowQuestion, FlowSession } from '../decision/flow'
import { decisionDefaults, evaluateDecision, loadDecisionKey, saveDecisionKey } from '../decision/service'
import type { DecisionConfig, DecisionProvider } from '../decision/types'
import { planFlow } from '../decision/planner'
import UserBlob from './UserBlob'
import DecisionRuleEditor from './DecisionRuleEditor'
import {mapDecisionAnswer,ruleDescription} from '../decision/rules'
import DecisionResizeHandle from './DecisionResizeHandle'
import { exportFlow, importFlow, MAX_FLOW_FILE_BYTES } from '../decision/sessionFile'
import './DecisionWorkspace.css'
interface Props {
  width:number; minWidth:number; maxWidth:number; onResize:(width:number)=>void
  session:FlowSession; focusedId:string|null; nodeProposal?:FlowQuestion; diagram:string; onChange:(session:FlowSession)=>void
  onApplyPlan:(session:FlowSession)=>void; onImportSession:(session:FlowSession)=>void; onFocus:(id:string)=>void; onClose:()=>void
}
type Mode='manual'|'suggest'|'follow'
const defaultConfig=()=>{
  try { const stored=JSON.parse(localStorage.getItem('mermaider-decision-config')||'null'); if(stored&&['jev','laya'].includes(stored.provider))return {...decisionDefaults(stored.provider),endpoint:typeof stored.endpoint==='string'?stored.endpoint:decisionDefaults(stored.provider).endpoint,model:typeof stored.model==='string'?stored.model:decisionDefaults(stored.provider).model} as DecisionConfig }catch{/* Default if unavailable. */}
  return decisionDefaults('jev')
}
export default function DecisionWorkspace({width,minWidth,maxWidth,onResize,session,focusedId,nodeProposal,diagram,onChange,onApplyPlan,onImportSession,onFocus,onClose}:Props){
  const [view,setView]=useState<'decide'|'edit'>(()=>{try{return localStorage.getItem('mermaider-decision-view')==='edit'?'edit':'decide'}catch{return 'decide'}})
  const scrollRef=useRef<HTMLDivElement>(null)
  const navigationRef=useRef(false)
  const addedQuestionRef=useRef<string|null>(null)
  const changeView=(next:'decide'|'edit')=>{setView(next);try{localStorage.setItem('mermaider-decision-view',next)}catch{/* View remains available for this session. */}}
  const editing=view==='edit'
  const [config,setConfig]=useState<DecisionConfig>(defaultConfig)
  const [apiKey,setApiKey]=useState('')
  const [mode,setMode]=useState<Mode>('manual')
  const [autoAdapt,setAutoAdapt]=useState(false)
  const [busy,setBusy]=useState<'plan'|'evaluate'|null>(null)
  const [error,setError]=useState('')
  const [draft,setDraft]=useState<FlowPlan|null>(null)
  const context=session.context
  const latest=useRef(session);latest.current=session
  const settings=useRef('');settings.current=JSON.stringify([config,apiKey,mode])
  const operation=useRef(0);const abort=useRef<AbortController|null>(null)
  const lastAuto=useRef('');const lastAdapt=useRef('')
  const keyEdited=useRef(false)
  const fileInput=useRef<HTMLInputElement>(null)
  const cancel=()=>{operation.current++;abort.current?.abort();setBusy(null)}
  useEffect(()=>{
    let current=true;keyEdited.current=false;setApiKey('')
    void loadDecisionKey(config.provider).then(key=>{if(current&&!keyEdited.current)setApiKey(key)}).catch(()=>{if(current)setError('Provider key could not be loaded.')})
    return()=>{current=false}
  },[config.provider])
  useEffect(()=>{
    cancel();setDraft(null);setError('')
    if(Object.keys(latest.current.suggestions).length)onChange({...latest.current,suggestions:{}})
    return()=>{operation.current++;abort.current?.abort()}
  },[session.revision,config.provider,config.endpoint,config.model,apiKey,mode])
  useEffect(()=>{
    const changed=()=>{cancel();setDraft(null)}
    window.addEventListener('ai-config-changed',changed)
    return()=>window.removeEventListener('ai-config-changed',changed)
  },[])
  const path=flowPath(session)
  const focused=session.plan?.questions.find(question=>question.id===focusedId)
  const navigate=(id:string,focus=false)=>{
    const container=scrollRef.current,card=document.getElementById(`question-card-${id}`)
    if(!container||!card)return
    const bar=container.querySelector<HTMLElement>('.flow-navigator')
    container.scrollTo({top:Math.max(0,container.scrollTop+card.getBoundingClientRect().top-container.getBoundingClientRect().top-(bar?.offsetHeight||0)-12),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})
    if(focus)card.focus({preventScroll:true})
  }
  useEffect(()=>{
    if(focusedId)navigate(focusedId)
  },[focusedId])
  useEffect(()=>{
    if(!navigationRef.current)return
    navigationRef.current=false
    const target=addedQuestionRef.current||path.pending
    addedQuestionRef.current=null
    if(target)navigate(target,true)
  },[session.revision,path.pending])
  const persistConfig=async()=>{
    await saveDecisionKey(config.provider,apiKey)
    try{localStorage.setItem('mermaider-decision-config',JSON.stringify({provider:config.provider,endpoint:config.endpoint,model:config.model}))}catch{/* Request can still use the entered settings. */}
  }
  const evaluate=async(questionId?:string)=>{
    const snapshot=latest.current;const target=questionId||flowPath(snapshot).pending
    if(!target)return
    cancel();const token=operation.current;const expected=settings.current
    const controller=new AbortController();abort.current=controller;setBusy('evaluate');setError('')
    if(snapshot.suggestions[target]){
      const suggestions={...snapshot.suggestions};delete suggestions[target]
      onChange({...snapshot,suggestions})
    }
    try{
      const request=flowRequest(snapshot,target)
      await persistConfig()
      if(controller.signal.aborted)return
      const run=await evaluateDecision({...config,apiKey},request,controller.signal)
      if(token!==operation.current||latest.current.revision!==snapshot.revision||settings.current!==expected)return
      const question=snapshot.plan!.questions.find(question=>question.id===target)!
      const mapped=mapDecisionAnswer(question,run.answers[target],run)
      const recorded=recordFlowEvent(snapshot,'Model evaluated',{question:question.text,answer:question.options.find(option=>option.id===mapped.optionId)!.label,source:'model',evidence:mapped.evidence})
      if(mode==='follow'&&mapped.autoEligible&&(mapped.probability??0)>=0.8){navigationRef.current=true;onChange(chooseFlow(recorded,target,mapped.optionId,'model',mapped.probability,mapped.evidence))}
      else onChange({...recorded,suggestions:{...recorded.suggestions,[target]:{...mapped,revision:snapshot.revision,provider:run.provider,model:run.model}}})
    }catch(failure){if(token===operation.current&&!controller.signal.aborted)setError(failure instanceof Error?failure.message:'Evaluation failed.')}
    finally{if(token===operation.current)setBusy(null)}
  }
  const generate=async(focusId?:string)=>{
    const snapshot=latest.current
    cancel();const token=operation.current
    const controller=new AbortController();abort.current=controller;setBusy('plan');setError('');setDraft(null)
    try{
      const result=await planFlow(snapshot,controller.signal,focusId,diagram)
      if(token===operation.current&&snapshot.revision===latest.current.revision)setDraft(result)
    }catch(failure){if(token===operation.current&&!controller.signal.aborted)setError(failure instanceof Error?failure.message:'Planning failed.')}
    finally{if(token===operation.current)setBusy(null)}
  }
  useEffect(()=>{
    if(mode==='manual'||busy||!path.pending||context!==session.context||config.provider==='jev'&&!apiKey.trim())return
    const signature=JSON.stringify([session.id,session.revision,path.pending,settings.current])
    if(lastAuto.current===signature)return
    const timer=setTimeout(()=>{lastAuto.current=signature;void evaluate(path.pending)},1000)
    return()=>clearTimeout(timer)
  },[session.revision,session.context,context,path.pending,mode,config,apiKey,busy])
  useEffect(()=>{
    if(!autoAdapt||!session.goal.trim()||busy||context!==session.context)return
    const signature=JSON.stringify([session.goal,session.context])
    if(lastAdapt.current===signature)return
    const timer=setTimeout(()=>{lastAdapt.current=signature;void generate()},1400)
    return()=>clearTimeout(timer)
  },[session.goal,session.context,context,autoAdapt,busy])
  const editPlan=(plan:FlowPlan,note:string,question?:FlowQuestion)=>{
    try{onChange(changeFlow(latest.current,{plan},note,question?{question:question.text,rule:ruleDescription(question)}:{}));setError('')}catch(failure){setError(failure instanceof Error?failure.message:'Invalid follow-up')}
  }
  const editQuestion=(question:FlowQuestion)=>{
    if(session.plan)editPlan({...session.plan,questions:session.plan.questions.map(item=>item.id===question.id?question:item)},'Edited question',question)
  }
  const addQuestion=(fromId?:string,optionId?:string)=>{
    const id=flowId();const question:FlowQuestion={id,text:'New question',options:[{id:flowId('a'),label:'Yes',nextId:undefined},{id:flowId('a'),label:'No',nextId:undefined}]}
    const plan=session.plan?{...session.plan,questions:[...session.plan.questions,question]}:{title:(session.goal.trim()||'Decision flow').slice(0,200),startId:id,questions:[question]}
    if(fromId&&optionId)plan.questions=plan.questions.map(item=>item.id===fromId?{...item,options:item.options.map(option=>option.id===optionId?{...option,nextId:id}:option)}:item)
    changeView('edit');setMode('manual');setAutoAdapt(false)
    if(session.plan){addedQuestionRef.current=id;navigationRef.current=true}
    try{const next=changeFlow(session,{plan,context},'Added question');if(!session.plan)onApplyPlan(next);else onChange(next)}catch(failure){setError(failure instanceof Error?failure.message:'Could not add question')}
  }
  const removeQuestion=(id:string)=>{
    if(!session.plan)return
    const questions=session.plan.questions.filter(item=>item.id!==id).map(item=>({...item,options:item.options.map(option=>({...option,nextId:option.nextId===id?undefined:option.nextId}))}))
    editPlan({...session.plan,startId:session.plan.startId===id?questions[0].id:session.plan.startId,questions},'Removed question')
  }
  const select=(questionId:string,optionId:string,model=false)=>{
    try{const suggestion=session.suggestions[questionId];if(model&&(!suggestion||suggestion.revision!==session.revision||suggestion.optionId!==optionId))throw new Error('This suggestion is no longer current. Evaluate the question again.');navigationRef.current=true;onChange(chooseFlow(session,questionId,optionId,model?'model':'manual',model?suggestion?.probability:undefined,model?suggestion?.evidence:undefined))}catch(failure){setError(failure instanceof Error?failure.message:'Could not select answer');navigationRef.current=false}
  }
  const exportSession=()=>{
    try {
      const url=URL.createObjectURL(new Blob([exportFlow(session)],{type:'application/json'}))
      const anchor=document.createElement('a');anchor.href=url
      anchor.download=`${(session.plan?.title||'decision').replace(/[^A-Za-z0-9_-]/g,'_').slice(0,80)}.decision.json`
      anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
      setError('')
    }catch(failure){setError(failure instanceof Error?failure.message:'Could not export the flow')}
  }
  const importSession=async(file:File)=>{
    // File reading is asynchronous too: switching tabs or editing must not apply a late import.
    cancel();const token=operation.current
    try {
      if(file.size>MAX_FLOW_FILE_BYTES)throw new Error('Decision files must be smaller than 1 MB.')
      const imported=importFlow(await file.text())
      if(token===operation.current){setMode('manual');setAutoAdapt(false);onImportSession(imported)}
    }catch(failure){if(token===operation.current)setError(failure instanceof Error?failure.message:'Could not import the flow')}
  }
  return <aside id="decision-workspace" className="decision-workspace" aria-label="Decision workspace" style={{width}}>
    <DecisionResizeHandle width={width} min={minWidth} max={maxWidth} onResize={onResize}/>
    <header><UserBlob busy={!!busy}/><strong>DECISIONS</strong><span className="flow-preview-label">Preview</span><button onClick={onClose} aria-label="Close decision workspace">×</button></header>
    {(error||busy)&&<div className="flow-feedback">{error&&<p role="alert">{error}</p>}{busy&&<div role="status">{busy==='plan'?'Drafting questions…':'Evaluating current state…'} <button onClick={cancel}>Cancel</button></div>}</div>}
    <div className="decision-scroll" ref={scrollRef}>
      {session.plan&&<nav className="flow-navigator" aria-label="Decision navigation">
        <div className="flow-view-switch" role="group" aria-label="Decision view"><button aria-pressed={!editing} onClick={()=>changeView('decide')}>Decide</button><button aria-pressed={editing} onClick={()=>changeView('edit')}>Edit flow</button></div>
        <div className="flow-progress" aria-live="polite"><strong>{path.pending?'Next decision':'Branch complete'}</strong><span>{path.options.length} answered · {session.plan.questions.length} questions in flow</span></div>
        <div className="flow-path" aria-label="Current answer path">{path.questions.map((id,index)=>{
          const question=session.plan!.questions.find(item=>item.id===id)!,selected=session.selections[id]
          return <button key={id} title={question.text} aria-label={`Go to question: ${question.text}`} aria-current={id===path.pending?'step':undefined} onClick={()=>{navigate(id,true);onFocus(id)}}>{index+1}. {selected?question.options.find(option=>option.id===selected.optionId)?.label:question.text}</button>
        })}</div>
        {mode!=='manual'&&<button onClick={()=>{cancel();setMode('manual');setAutoAdapt(false)}}>Pause automation</button>}
        {path.pending&&<button className="flow-jump" onClick={()=>navigate(path.pending!,true)}>Go to current question</button>}
      </nav>}
      {!session.plan&&<section className="flow-start" aria-label="Start a decision flow"><strong>One decision at a time.</strong><p>Describe your goal and the current facts below. Generate a draft with your chat provider, or start by adding a question yourself.</p><button disabled={!!busy} onClick={()=>addQuestion()}>Start manually</button></section>}
      <label htmlFor="flow-goal">Goal</label><textarea id="flow-goal" rows={2} maxLength={12000} value={session.goal} placeholder="Describe the decision or process…" onChange={event=>onChange(changeFlow(session,{goal:event.target.value},'Updated goal'))}/>
      <label htmlFor="flow-context">Live state / update</label><textarea id="flow-context" rows={3} maxLength={12000} value={context} placeholder="What has changed? Facts, text or JSON…" onChange={event=>{cancel();setDraft(null);onChange(changeFlow(latest.current,{context:event.target.value},'Updated state'))}}/>
      <div className="flow-actions"><button onClick={()=>void generate()} disabled={!!busy||!session.goal.trim()||context!==session.context}>{session.plan?'Adapt flow with AI':'Generate flow with AI'}</button><button onClick={()=>addQuestion()} disabled={!!busy||(session.plan?.questions.length||0)>=20}>Add question</button><button onClick={()=>{setMode('manual');setAutoAdapt(false);onChange(undoFlow(session))}} disabled={!session.history.length||!!busy}>Undo</button><button onClick={()=>{setMode('manual');setAutoAdapt(false);onChange(redoFlow(session))}} disabled={!session.future.length||!!busy}>Redo</button></div>
      <details className="flow-settings"><summary>Save / load flow</summary>
        <div className="flow-actions"><button onClick={exportSession} disabled={!session.plan||!!busy}>Export decision JSON</button><button onClick={()=>fileInput.current?.click()} disabled={!!busy}>Import decision JSON</button></div>
        <input ref={fileInput} type="file" accept=".json,application/json" aria-label="Decision JSON file" hidden onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void importSession(file)}}/>
        <p>Includes goal, current state, questions and selected answers. Import opens a new tab.</p>
      </details>
      <label className="flow-toggle"><input type="checkbox" checked={autoAdapt} onChange={event=>{lastAdapt.current='';setAutoAdapt(event.target.checked)}}/>Suggest question updates automatically</label>
      <details className="flow-settings"><summary>Provider connection</summary>
        <label htmlFor="decision-provider">Decision provider</label><select id="decision-provider" value={config.provider} onChange={event=>setConfig(decisionDefaults(event.target.value as DecisionProvider))}><option value="jev">Jev · TypeSafe (hosted)</option><option value="laya">Laya (local)</option></select>
        <label htmlFor="decision-endpoint">Endpoint</label><input id="decision-endpoint" value={config.endpoint} readOnly={config.provider==='jev'} onChange={event=>setConfig({...config,endpoint:event.target.value})}/>
        <label htmlFor="decision-model">Model</label><input id="decision-model" value={config.model} onChange={event=>setConfig({...config,model:event.target.value})}/>
        <label htmlFor="decision-key">{config.provider==='jev'?'TypeSafe API key':'Laya key (optional)'}</label><input id="decision-key" type="password" autoComplete="off" value={apiKey} onChange={event=>{keyEdited.current=true;setApiKey(event.target.value)}}/>
        <button onClick={()=>void persistConfig().then(()=>setError('')).catch(()=>setError('Provider settings could not be saved.'))}>Save provider</button>
        <p>Question generation uses your chat provider from Settings. Jev/Laya evaluates the answers.
          {config.provider==='laya'?' Browser Laya needs server CORS and local-network permission.':' Browser Jev sends the state and personal key through Mermaider to TypeSafe.'}</p>
      </details>
      <label htmlFor="flow-mode">Response mode</label><select id="flow-mode" value={mode} onChange={event=>{lastAuto.current='';setMode(event.target.value as Mode)}}><option value="manual">Manual · evaluate on demand</option><option value="suggest">Live suggestions · review each answer</option><option value="follow">Auto follow · apply at ≥80% option probability</option></select>
      {mode!=='manual'&&<p className="flow-hint">Updates call the selected decision provider. Auto follow can advance up to 20 questions per update; score and unclear results stay for review.</p>}

      {draft&&<section className="flow-draft" aria-label="Proposed flow"><strong>{draft.title}</strong><p>{draft.questions.length} questions · review before applying</p><ul>{draft.questions.map(question=><li key={question.id}>{question.text}<small>{question.options.map(option=>option.label).join(' / ')} · {ruleDescription(question)}</small></li>)}</ul><details className="flow-draft-editor"><summary>Edit proposed wording</summary>{draft.questions.map((question,index)=><div key={question.id}><label>Question {index+1}<input aria-label={`Draft question ${index+1}`} value={question.text} maxLength={1000} onChange={event=>setDraft({...draft,questions:draft.questions.map(item=>item.id===question.id?{...item,text:event.target.value}:item)})}/></label>{question.options.map((option,optionIndex)=><label key={option.id}>Answer {optionIndex+1}<input aria-label={`Draft answer ${index+1}.${optionIndex+1}`} value={option.label} maxLength={300} onChange={event=>setDraft({...draft,questions:draft.questions.map(item=>item.id===question.id?{...item,options:item.options.map(answer=>answer.id===option.id?{...answer,label:event.target.value}:answer)}:item)})}/></label>)}</div>)}</details><button disabled={draft.questions.some(question=>!question.text.trim()||question.options.some(option=>!option.label.trim()))} onClick={()=>{onApplyPlan(changeFlow(session,{plan:draft},'Applied AI draft'));setDraft(null)}}>Apply draft</button><button onClick={()=>setDraft(null)}>Discard</button></section>}
      {nodeProposal&&<section className="flow-draft" aria-label="Diagram question"><strong>{nodeProposal.text}</strong><p>{nodeProposal.options.map(option=>option.label).join(' / ')}</p><button onClick={()=>onApplyPlan(changeFlow(session,{plan:{title:nodeProposal.text,startId:nodeProposal.id,questions:[nodeProposal]}},'Imported branching node'))}>Use this node as a question</button></section>}
      {!session.plan&&<p className="flow-hint">Start from a goal or add your first question. A new flow opens in its own tab and preserves the current diagram.</p>}
      {session.plan&&!session.linked&&<p className="flow-hint">This diagram was edited separately. <button onClick={()=>onApplyPlan(session)}>Open managed flow in new tab</button></p>}
      {session.plan&&<div className="flow-questions">{session.plan.questions.map(question=>{
        const reachable=path.questions.includes(question.id);const selected=session.selections[question.id];const suggestion=session.suggestions[question.id];const current=path.pending===question.id
        return <section key={question.id} id={`question-card-${question.id}`} tabIndex={-1} className={`flow-question ${current?'current':''} ${focused?.id===question.id?'focused':''}`} aria-label={`Question: ${question.text}`}>
          <div className="flow-question-heading"><span>{current?'CURRENT':selected?'DECIDED':reachable?'AVAILABLE':'FOLLOW-UP'}</span><button onClick={()=>onFocus(question.id)} aria-label="Locate question in diagram">↗</button>{session.plan!.questions.length>1&&<button onClick={()=>removeQuestion(question.id)} aria-label="Delete question">×</button>}</div>
          {!editing&&<><h3 className="flow-question-title">{question.text||'Untitled question'}</h3><p className="flow-hint">{question.evaluation?.type==='score'?'Score · review required':question.evaluation?.type==='noul'?'Noul · statement probability':'Choose an answer'}{!reachable?' · Choose the preceding answers to reach this question.':''}</p>{question.evaluation&&question.evaluation.type!=='choice'&&<details><summary>How this answer is evaluated</summary><p className="flow-hint">{ruleDescription(question)}</p>{question.evaluation.type==='score'&&<ol start={0}>{question.evaluation.rubric.map((level,index)=><li key={index}>{level}</li>)}</ol>}</details>}<div className="flow-answer-cards">{question.options.map(option=><button key={option.id} className={selected?.optionId===option.id?'chosen':''} aria-label={`Choose ${option.label}`} aria-pressed={selected?.optionId===option.id} disabled={!reachable} onClick={()=>select(question.id,option.id)}><span aria-hidden="true">{selected?.optionId===option.id?'●':'○'}</span><span>{option.label||'Untitled answer'}</span><small>{option.nextId?'Follow-up':'End of branch'}</small></button>)}</div></>}
          {selected&&<div className="flow-selection-summary"><span>{selected.source==='manual'?'Your choice':'Adopted model answer'}: <strong>{question.options.find(option=>option.id===selected.optionId)?.label}</strong></span><button aria-label={`Clear answer for ${question.text}`} onClick={()=>{cancel();setMode('manual');setAutoAdapt(false);const selections={...session.selections};delete selections[question.id];onChange(changeFlow(session,{selections},'Cleared answer',{question:question.text}));navigate(question.id,true)}}>Clear answer</button>{!editing&&!question.options.find(option=>option.id===selected.optionId)?.nextId&&session.plan!.questions.length<20&&<button onClick={()=>addQuestion(question.id,selected.optionId)}>Add next question</button>}</div>}
          {editing&&<>
          <input className="flow-question-text" aria-label="Question text" maxLength={1000} value={question.text} onChange={event=>editQuestion({...question,text:event.target.value})}/>
          <DecisionRuleEditor question={question} onChange={editQuestion}/>
          {question.options.map(option=><div className={`flow-option ${selected?.optionId===option.id?'chosen':''}`} key={option.id}><button aria-label={`Choose ${option.label}`} aria-pressed={selected?.optionId===option.id} disabled={!reachable} onClick={()=>select(question.id,option.id)}>{selected?.optionId===option.id?'●':'○'}</button><input aria-label="Answer text" maxLength={300} value={option.label} onChange={event=>editQuestion({...question,options:question.options.map(item=>item.id===option.id?{...item,label:event.target.value}:item)})}/><button aria-label="Remove answer" disabled={question.options.length<=2||!!(question.evaluation&&question.evaluation.type!=='choice'&&[question.evaluation.lowId,question.evaluation.highId,question.evaluation.uncertainId].includes(option.id))} onClick={()=>editQuestion({...question,options:question.options.filter(item=>item.id!==option.id)})}>×</button></div>)}
          <button onClick={()=>editQuestion({...question,options:[...question.options,{id:flowId('a'),label:'New answer',nextId:undefined}]})} disabled={question.options.length>=12}>+ Answer</button>
          <details><summary>Follow-ups</summary>{question.options.map(option=><label key={option.id}>{option.label}<select aria-label={`Follow-up for ${option.label}`} value={option.nextId||''} onChange={event=>editQuestion({...question,options:question.options.map(item=>item.id===option.id?{...item,nextId:event.target.value||undefined}:item)})}><option value="">End this branch</option>{session.plan!.questions.filter(item=>item.id!==question.id).map(item=><option value={item.id} key={item.id}>{item.text}</option>)}</select><button disabled={session.plan!.questions.length>=20} onClick={()=>addQuestion(question.id,option.id)}>+ Follow-up</button></label>)}</details>
          </>}
          {suggestion&&suggestion.revision===session.revision&&<div className="flow-suggestion"><p>Suggested: {question.options.find(option=>option.id===suggestion.optionId)?.label}{suggestion.probability!==undefined?` · ${Math.round(suggestion.probability*100)}% option probability`:''}</p><small>{suggestion.provider} · {suggestion.model}</small>{suggestion.evidence&&<p>{suggestion.evidence.explanation}</p>}<div className="flow-actions"><button onClick={()=>select(question.id,suggestion.optionId,true)}>Adopt suggestion</button><button onClick={()=>{const suggestions={...session.suggestions};delete suggestions[question.id];onChange({...session,suggestions})}}>Dismiss suggestion</button></div></div>}
          <div className="flow-actions"><button title={config.provider==='jev'&&!apiKey.trim()?'Add your TypeSafe API key under Provider connection.':'Evaluate this question with the selected provider.'} onClick={()=>void evaluate(question.id)} disabled={!reachable||!!busy||context!==session.context}>Evaluate</button><button onClick={()=>void generate(question.id)} disabled={!!busy||!session.goal.trim()||context!==session.context}>Suggest next steps</button></div>
        </section>
      })}</div>}
      {!!session.events.length&&<details className="flow-history"><summary>Decision history ({session.events.length})</summary><p className="flow-hint">Latest 50 events · local · context excerpts up to 1,000 characters</p><ol>{[...session.events].reverse().map(event=><li key={event.id}><details><summary>{new Date(event.timestamp).toLocaleTimeString()} · {event.note}{event.answer?` · ${event.answer}`:''}</summary><small>Revision {event.revision}{event.source?` · ${event.source}`:''}</small>{event.question&&<p>{event.question}</p>}{event.rule&&<p>{event.rule}</p>}{event.goal&&<p>Goal: {event.goal}</p>}{event.evidence&&<><p>{event.evidence.explanation}</p><small>{event.evidence.provider} · {event.evidence.model} · {event.evidence.elapsedMs} ms</small>{event.evidence.probabilities&&<p>Distribution: {Object.entries(event.evidence.probabilities).map(([label,value])=>`${label}: ${Math.round(value*100)}%`).join(' · ')}</p>}{event.evidence.confidence!==undefined&&<p>Provider confidence: {event.evidence.confidence}</p>}{event.evidence.answerConfidence!==undefined&&<p>Provider answer_confidence: {event.evidence.answerConfidence}</p>}</>}{event.context&&<p className="flow-event-context">{event.context}</p>}</details></li>)}</ol></details>}
      {session.plan&&!path.pending&&<p role="status">This branch is complete. Update the state, change an answer or adapt the flow to continue.</p>}
    </div>
  </aside>
}
