import { fetch as nativeFetch } from '@tauri-apps/plugin-http'
import { invoke } from '@tauri-apps/api/core'
import { browserProviderFetch } from '../utils/browserTransport'
import type { DecisionConfig, DecisionProvider, DecisionRequest, DecisionRun, DecisionAnswer } from './types'

export function decisionDefaults(provider: DecisionProvider): DecisionConfig {
  return { provider, endpoint: provider === 'jev' ? 'https://api.typesafe.ai' : 'http://127.0.0.1:8000', model: provider === 'jev' ? 'jev-latest' : 'multilingual' }
}
const native = () => !!(window as any).__TAURI_INTERNALS__
export async function loadDecisionKey(provider: DecisionProvider): Promise<string> {
  if (native()) return invoke<string>('load_decision_key', { provider })
  try { return sessionStorage.getItem(`mermaider-decision-key-${provider}`) || '' } catch { return '' }
}
export async function saveDecisionKey(provider: DecisionProvider, key: string): Promise<void> {
  if (native()) return invoke('save_decision_key', { provider, key })
  try { if (key) sessionStorage.setItem(`mermaider-decision-key-${provider}`, key); else sessionStorage.removeItem(`mermaider-decision-key-${provider}`) } catch { /* Inference still works with the entered key. */ }
}
export function validateDecisionRequest(input: DecisionRequest): void {
  if (input.state == null || !['string', 'object'].includes(typeof input.state) || typeof input.state === 'string' && !input.state.trim()) throw new Error('Enter a text or JSON state.')
  const entries = Object.entries(input.questions || {})
  if (!entries.length || entries.length > 20) throw new Error('Provide between 1 and 20 decision questions.')
  for (const [id, question] of entries) {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(id)) throw new Error('Question IDs must start with a letter and contain only letters, numbers, underscores or hyphens.')
    if (question.type === 'choice') {
      if (!question.criteria || typeof question.criteria !== 'object' || Array.isArray(question.criteria)) throw new Error('Choice criteria must be a JSON object.')
      const criteria = Object.entries(question.criteria)
      if (criteria.length < 2 || criteria.length > 20 || criteria.some(([label, value]) => !label.trim() || typeof value !== 'string')) throw new Error('Choice questions need 2–20 described options.')
    } else if (question.type === 'score') {
      if (!Array.isArray(question.criteria) || question.criteria.length < 2 || question.criteria.some(value => typeof value !== 'string')) throw new Error('Score questions need an ordered rubric with at least two levels.')
    } else if (question.type !== 'noul') throw new Error('Unsupported decision question type.')
  }
}
const probability = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
export function normalizeDecisionResult(data: any, input: DecisionRequest): Record<string, DecisionAnswer> {
  if (!data || typeof data.model !== 'string' || !data.model.trim() || data.model.length > 300 || !data.answers || typeof data.answers !== 'object' || Array.isArray(data.answers)) throw new Error('Decision provider returned an invalid response.')
  const answers: Record<string, DecisionAnswer> = {}
  for (const [id, question] of Object.entries(input.questions)) {
    const raw = data.answers[id]
    if (!raw || raw.type !== question.type) throw new Error(`Missing or invalid answer for ${id}.`)
    let value: string | number
    if (question.type === 'choice') {
      if (typeof raw.choice !== 'string' || !Object.prototype.hasOwnProperty.call(question.criteria, raw.choice)) throw new Error(`Unknown option in answer ${id}.`)
      value = raw.choice
    } else if (question.type === 'score') {
      if (typeof raw.score !== 'number' || !Number.isFinite(raw.score) || raw.score < 0 || raw.score > question.criteria.length - 1) throw new Error(`Invalid score in ${id}.`)
      value = raw.score
    } else {
      if (!probability(raw.noul)) throw new Error(`Invalid probability in ${id}.`)
      value = raw.noul
    }
    if (question.type !== 'noul') {
      const labels = question.type === 'choice' ? Object.keys(question.criteria) : question.criteria.map((_, index) => String(index))
      if (!raw.probabilities || typeof raw.probabilities !== 'object' || Array.isArray(raw.probabilities) || Object.keys(raw.probabilities).length !== labels.length || labels.some(label => !probability(raw.probabilities[label])) || Math.abs(labels.reduce((sum, label) => sum + raw.probabilities[label], 0) - 1) > 0.02) throw new Error(`Invalid option probabilities in ${id}.`)
      // Score is the expected rubric index. Allow rounding, but reject a
      // conflicting scalar that would route to a different decision branch.
      if (question.type === 'score' && Math.abs(labels.reduce((sum, label) => sum + Number(label) * raw.probabilities[label], 0) - Number(value)) > 0.01) throw new Error(`Score and probabilities disagree in ${id}.`)
    }
    if (raw.confidence !== undefined && !probability(raw.confidence) || raw.answer_confidence !== undefined && !probability(raw.answer_confidence)) throw new Error(`Invalid confidence metadata in ${id}.`)
    answers[id] = { type: question.type, value, probabilities: question.type==='noul'?undefined:raw.probabilities, confidence: raw.confidence, answerConfidence: raw.answer_confidence }
  }
  return answers
}
export async function evaluateDecision(config: DecisionConfig, input: DecisionRequest, signal?: AbortSignal): Promise<DecisionRun> {
  validateDecisionRequest(input)
  const endpoint = new URL(config.endpoint.trim().replace(/\/+$/, '') + '/v1/systemone')
  if (config.provider === 'jev' && endpoint.href !== 'https://api.typesafe.ai/v1/systemone') throw new Error('Jev uses the official https://api.typesafe.ai endpoint.')
  if (config.provider === 'laya' && (!['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname) || !['http:', 'https:'].includes(endpoint.protocol))) throw new Error('Laya must use a local loopback endpoint.')
  if (endpoint.username || endpoint.password || endpoint.hash || endpoint.search) throw new Error('Invalid decision endpoint.')
  if (config.provider === 'jev' && !config.apiKey?.trim()) throw new Error('Enter your TypeSafe API key.')
  const started = performance.now()
  const timeout = AbortSignal.timeout(50000)
  const options: RequestInit = { method: 'POST', signal: signal ? AbortSignal.any([signal, timeout]) : timeout, headers: { 'Content-Type': 'application/json', ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}) }, body: JSON.stringify({ ...input, ...(config.model.trim() ? { model: config.model.trim() } : {}) }) }
  const response = await (native() ? nativeFetch(endpoint.href, options) : browserProviderFetch(endpoint.href, options))
  if (!response.ok) throw new Error(`Decision provider returned HTTP ${response.status}. Check credentials, model and provider availability.`)
  const data = await response.json()
  const answers = normalizeDecisionResult(data, input)
  return { id: crypto.randomUUID(), provider: config.provider, requestedModel: config.model, model: data.model, input, answers, routing: data.routing, timestamp: Date.now(), elapsedMs: Math.round(performance.now() - started) }
}
