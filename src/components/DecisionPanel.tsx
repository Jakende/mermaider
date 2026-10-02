import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { decisionDefaults, evaluateDecision, loadDecisionKey, saveDecisionKey, validateDecisionRequest } from '../decision/service'
import { choiceDiagram } from '../decision/diagram'
import type { DecisionProvider, DecisionRequest, DecisionRun } from '../decision/types'
import './Settings.css'
import './DecisionPanel.css'

interface Props { isOpen: boolean; onClose: () => void; onCreateDiagram: (code: string, name: string) => void }
const EXAMPLE = { decision: { type: 'choice' as const, instructions: 'Which budget state is explicitly described?', criteria: { approved: 'Budget approved', rejected: 'Budget rejected', unknown: 'No clear decision stated' } } }
export default function DecisionPanel({ isOpen, onClose, onCreateDiagram }: Props) {
  const { theme } = useTheme()
  const [provider, setProvider] = useState<DecisionProvider>('jev')
  const defaults = decisionDefaults(provider)
  const [endpoint, setEndpoint] = useState(defaults.endpoint)
  const [model, setModel] = useState(defaults.model)
  const [key, setKey] = useState('')
  const [state, setState] = useState('The budget has been approved.')
  const [questions, setQuestions] = useState(JSON.stringify(EXAMPLE, null, 2))
  const [run, setRun] = useState<DecisionRun | null>(null)
  const [history, setHistory] = useState<DecisionRun[]>([])
  const [selected, setSelected] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const version = useRef(0)
  const controller = useRef<AbortController | null>(null)
  const invalidate = () => { version.current++; controller.current?.abort(); setPending(false); setRun(null); setSelected(''); setError('') }
  useEffect(() => {
    let current = true
    setKey('')
    const initialVersion = version.current
    void loadDecisionKey(provider).then(value => { if (current && initialVersion === version.current) setKey(value) }).catch(() => { if (current) setError('Provider key could not be read from secure storage.') })
    return () => { current = false }
  }, [provider])
  useEffect(() => () => controller.current?.abort(), [])
  const close = () => { invalidate(); onClose() }
  useEffect(() => {
    if (!isOpen) return
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [isOpen])
  function input(): DecisionRequest {
    let parsedState: DecisionRequest['state'] = state
    if (state.trimStart().startsWith('[') || state.trimStart().startsWith('{')) parsedState = JSON.parse(state)
    const request = { state: parsedState, questions: JSON.parse(questions) }
    validateDecisionRequest(request)
    return request
  }
  let currentInput: DecisionRequest | null = null
  try { currentInput = input() } catch { /* Display validation when evaluating or exporting. */ }
  const choiceEntry = currentInput && Object.entries(currentInput.questions).find(([,question]) => question.type === 'choice')
  const choice = choiceEntry?.[1]
  const options = choice?.type === 'choice' ? Object.keys(choice.criteria) : []
  const evaluate = async () => {
    invalidate()
    const currentVersion = version.current
    const abort = new AbortController(); controller.current = abort
    setPending(true)
    try {
      const request = input()
      await saveDecisionKey(provider, key)
      if (currentVersion !== version.current) return
      const result = await evaluateDecision({ provider, endpoint, model, apiKey: key }, request, abort.signal)
      if (currentVersion !== version.current) return
      setRun(result); setHistory(previous => [result, ...previous].slice(0, 10))
    } catch (failure) {
      if (currentVersion === version.current && !abort.signal.aborted) setError(failure instanceof Error ? failure.message : 'Decision request failed.')
    } finally { if (currentVersion === version.current) setPending(false) }
  }
  const create = () => {
    try {
      const request = input()
      if (!choiceEntry) throw new Error('Add a choice question to create a path diagram.')
      onCreateDiagram(choiceDiagram(request, choiceEntry[0], selected), 'decision-path')
      close()
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not create the diagram.') }
  }
  if (!isOpen) return null
  return <div className="modal-overlay" onClick={close}>
    <div className={`settings-modal decision-panel ${theme}`} role="dialog" aria-modal="true" aria-labelledby="decision-title" onClick={event=>event.stopPropagation()}>
      <div className="settings-header"><h2 id="decision-title">Decisions · Preview</h2><button className="close-button" onClick={close} aria-label="Close decisions">×</button></div>
      <div className="settings-content">
        <p className="settings-hint">Evaluate defined choices from text or JSON. Review the model suggestion before adopting a path.
          You can also select a path manually without calling a model. Provider quality and latency still need validation with your examples.</p>
        <div className="settings-field"><label htmlFor="decision-provider">Provider</label>
          <select id="decision-provider" value={provider} onChange={event=>{ invalidate(); const next = event.target.value as DecisionProvider; setProvider(next); const config = decisionDefaults(next); setEndpoint(config.endpoint); setModel(config.model) }}>
            <option value="jev">Jev · TypeSafe (hosted)</option><option value="laya">Laya (local)</option>
          </select></div>
        <div className="settings-field"><label htmlFor="decision-endpoint">Endpoint</label><input id="decision-endpoint" value={endpoint} readOnly={provider==='jev'} onChange={event=>{invalidate();setEndpoint(event.target.value)}} /></div>
        <div className="settings-field"><label htmlFor="decision-model">Model</label><input id="decision-model" value={model} onChange={event=>{invalidate();setModel(event.target.value)}} /></div>
        <div className="settings-field"><label htmlFor="decision-key">{provider==='jev' ? 'TypeSafe API key' : 'Laya API key (optional)'}</label><input id="decision-key" type="password" autoComplete="off" value={key} onChange={event=>{invalidate();setKey(event.target.value)}} /></div>
        <p className="settings-hint">{provider==='jev' ? 'In the browser, your key and state are forwarded through the hosted Mermaider service to TypeSafe.' : 'Start your existing Laya HTTP server on loopback. Browser access requires CORS configuration in the Laya server and local-network permission. Unmodified laya-serve is not yet a verified browser configuration. Laya is never silently replaced with a hosted provider.'}</p>
        <div className="settings-field"><label htmlFor="decision-state">State · text or JSON</label><textarea id="decision-state" rows={3} value={state} onChange={event=>{invalidate();setState(event.target.value)}} /></div>
        <div className="settings-field"><label htmlFor="decision-questions">Questions · JSON (choice, score, noul)</label><textarea id="decision-questions" rows={10} value={questions} onChange={event=>{invalidate();setQuestions(event.target.value)}} /></div>
        {error && <p role="alert">{error}</p>}
        <div className="decision-actions"><button className="button-primary" onClick={evaluate} disabled={pending}>Evaluate</button>{pending && <button className="button-secondary" onClick={invalidate}>Cancel</button>}</div>
        {run && <section aria-label="Decision results"><h3>Model suggestion</h3><p className="settings-hint">{run.provider} · {run.model} · {run.elapsedMs} ms</p>
          {Object.entries(run.answers).map(([id,answer])=><div key={id}><p>{id}: {String(answer.value)}{answer.type==='noul' ? ' (probability of yes)' : answer.type==='score' ? ' (expected rubric index)' : ''}</p>
            {answer.type==='choice' && choiceEntry?.[0]===id && <button className="button-secondary" onClick={()=>setSelected(String(answer.value))}>Adopt suggestion</button>}</div>)}
        </section>}
        {options.length > 0 && <div className="settings-field"><label htmlFor="decision-path">Selected path · first choice question</label><select id="decision-path" value={selected} onChange={event=>setSelected(event.target.value)}><option value="">Review and select an option</option>{options.map(option=><option key={option} value={option}>{option}</option>)}</select><button className="button-primary" disabled={!selected} onClick={create}>Open path diagram in new tab</button></div>}
        {history.length > 0 && <details><summary>Recent runs in this session ({history.length})</summary>{history.map(item=><p className="settings-hint" key={item.id}>{new Date(item.timestamp).toLocaleTimeString()} · {item.provider} · {item.model} · {item.elapsedMs} ms</p>)}</details>}
      </div>
    </div>
  </div>
}
