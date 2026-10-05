import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { readFileSync } from "node:fs";
import { validateMermaidSyntax } from "./utils/mcpService.js";
import { restoreFlow } from './decision/flow'
import { stateUpdate } from './decision/exchange'

// We import the templates directly from Mermaider's codebase
import { MERMAID_TEMPLATES } from "./utils/mermaidTemplates.js";

const server = new Server(
  {
    name: "mermaider-mcp",
    version: JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version,
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
        inputSchema: z.toJSONSchema(z.object({
          type: z.string().describe("The ID of the diagram type (e.g., 'flowcharts', 'sequence', 'mindmap')"),
        })),
      },
      {
        name: "validate_mermaid_syntax",
        description: "Check only the Mermaid diagram entry keyword. This does not validate the diagram body; full syntax validation requires rendering in Mermaider.",
        inputSchema: z.toJSONSchema(z.object({
          code: z.string().describe("The Mermaid JS code to validate"),
        })),
      },
      {
        name: 'create_decision_state_update',
        description: 'Create a versioned update for a supplied decision session. The user reviews it in Mermaider before application; this tool does not change a running app.',
        inputSchema: z.toJSONSchema(z.object({session:z.record(z.string(),z.unknown()),state:z.string().min(1).max(12000),source:z.string().max(100).optional()})),
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'create_decision_state_update': {
      const args=z.object({session:z.record(z.string(),z.unknown()),state:z.string().min(1).max(12000),source:z.string().max(100).optional()}).parse(request.params.arguments)
      const session=restoreFlow(args.session)
      if(!session)throw new Error('Provide a valid decision session with its current ID and revision.')
      return {content:[{type:'text',text:JSON.stringify(stateUpdate(session,args.state,args.source),null,2)}]}
    }
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
      const args = z.object({ code: z.string() }).parse(request.params.arguments);
      const result = validateMermaidSyntax(args.code);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        isError: !result.valid,
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
