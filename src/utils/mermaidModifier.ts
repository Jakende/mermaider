import { readMermaidNode, parseMermaidFlowchart, flowchartStatements, type MermaidNode } from './mermaidParser'


export class MermaidModifier {
  /**
   * Updates the label of a node in the Mermaid code.
   * Preserves formatting by using regex replacement on the original code.
   */
  static updateNodeLabel(code: string, nodeId: string, newLabel: string): string {
    const escapedId = nodeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(^|[\\s>;])${escapedId}(?=\\s*[\\[({])`, 'gm')
    const replacements: Array<{ start: number; end: number }> = []
    let scan = 0, depth = 0, quoted = false, pipeLabel = false, comment = false
    for (const match of code.matchAll(pattern)) {
      const offset = match.index! + match[1].length
      for (; scan < offset; scan++) {
        const c = code[scan]
        if (c === '\n') comment = false
        if (!quoted && c === '%' && code[scan + 1] === '%') comment = true
        if (comment) continue
        if (c === '"' && code[scan - 1] !== '\\') quoted = !quoted
        if (!quoted && c === '|') pipeLabel = !pipeLabel
        if (!quoted && !pipeLabel && '[({'.includes(c)) depth++
        if (!quoted && !pipeLabel && '])}'.includes(c)) depth--
      }
      if (quoted || pipeLabel || comment || depth !== 0) continue
      const token = readMermaidNode(code, offset)
      if (token?.labelStart !== undefined && token.labelEnd !== undefined) {
        replacements.push({ start: token.labelStart, end: token.labelEnd })
      }
    }
    const label = `"${newLabel.replace(/&/g, '&amp;').replace(/"/g, '#quot;').replace(/\n/g, '<br/>')}"`
    let result = code
    for (const range of replacements.reverse()) result = result.slice(0, range.start) + label + result.slice(range.end)
    return replacements.length ? result : code.trimEnd() + `\n    ${nodeId}[${label}]`
  }

  static addEdge(code: string, source: string, target: string, label: string = '', type: string = 'arrow'): string {
    let arrow = '-->';
    if (type === 'thick') arrow = '==>';
    if (type === 'dotted') arrow = '-.->';
    if (type === 'line') arrow = '---';

    const cleanLabel = label.replace(/"/g, "'");
    const edgeStr = cleanLabel ? `    ${source} ${arrow}|${cleanLabel}| ${target}` : `    ${source} ${arrow} ${target}`;
    return code.trimEnd() + '\n' + edgeStr;
  }

  static updateNodeStyle(code: string, nodeId: string, styleObj: { fill?: string, stroke?: string, color?: string }): string {
    // Mermaid style: style nodeId key:value,key:value
    // We update or append style definitions.

    // 1. Check if there's an existing style line for this node
    const lines = code.split('\n');
    let found = false;

    // Simple parser for style string: "fill:#f9f,stroke:#333,stroke-width:4px"
    const parseStyleString = (str: string) => {
      const styles: Record<string, string> = {};
      str.split(',').forEach(part => {
        const [k, v] = part.split(':');
        if (k && v) styles[k.trim()] = v.trim();
      });
      return styles;
    };

    const stringifyStyle = (styles: Record<string, string>) => {
      return Object.entries(styles).map(([k, v]) => `${k}:${v}`).join(',');
    };

    const newLines = lines.map(line => {
      const trimmed = line.trim();
      if (new RegExp(`^style\\s+${nodeId}\\s`).test(trimmed)) {
        found = true;
        // Extract existing styles
        // format: style nodeId styleString
        const match = trimmed.match(/^style\s+\S+\s+(.*)$/);
        if (match) {
          const existingStyles = parseStyleString(match[1]);
          // Merge new styles
          if (styleObj.fill) existingStyles.fill = styleObj.fill;
          if (styleObj.stroke) existingStyles.stroke = styleObj.stroke;
          if (styleObj.color) existingStyles.color = styleObj.color;

          return `style ${nodeId} ${stringifyStyle(existingStyles)}`;
        }
      }
      return line;
    });

    if (found) {
      return newLines.join('\n');
    } else {
      // Append new style line
      const styles: Record<string, string> = {};
      if (styleObj.fill) styles.fill = styleObj.fill;
      if (styleObj.stroke) styles.stroke = styleObj.stroke;
      if (styleObj.color) styles.color = styleObj.color; // text color usually

      return code.trimEnd() + `\n    style ${nodeId} ${stringifyStyle(styles)}`;
    }
  }

  static deleteEdge(code: string, source: string, target: string): string {
    return this.removeGraphElements(code, undefined, { source, target })
  }

  static deleteNode(code: string, nodeId: string): string {
    return this.removeGraphElements(code, nodeId)
  }

  private static removeGraphElements(code: string, nodeId?: string, edge?: { source: string; target: string }): string {
    const shapeDelimiters: Record<MermaidNode['shape'], [string, string]> = {
      rect: ['[', ']'], rounded: ['(', ')'], stadium: ['([', '])'],
      subroutine: ['[[', ']]'], cylinder: ['[(', ')]'], circle: ['((', '))'],
      doublecircle: ['(((', ')))'], diamond: ['{', '}'], hexagon: ['{{', '}}'],
      parallelogram: ['[/', '/]'], trapezoid: ['[/', '\\]'], trapezoidAlt: ['[\\', '/]'], rhombus: ['{', '}'],
    }
    const declaration = code.match(/^(?:graph|flowchart)\s+(?:TD|TB|BT|LR|RL|DT)\b/m)
    if (!declaration) return code
    const prefix = code.slice(0, declaration.index)
    let changed = false
    const replacement = flowchartStatements(code).flatMap(statement => {
        if (nodeId && new RegExp(`^style\\s+${nodeId}\\s`).test(statement)) { changed = true; return [] }
        const diagram = parseMermaidFlowchart(`graph TD\n${statement}`)
        if (!diagram) return [statement]
        const affected = nodeId ? diagram.nodes.some(node => node.id === nodeId)
          : diagram.edges.some(item => item.source === edge!.source && item.target === edge!.target)
        if (!affected) return [statement]
        changed = true
        const nodes = diagram.nodes.filter(node => node.id !== nodeId).map(node => {
          const [open, close] = shapeDelimiters[node.shape]
          const label = node.label.replace(/"/g, '#quot;')
          return `${node.id}${open}"${label}"${close}${node.class ? `:::${node.class}` : ''}`
        })
        const edges = diagram.edges.filter(item => nodeId ? item.source !== nodeId && item.target !== nodeId
          : item.source !== edge!.source || item.target !== edge!.target).map(item => {
          const arrow = { arrow: '-->', line: '---', thick: '==>', dotted: '-.->' }[item.type]
          return `${item.source} ${arrow}${item.label ? `|${item.label}|` : ''} ${item.target}`
        })
        return [...nodes, ...edges]
    })
    return changed ? prefix + replacement.join('\n') : code
  }

  static stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '');
  }

  static setDirection(code: string, direction: 'TD' | 'BT' | 'LR' | 'RL'): string {
    // 1. Normalize diagram type to flowchart and set direction
    let updated = code.replace(/([ \t]*(flowchart|graph)\s+)(TD|BT|LR|RL|TB|DT)/i, `flowchart ${direction}`);

    // 2. Ensure diagram content uses tabs for indentation
    return this.normalizeIndentation(updated);
  }

  static normalizeIndentation(code: string): string {
    const lines = code.split('\n');
    let inDiagram = false;

    return lines.map(line => {
      const trimmed = line.trim();

      // Check if we are at the diagram declaration line
      if (/^flowchart\s+(TD|BT|LR|RL)/i.test(trimmed)) {
        inDiagram = true;
        return trimmed; // The declaration line itself should not be indented
      }

      // If we are inside the diagram and it's not a config line or an empty line
      if (inDiagram && trimmed && !trimmed.startsWith('---') && !trimmed.startsWith('config:')) {
        // Enforce tab indentation
        return `\t${trimmed}`;
      }

      return line;
    }).join('\n');
  }
}
