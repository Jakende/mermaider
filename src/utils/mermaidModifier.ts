
export class MermaidModifier {
  /**
   * Updates the label of a node in the Mermaid code.
   * Preserves formatting by using regex replacement on the original code.
   */
  static updateNodeLabel(code: string, nodeId: string, newLabel: string): string {
    const lines = code.split('\n');
    let updated = false;

    // Helper to escape regex special characters
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    const newNodeLabel = newLabel.replace(/"/g, "'"); // minimal sanitization

    // Iterate through lines to find the definition line
    const newLines = lines.map(line => {
      if (updated) return line;

      // We are looking for lines like: nodeId[label] or nodeId(label)
      // The nodeId must match exactly.
      // We check if the line starts with the nodeId and is followed by one of the opening brackets

      const brackets = [
        ['[[', ']]'], // subroutine
        ['[(', ')]'], // cylinder
        ['((', '))'], // stadium/circle
        ['([', '])'], // stadium/pill
        ['{{', '}}'], // hexagon
        ['[/', '/]'], // parallelogram
        ['[\\', '\\]'], // trapezoidAlt
        ['[/', '\\]'], // trapezoid
        ['[', ']'],   // rect
        ['(', ')'],   // rounded
        ['{', '}'],   // diamond
        ['>', ']'],   // asymmetric
      ];

      for (const [open, close] of brackets) {
        // Construct regex: ^(\s*nodeId\s*open)(.*?)(close\s*)$
        // We match non-greedy .*? for the label content
        const regex = new RegExp(`^(\\s*${escapeRegExp(nodeId)}\\s*${escapeRegExp(open)})(.*?)(${escapeRegExp(close)}\\s*.*)$`);

        if (regex.test(line)) {
          updated = true;
          // Replace only the label part
          return line.replace(regex, `$1${newNodeLabel}$3`);
        }
      }
      return line;
    });

    if (!updated) {
      // If we didn't find a definition with brackets, it might be defined via connections only like A --> B
      // In this case, we prefer to ADD a definition line at the end rather than mess with the connection line.
      // Append: nodeId[newLabel]
      // Try to determine shape? Default to [].
      return code.trimEnd() + `\n    ${nodeId}[${newNodeLabel}]`;
    }

    return newLines.join('\n');
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
      if (trimmed.startsWith(`style ${nodeId}`)) {
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
    const lines = code.split('\n');
    const s = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const t = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Matches patterns like:
    // A --> B
    // A-->B
    // A---|label|B
    // A ==label==> B
    // A-.->B;
    // We look for source, then an arrow part, then target.
    // The arrow part starts with -, =, or . and usually ends with > or - or a label.

    const edgePattern = new RegExp(`^\\s*${s}\\s*([-=.]+.*)\\s+${t}(\\s|;|$)`);

    const newLines = lines.filter(line => {
      const trimmed = line.trim();
      // Check if the line matches the edge pattern
      // We handle A --> B and variations
      return !edgePattern.test(trimmed);
    });

    return newLines.join('\n');
  }

  static deleteNode(code: string, nodeId: string): string {
    const lines = code.split('\n');
    const s = nodeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const nodeDefRegex = new RegExp(`^\\s*${s}\\s*([\\[\\(\\{\\>].*|$)`);
    const styleRegex = new RegExp(`^\\s*style\\s+${s}(\\s|$)`);

    const newLines = lines.filter(line => {
      const trimmed = line.trim();
      return !nodeDefRegex.test(trimmed) && !styleRegex.test(trimmed);
    });

    return newLines.join('\n');
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
