import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// We import the templates directly from Mermaider's codebase
import { MERMAID_TEMPLATES } from "./utils/mermaidTemplates.js";

const server = new Server(
  {
    name: "mermaider-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const DiagramTemplateSchema = z.object({
  type: z.string().describe("The ID of the diagram type to get a template for (e.g. 'flowcharts', 'mindmap', 'c4')"),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_diagram_types",
        description: "Get a list of all supported Mermaid diagram types managed by Mermaider. Use this to understand what diagrams you can generate.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_diagram_template",
        description: "Get a starting Mermaid code template for a specific diagram type. This uses Mermaider's curated templates.",
        inputSchema: z.object({
          type: z.string().describe("The ID of the diagram type (e.g., 'flowcharts', 'sequence', 'mindmap')"),
        }).passthrough(),
      },
      {
        name: "validate_mermaid_syntax",
        description: "Validate mermaid syntax. Note: This assumes standard mermaid compiler logic. Returns success or error.",
        inputSchema: z.object({
          code: z.string().describe("The Mermaid JS code to validate"),
        }).passthrough(),
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "get_diagram_types": {
      const types = MERMAID_TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        description: t.description,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(types, null, 2) }],
      };
    }

    case "get_diagram_template": {
      const parsedParams = DiagramTemplateSchema.safeParse(request.params.arguments);
      if (!parsedParams.success) {
        throw new Error(`Invalid arguments for get_diagram_template: ${parsedParams.error}`);
      }
      const requestedType = parsedParams.data.type;
      const template = MERMAID_TEMPLATES.find((t) => t.id === requestedType);
      
      if (!template) {
        throw new Error(`Diagram type '${requestedType}' not found. Use get_diagram_types to see available types.`);
      }

      return {
        content: [{ 
            type: "text", 
            text: `Template for ${template.name} (${template.category}):\n\n${template.code}`
        }],
      };
    }

    case "validate_mermaid_syntax": {
      // Basic validation wrapper. Full rendering validation requires browser or headless environment,
      // but we can provide a basic syntax structure check if needed, or simply let the user render it 
      // in the Mermaider UI.
      const code = request.params.arguments?.code as string;
      if (!code) {
        throw new Error("Missing code argument");
      }
      
      // Split properly with \r?\n or fallback to escaped \n
      let codeStr = code.trim();
      let lines = codeStr.split(/\r?\n/);
      if (lines.length === 1 && codeStr.includes('\\n')) {
        lines = codeStr.split('\\n');
      }

      // Remove YAML Frontmatter
      let cleanLines = [...lines];
      if (cleanLines[0] && cleanLines[0].trim() === '---') {
        let closingIndex = -1;
        for (let i = 1; i < cleanLines.length; i++) {
          if (cleanLines[i].trim() === '---') {
            closingIndex = i;
            break;
          }
        }
        if (closingIndex !== -1) {
          cleanLines = cleanLines.slice(closingIndex + 1);
        }
      }

      // Filter empty lines and comments
      const contentLines = cleanLines
        .map(l => l.trim())
        .filter(l => l !== '' && !l.startsWith('%%'));

      const validStarts = [
        'flowchart', 'graph', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 
        'erDiagram', 'gantt', 'pie', 'requirementDiagram', 'gitGraph', 
        'C4Context', 'mindmap', 'timeline', 'journey', 'quadrantChart', 
        'sankey', 'xychart', 'block'
      ];

      let isValidStart = false;
      let detectedKeyword = '';

      if (contentLines.length > 0) {
        const firstLine = contentLines[0];
        const firstWord = firstLine.split(/\s+/)[0];
        isValidStart = validStarts.some(start => {
          if (firstWord.startsWith(start)) {
            detectedKeyword = start;
            return true;
          }
          return false;
        });

        // Fallback: search in subsequent lines if first line is metadata or something else
        if (!isValidStart) {
          for (const line of contentLines) {
            const word = line.split(/\s+/)[0];
            const found = validStarts.find(start => word.startsWith(start));
            if (found) {
              isValidStart = true;
              detectedKeyword = found;
              break;
            }
          }
        }
      }

      if (!isValidStart) {
        return {
          content: [{
            type: "text",
            text: `Validierung fehlgeschlagen: Der Code beginnt nicht mit einem erkannten Mermaid-Diagramm-Schlüsselwort (z. B. ${validStarts.slice(0, 5).join(', ')}...).`
          }],
          isError: true,
        };
      }

      return {
        content: [{
          type: "text",
          text: `Validierung erfolgreich: Gültiges Mermaid-Diagramm-Schlüsselwort '${detectedKeyword}' gefunden.`
        }]
      };
    }

    default:
      throw new Error("Tool not found");
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Mermaider MCP server running on stdio");
}

run().catch((error) => {
  console.error("Fatal error running MCP server:", error);
  process.exit(1);
});
