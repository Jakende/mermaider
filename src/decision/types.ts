export type DecisionProvider = 'jev' | 'laya'
export type DecisionQuestion =
  | { type: 'choice'; instructions?: string; criteria: Record<string, string> }
  | { type: 'score'; instructions?: string; criteria: string[] }
  | { type: 'noul'; instructions?: string; criteria?: { true?: string; false?: string } }
export interface DecisionRequest {
  state: string | Record<string, unknown> | unknown[]
  questions: Record<string, DecisionQuestion>
}
export interface DecisionConfig { provider: DecisionProvider; endpoint: string; model: string; apiKey?: string }
export interface DecisionAnswer {
  type: DecisionQuestion['type']; value: string | number
  probabilities?: Record<string, number>
  confidence?: number; answerConfidence?: number
}
export interface DecisionRun {
  id: string; provider: DecisionProvider; requestedModel: string; model: string
  input: DecisionRequest; answers: Record<string, DecisionAnswer>; routing?: unknown
  timestamp: number; elapsedMs: number
}
