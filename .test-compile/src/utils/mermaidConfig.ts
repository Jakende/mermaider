export interface MermaidConfig {
    theme?: string;
    look?: 'classic' | 'handDrawn';
    layout?: string;
    flowchart?: {
        curve?: 'linear' | 'basis' | 'cardinal' | 'step' | 'monotoneX' | 'monotoneY';
        htmlLabels?: boolean;
        useMaxWidth?: boolean;
        defaultRenderer?: string;
        nodeSpacing?: number;
        rankSpacing?: number;
        padding?: number;
    };
    direction?: 'TD' | 'BT' | 'LR' | 'RL'; // Virtual field for UI
    sequence?: {
        mirrorActors?: boolean;
        bottomMarginAdj?: number;
    };
}

/**
 * Parses the configuration block from a mermaid code string.
 * Supports both:
 * 1. %%{init: {...}}%% (Old format)
 * 2. --- config: {...} --- (YAML-ish format)
 */
export function parseInitBlock(code: string): { config: MermaidConfig | null; remainingCode: string; fullMatch: string | null; type: 'init' | 'yaml' | null } {
    const trimmed = code.trim();

    // Try parsing YAML frontmatter first
    const yamlRegex = /^---\s*config:\s*([\s\S]*?)\s*---/;
    const yamlMatch = trimmed.match(yamlRegex);

    if (yamlMatch) {
        try {
            const yamlContent = yamlMatch[1];
            const parsed = parseSimpleYaml(yamlContent);
            // Mermaid YAML frontmatter usually has a top-level 'config' key
            const config = parsed.config || parsed;
            return {
                config,
                remainingCode: trimmed.replace(yamlMatch[0], '').trim(),
                fullMatch: yamlMatch[0],
                type: 'yaml'
            };
        } catch (e) {
            console.error('Failed to parse Mermaid YAML config', e);
        }
    }

    // Try parsing %%{init: ...}%%
    const initRegex = /^%%\{init:\s*(\{[\s\S]*?\})\s*\}%%/;
    const initMatch = trimmed.match(initRegex);

    if (initMatch) {
        try {
            const config = JSON.parse(initMatch[1]);
            return {
                config,
                remainingCode: trimmed.replace(initMatch[0], '').trim(),
                fullMatch: initMatch[0],
                type: 'init'
            };
        } catch (e) {
            console.error('Failed to parse Mermaid init block', e);
        }
    }

    return { config: null, remainingCode: code, fullMatch: null, type: null };
}

/**
 * Crude YAML parser for the nested structure we use
 */
function parseSimpleYaml(yaml: string): any {
    const lines = yaml.split('\n');
    const result: any = {};
    let currentObj = result;
    let stack: { obj: any, indent: number }[] = [{ obj: result, indent: -1 }];

    for (const line of lines) {
        const match = line.match(/^(\s*)([a-zA-Z0-9]+):\s*(.*)$/);
        if (match) {
            const indent = match[1].length;
            const key = match[2];
            const value = match[3].trim();

            while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
                stack.pop();
            }

            currentObj = stack[stack.length - 1].obj;

            if (value === '') {
                currentObj[key] = {};
                stack.push({ obj: currentObj[key], indent });
            } else {
                // Handle booleans and numbers
                if (value === 'true') currentObj[key] = true;
                else if (value === 'false') currentObj[key] = false;
                else if (!isNaN(Number(value))) currentObj[key] = Number(value);
                else currentObj[key] = value.replace(/^["']|["']$/g, '');
            }
        }
    }
    return result;
}

/**
 * Converts a JS object to a YAML-like string with indentation
 */
function toSimpleYaml(obj: any, indent = 0): string {
    let yaml = '';
    const spaces = ' '.repeat(indent);

    for (const key in obj) {
        const value = obj[key];
        if (value === undefined || value === null) continue;

        if (typeof value === 'object' && !Array.isArray(value)) {
            yaml += `${spaces}${key}:\n${toSimpleYaml(value, indent + 2)}`;
        } else {
            // Force quotes for strings to be safe with Mermaid's YAML parser
            if (typeof value === 'string') {
                yaml += `${spaces}${key}: "${value}"\n`;
            } else {
                yaml += `${spaces}${key}: ${value}\n`;
            }
        }
    }
    return yaml;
}

/**
 * Updates or adds a config block to the mermaid code in YAML format.
 */
export function updateInitBlock(code: string, newConfig: MermaidConfig): string {
    const { config, remainingCode } = parseInitBlock(code);

    // Deep merge function to avoid duplicates and handle nested objects
    const merge = (target: any, source: any) => {
        for (const key in source) {
            if (source[key] instanceof Object && key in target) {
                Object.assign(source[key], merge(target[key], source[key]));
            }
        }
        Object.assign(target || {}, source);
        return target;
    };

    const mergedConfig = config ? merge({ ...config }, newConfig) : newConfig;

    // Basic normalization
    if (mergedConfig.layout === 'elk') {
        if (!mergedConfig.flowchart) mergedConfig.flowchart = {};
        mergedConfig.flowchart.defaultRenderer = 'elk';
        delete mergedConfig.layout;
    }

    // Remove keys with undefined values
    const cleanConfig = (obj: any) => {
        Object.keys(obj).forEach(key => {
            if (obj[key] === undefined) delete obj[key];
            else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) cleanConfig(obj[key]);
        });
    };
    cleanConfig(mergedConfig);

    // Generate the YAML frontmatter
    const yamlConfig = `---\nconfig:\n${toSimpleYaml(mergedConfig, 2)}---`;

    // Clean up remaining code: remove leading/trailing extra newlines
    // and ensure it starts with the diagram type
    const cleanedDiagram = remainingCode.trim();

    // Enforce ONE blank line between config and diagram
    return `${yamlConfig}\n\n${cleanedDiagram}`;
}
