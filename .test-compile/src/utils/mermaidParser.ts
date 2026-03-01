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

/**
 * Detects if a Mermaid diagram is a flowchart/graph that can be visually edited
 */
export function isEditableDiagram(code: string): boolean {
  const trimmed = code.trim()
  // Support code with YAML frontmatter
  const flowchartRegex = /(?:^|\n)\s*(flowchart|graph)\s+(TD|BT|LR|RL|TB|DT)/i
  return flowchartRegex.test(trimmed)
}

/**
 * Parses Mermaid flowchart/graph code into structured data
 */
export function parseMermaidFlowchart(code: string): ParsedMermaidDiagram | null {
  const trimmed = code.trim()

  // Check if it's a flowchart or graph (allowing leading frontmatter)
  const flowchartRegex = /(?:^|\n)\s*(flowchart|graph)\s+(TD|BT|LR|RL|TB|DT)/i
  const flowchartMatch = trimmed.match(flowchartRegex)

  if (!flowchartMatch) {
    return null
  }

  const type = flowchartMatch[1].toLowerCase() as 'flowchart' | 'graph'
  let directionRaw = flowchartMatch[2].toUpperCase()

  // Normalize direction
  let direction: 'TD' | 'BT' | 'LR' | 'RL' = 'TD'
  if (directionRaw === 'TB' || directionRaw === 'TD') direction = 'TD'
  else if (directionRaw === 'DT' || directionRaw === 'BT') direction = 'BT'
  else if (directionRaw === 'LR') direction = 'LR'
  else if (directionRaw === 'RL') direction = 'RL'

  const nodes: MermaidNode[] = []
  const edges: MermaidEdge[] = []
  const nodeMap = new Map<string, MermaidNode>()
  const subgraphs: Array<{ id: string; label?: string; nodes: string[] }> = []

  // Remove YAML frontmatter if present for parsing lines
  const codeWithoutFrontmatter = trimmed.replace(/^---\s*[\s\S]*?---\s*/, '')

  // Remove comments
  const withoutComments = codeWithoutFrontmatter.replace(/%%[^\n]*/g, '')

  // Split into lines
  const lines = withoutComments.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%'))

  // Parse nodes and edges
  for (const line of lines) {
    // Skip the diagram declaration line
    if (/^(flowchart|graph)\s+(TD|BT|LR|RL|TB|DT)/i.test(line)) {
      continue
    }

    // Parse subgraphs
    const subgraphMatch = line.match(/subgraph\s+(\w+)(?:\s+"([^"]+)")?/i)
    if (subgraphMatch) {
      subgraphs.push({
        id: subgraphMatch[1],
        label: subgraphMatch[2],
        nodes: []
      })
      continue
    }

    if (line === 'end') {
      continue
    }

    // Parse edges: A --> B, A -->|label| B, A --> B(label)
    const edgeMatch = line.match(/^(\w+)\s*([-=.]+>|--|==>|==>|-->)\s*(\|([^|]+)\|)?\s*(\w+)/)
    if (edgeMatch) {
      const source = edgeMatch[1]
      const target = edgeMatch[5]
      const label = edgeMatch[4] || undefined
      const arrowType = edgeMatch[2]

      // Determine edge type
      let type: 'arrow' | 'line' | 'thick' | 'dotted' = 'arrow'
      if (arrowType.includes('==')) type = 'thick'
      if (arrowType.includes('.')) type = 'dotted'
      if (arrowType === '--') type = 'line'

      edges.push({
        source,
        target,
        label,
        type
      })

      // Ensure nodes exist
      if (!nodeMap.has(source)) {
        nodes.push({ id: source, label: source, shape: 'rect' })
        nodeMap.set(source, nodes[nodes.length - 1])
      }
      if (!nodeMap.has(target)) {
        nodes.push({ id: target, label: target, shape: 'rect' })
        nodeMap.set(target, nodes[nodes.length - 1])
      }
      continue
    }

    // Parse node definitions
    const nodeMatch = line.match(/^(\w+)(\{\{([^}]+)\}\}|\[\\\\([^\]]+)\/\]|\[\/([^\]]+)\\\]|\[\/([^\]]+)\/\]|\[\[\[([^\]]+)\]\]\]|\(\(\(([^)]+)\)\)\)|\[\[([^\]]+)\]\]|\(\(([^)]+)\)\)|\[\(([^\]]+)\)\]|\(\[([^\]]+)\]\)|\[([^\]]+)\]|\(([^)]+)\)|\{([^}]+)\})/)
    if (nodeMatch) {
      const id = nodeMatch[1]
      const fullMatch = nodeMatch[2]

      const label = nodeMatch[3] || nodeMatch[4] || nodeMatch[5] || nodeMatch[6] || nodeMatch[7] ||
        nodeMatch[8] || nodeMatch[9] || nodeMatch[10] || nodeMatch[11] || nodeMatch[12] ||
        nodeMatch[13] || nodeMatch[14] || nodeMatch[15] || id

      let shape: MermaidNode['shape'] = 'rect'
      if (fullMatch?.startsWith('{{')) shape = 'hexagon'
      else if (fullMatch?.startsWith('[\\')) shape = 'trapezoidAlt'
      else if (fullMatch?.startsWith('[/')) shape = 'trapezoid'
      else if (fullMatch?.startsWith('(((')) shape = 'doublecircle'
      else if (fullMatch?.startsWith('[[')) shape = 'subroutine'
      else if (fullMatch?.startsWith('((')) shape = 'stadium'
      else if (fullMatch?.startsWith('[(')) shape = 'circle'
      else if (fullMatch?.startsWith('([')) shape = 'cylinder'
      else if (fullMatch?.startsWith('(')) shape = 'rounded'
      else if (fullMatch?.startsWith('{')) shape = 'diamond'
      else if (fullMatch?.startsWith('[')) shape = 'rect'

      if (!nodeMap.has(id)) {
        const node: MermaidNode = { id, label, shape }
        nodes.push(node)
        nodeMap.set(id, node)
      } else {
        const existing = nodeMap.get(id)!
        existing.label = label
        existing.shape = shape
      }
    }
  }

  return {
    type,
    direction,
    nodes,
    edges,
    subgraphs: subgraphs.length > 0 ? subgraphs : undefined
  }
}
