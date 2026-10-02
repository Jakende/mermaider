import type { DecisionRequest } from './types'
// Numeric entities keep labels literal: no injected Mermaid syntax or HTML.
export const decisionLabel = (text: string) => Array.from(text).map(char => char.codePointAt(0)! > 127 || /[a-zA-Z0-9 .,_-]/.test(char) ? char : `#${char.codePointAt(0)};`).join('')
export function choiceDiagram(input: DecisionRequest, questionId: string, selected: string): string {
  const question = input.questions[questionId]
  if (question.type !== 'choice' || !Object.prototype.hasOwnProperty.call(question.criteria, selected)) throw new Error('Only a defined choice can select a diagram path.')
  const lines = ['flowchart TD', `  decision{"${decisionLabel(question.instructions || questionId)}"}`]
  const labels = Object.keys(question.criteria)
  labels.forEach((label, index) => lines.push(`  decision -->|"${decisionLabel(label)}"| option${index}["${decisionLabel(question.criteria[label] || label)}"]`))
  const active = labels.indexOf(selected)
  lines.push('  classDef selected stroke-width:4px,font-weight:bold;', `  class option${active} selected;`, `  linkStyle ${active} stroke-width:4px;`)
  return lines.join('\n')
}
