/**
 * Types for parsed Mermaid flowchart elements
 */
export interface MermaidNode {
  id: string
  label: string
  shape: 'rect' | 'rounded' | 'stadium' | 'subroutine' | 'cylinder' | 'circle' | 'doublecircle' | 'diamond' | 'hexagon' | 'parallelogram' | 'trapezoid' | 'trapezoidAlt' | 'rhombus'
  style?: string
  class?: string
}

export interface MermaidEdge {
  source: string
  target: string
  label?: string
  style?: string
  type: 'arrow' | 'line' | 'thick' | 'dotted'
}

export interface ParsedMermaidDiagram {
  type: 'flowchart' | 'graph' | 'unsupported'
  direction: 'TD' | 'BT' | 'LR' | 'RL'
  nodes: MermaidNode[]
  edges: MermaidEdge[]
  subgraphs?: Array<{ id: string; label?: string; nodes: string[] }>
}

/** A supported node token, including its source range for visual edits. */
export interface MermaidNodeToken {
  node: MermaidNode
  start: number
  end: number
  labelStart?: number
  labelEnd?: number
}

const shapes: Array<[string, string, MermaidNode['shape']]> = [
  ['(((', ')))', 'doublecircle'], ['[[', ']]', 'subroutine'],
  ['[(', ')]', 'cylinder'], ['([', '])', 'stadium'], ['((', '))', 'circle'],
  ['{{', '}}', 'hexagon'], ['[/', '\\]', 'trapezoid'],
  ['[\\', '/]', 'trapezoidAlt'], ['[/', '/]', 'parallelogram'],
  ['[', ']', 'rect'], ['(', ')', 'rounded'], ['{', '}', 'diamond'],
]

export function readMermaidNode(text: string, offset = 0): MermaidNodeToken | null {
  const match = text.slice(offset).match(/^\s*([\w](?:[\w-]*[\w])?)/)
  if (!match) return null
  const start = offset + match[0].indexOf(match[1])
  let end = offset + match[0].length
  const node: MermaidNode = { id: match[1], label: match[1], shape: 'rect' }
  let labelStart: number | undefined
  let labelEnd: number | undefined
  const shapeStart = end + (text.slice(end).match(/^\s*/)?.[0].length ?? 0)
  if ('[({'.includes(text[shapeStart] ?? '\0')) {
    let found = false
    for (const [open, close, shape] of shapes) {
      if (!text.startsWith(open, shapeStart)) continue
      let quoted = false
      for (let i = shapeStart + open.length; i < text.length; i++) {
        if (text[i] === '"' && text[i - 1] !== '\\') quoted = !quoted
        if (!quoted && text.startsWith(close, i)) {
          labelStart = shapeStart + open.length
          labelEnd = i
          node.label = text.slice(labelStart, labelEnd).replace(/^"([\s\S]*)"$/, '$1')
          node.shape = shape
          end = i + close.length
          found = true
          break
        }
      }
      if (found) break
    }
    if (!found) return null
  }
  const classMatch = text.slice(end).match(/^:::(\w[\w-]*)/)
  if (classMatch) { node.class = classMatch[1]; end += classMatch[0].length }
  return { node, start, end, labelStart, labelEnd }
}

/** Split statements without cutting quoted labels or configuration blocks. */
export function flowchartStatements(code: string): string[] {
  const body = code.trim().replace(/^---\s*\n[\s\S]*?\n---\s*/, '')
    .replace(/%%\{init:[\s\S]*?\}%%/g, '')
  const statements: string[] = []
  let current = '', quoted = false, depth = 0
  for (let i = 0; i < body.length; i++) {
    const c = body[i]
    if (c === '"' && body[i - 1] !== '\\') quoted = !quoted
    if (!quoted && c === '%' && body[i + 1] === '%') {
      while (i < body.length && body[i] !== '\n') i++
      statements.push(current.trim()); current = ''; continue
    }
    if (!quoted && '[({'.includes(c)) depth++
    if (!quoted && '])}'.includes(c)) depth--
    if (!quoted && depth === 0 && (c === '\n' || c === ';')) {
      statements.push(current.trim()); current = ''
    } else current += c
  }
  statements.push(current.trim())
  return statements.filter(Boolean)
}

export function isEditableDiagram(code: string): boolean {
  return parseMermaidFlowchart(code) !== null
}

/**
 * Parse the flowchart subset supported by the visual editor. Unknown statements
 * disable visual editing rather than displaying an incomplete graph.
 */
export function parseMermaidFlowchart(code: string): ParsedMermaidDiagram | null {
  const statements = flowchartStatements(code)
  const declaration = statements.shift()?.match(/^(flowchart|graph)\s+(TD|TB|BT|LR|RL|DT)\s*$/i)
  if (!declaration) return null
  const directionRaw = declaration[2].toUpperCase()
  const direction = directionRaw === 'TB' ? 'TD' : directionRaw === 'DT' ? 'BT' : directionRaw
  const nodes: MermaidNode[] = [], edges: MermaidEdge[] = []
  const nodeMap = new Map<string, MermaidNode>()
  const subgraphs: NonNullable<ParsedMermaidDiagram['subgraphs']> = []
  const stack: Array<NonNullable<ParsedMermaidDiagram['subgraphs']>[number]> = []
  const addNode = (token: MermaidNodeToken) => {
    const existing = nodeMap.get(token.node.id)
    if (!existing) { nodes.push(token.node); nodeMap.set(token.node.id, token.node) }
    else if (token.labelStart !== undefined) Object.assign(existing, token.node)
    for (const group of stack) if (!group.nodes.includes(token.node.id)) group.nodes.push(token.node.id)
  }
  for (const line of statements) {
    const subgraph = line.match(/^subgraph\s+([\w-]+)(?:\s*\[([^\]]+)\]|\s+"([^"]+)"|\s+(.+))?$/)
    if (subgraph) {
      const group = { id: subgraph[1], label: subgraph[2] ?? subgraph[3] ?? subgraph[4], nodes: [] as string[] }
      subgraphs.push(group); stack.push(group); continue
    }
    if (line === 'end') { if (!stack.pop()) return null; continue }
    if (/^(classDef|class|click|linkStyle|direction)\s/.test(line)) continue
    const style = line.match(/^style\s+([\w-]+)\s+(.+)$/)
    if (style) { const node = nodeMap.get(style[1]); if (node) node.style = style[2]; continue }
    let source = readMermaidNode(line)
    if (!source) return null
    addNode(source)
    let offset = source.end
    while (line.slice(offset).trim()) {
      const rest = line.slice(offset)
      // Inline labels, pipe labels, and chained edges; labels can contain arrows.
      const connector = rest.match(/^\s*(-->|==>|-\.->|---|===|-\.-)(?:\s*\|([^|]*)\|)?\s*/)
        ?? rest.match(/^\s*(--|==|-\.)\s+(.+?)\s*(-->|==>|\.->)\s*/)
      if (!connector) return null
      const target = readMermaidNode(line, offset + connector[0].length)
      if (!target) return null
      addNode(target)
      const arrow = connector[1]
      edges.push({ source: source.node.id, target: target.node.id, label: connector[2]?.trim() || undefined,
        type: arrow.startsWith('=') ? 'thick' : arrow.includes('.') ? 'dotted' : arrow === '---' ? 'line' : 'arrow' })
      offset = target.end
      source = target
    }
  }
  if (stack.length) return null
  return { type: declaration[1].toLowerCase() as 'flowchart' | 'graph', direction: direction as ParsedMermaidDiagram['direction'],
    nodes, edges, subgraphs: subgraphs.length ? subgraphs : undefined }
}
