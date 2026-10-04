/**
 * In-app MCP Service for Mermaider
 * 
 * Provides the same capabilities as the standalone MCP server
 * but as direct function calls integrated into the AI workflow.
 * This runs in the browser — no child process or transport needed.
 */

import { MERMAID_TEMPLATES, DiagramTemplate } from './mermaidTemplates';

// ─── Valid Mermaid entry keywords ───────────────────────────────────────────────
const VALID_DIAGRAM_KEYWORDS = [
  'flowchart', 'graph', 'sequenceDiagram', 'classDiagram',
  'stateDiagram', 'stateDiagram-v2', 'erDiagram', 'gantt', 'pie',
  'requirementDiagram', 'gitGraph', 'C4Context', 'C4Container',
  'C4Component', 'C4Dynamic', 'C4Deployment',
  'mindmap', 'timeline', 'journey', 'quadrantChart',
  'sankey-beta', 'xychart-beta', 'block-beta',
] as const;

// ─── Tool: get_diagram_types ────────────────────────────────────────────────────
export interface DiagramTypeInfo {
  id: string;
  name: string;
  category: 'core' | 'advanced';
  description: string;
}

export function getDiagramTypes(): DiagramTypeInfo[] {
  return MERMAID_TEMPLATES.map(t => ({
    id: t.id,
    name: t.name,
    category: t.category,
    description: t.description,
  }));
}

// ─── Tool: get_diagram_template ─────────────────────────────────────────────────
export function getDiagramTemplate(typeId: string): DiagramTemplate | null {
  return MERMAID_TEMPLATES.find(t => t.id === typeId) || null;
}

// ─── Tool: validate_mermaid_syntax ──────────────────────────────────────────────
export interface ValidationResult {
  scope: 'entry_point';
  valid: boolean;
  detectedType: string | null;
  message: string;
}

export function validateMermaidSyntax(code: string): ValidationResult {
  if (!code || !code.trim()) {
    return { scope: 'entry_point', valid: false, detectedType: null, message: 'Empty code provided.' };
  }

  const trimmed = code.trim();

  // Strip config blocks before checking
  let codeBody = trimmed;
  // Remove YAML frontmatter
  codeBody = codeBody.replace(/^---\s*\n[\s\S]*?\n---\s*/, '');
  // Remove %%{init: ...}%%
  codeBody = codeBody.replace(/^%%\{init:[\s\S]*?\}%%\s*/m, '');

  const firstLine = codeBody.split(/\r?\n/).map(line => line.trim()).find(line => line && !line.startsWith('%%')) || '';
  const firstWord = firstLine.split(/[\s;]/)[0];

  const detectedKeyword = VALID_DIAGRAM_KEYWORDS.find(kw =>
    firstWord === kw
  );

  if (!detectedKeyword) {
    return {
      scope: 'entry_point',
      valid: false,
      detectedType: null,
      message: `Code does not start with a recognized Mermaid diagram keyword. Expected one of: ${VALID_DIAGRAM_KEYWORDS.slice(0, 8).join(', ')}...`
    };
  }

  return {
    scope: 'entry_point',
    valid: true,
    detectedType: detectedKeyword,
    message: `Mermaid entry point detected (full syntax must be checked by rendering): "${detectedKeyword}".`
  };
}

// ─── Detect diagram type from existing code ─────────────────────────────────────
export function detectDiagramType(code: string): string | null {
  const result = validateMermaidSyntax(code);
  return result.detectedType;
}

// ─── Build context string with diagram types for AI prompts ─────────────────────
export function buildDiagramTypesContext(): string {
  const types = getDiagramTypes();
  const coreTypes = types.filter(t => t.category === 'core');
  const advancedTypes = types.filter(t => t.category === 'advanced');

  let context = 'AVAILABLE MERMAID DIAGRAM TYPES:\n\n';
  context += 'Core Types:\n';
  coreTypes.forEach(t => {
    context += `  - ${t.name} (id: ${t.id}): ${t.description}\n`;
  });
  context += '\nAdvanced Types:\n';
  advancedTypes.forEach(t => {
    context += `  - ${t.name} (id: ${t.id}): ${t.description}\n`;
  });

  return context;
}

// ─── Build syntax reference for a specific diagram type ─────────────────────────
export function buildTemplateReference(typeId: string): string | null {
  const template = getDiagramTemplate(typeId);
  if (!template) return null;

  return `SYNTAX REFERENCE for ${template.name}:\n\`\`\`mermaid\n${template.code}\n\`\`\``;
}

// ─── Build syntax reference from detected code ─────────────────────────────────
export function buildTemplateReferenceFromCode(code: string): string | null {
  const detectedType = detectDiagramType(code);
  if (!detectedType) return null;

  // Map detected keyword to template id
  const keywordToId: Record<string, string> = {
    'flowchart': 'flowcharts',
    'graph': 'flowcharts',
    'sequenceDiagram': 'sequence',
    'classDiagram': 'class',
    'stateDiagram': 'state',
    'stateDiagram-v2': 'state',
    'erDiagram': 'er',
    'gantt': 'gantt',
    'pie': 'pie',
    'requirementDiagram': 'requirement',
    'gitGraph': 'gitgraph',
    'C4Context': 'c4',
    'C4Container': 'c4',
    'C4Component': 'c4',
    'C4Dynamic': 'c4',
    'C4Deployment': 'c4',
    'mindmap': 'mindmap',
    'timeline': 'timeline',
    'journey': 'userjourney',
    'quadrantChart': 'quadrant',
    'sankey-beta': 'sankey',
    'xychart-beta': 'xychart',
    'block-beta': 'block',
  };

  const templateId = keywordToId[detectedType];
  if (!templateId) return null;

  return buildTemplateReference(templateId);
}

// ─── Post-generation validation & auto-fix ──────────────────────────────────────
export function validateAndSuggestFix(generatedCode: string): {
  code: string;
  wasFixed: boolean;
  fixDescription: string | null;
} {
  const validation = validateMermaidSyntax(generatedCode);

  if (validation.valid) {
    return { code: generatedCode, wasFixed: false, fixDescription: null };
  }

  // Try basic auto-fixes
  let fixed = generatedCode.trim();

  // Fix 1: If code starts with "graph" but should be "flowchart"
  if (fixed.startsWith('graph ')) {
    fixed = fixed.replace(/^graph\s+/, 'flowchart ');
    const recheck = validateMermaidSyntax(fixed);
    if (recheck.valid) {
      return { code: fixed, wasFixed: true, fixDescription: 'Replaced deprecated "graph" keyword with "flowchart".' };
    }
  }

  // Fix 2: If the code is wrapped in markdown fences
  const fenceMatch = fixed.match(/```(?:mermaid)?\s*\n([\s\S]*?)```/);
  if (fenceMatch) {
    fixed = fenceMatch[1].trim();
    const recheck = validateMermaidSyntax(fixed);
    if (recheck.valid) {
      return { code: fixed, wasFixed: true, fixDescription: 'Stripped markdown code fences.' };
    }
  }

  // Could not auto-fix
  return { code: generatedCode, wasFixed: false, fixDescription: null };
}

// ─── Build full MCP-enhanced system prompt supplement ────────────────────────────
export function buildMCPSystemPromptSupplement(currentCode?: string): string {
  let supplement = '\n\n--- MCP DIAGRAM CONTEXT ---\n';
  supplement += buildDiagramTypesContext();

  if (currentCode) {
    const templateRef = buildTemplateReferenceFromCode(currentCode);
    if (templateRef) {
      supplement += '\n' + templateRef + '\n';
    }
  }

  supplement += '\nUse the above diagram types and syntax references to produce correct Mermaid output.\n';
  supplement += '--- END MCP CONTEXT ---\n';

  return supplement;
}
