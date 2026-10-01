import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

test('MCP stdio exposes JSON schemas and reports entry-point validation honestly', async () => {
  const client = new Client({name:'release-check',version:'1.0.0'})
  const transport = new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/mcp-server.ts'],stderr:'pipe'})
  try {
    await client.connect(transport)
    const {tools}=await client.listTools()
    const template=tools.find(tool=>tool.name==='get_diagram_template')!
    assert.equal(template.inputSchema.type,'object')
    assert.deepEqual(template.inputSchema.required,['type'])
    assert.equal((template.inputSchema.properties?.type as any).type,'string')
    const valid=await client.callTool({name:'validate_mermaid_syntax',arguments:{code:'stateDiagram-v2\n[*] --> Ready'}})
    const result=JSON.parse((valid.content as any)[0].text)
    assert.equal(result.detectedType,'stateDiagram-v2'); assert.equal(result.scope,'entry_point')
    const invalid=await client.callTool({name:'validate_mermaid_syntax',arguments:{code:'graphical TD'}})
    assert.equal(invalid.isError,true)
    const starter=await client.callTool({name:'get_diagram_template',arguments:{type:'flowcharts'}})
    assert.match((starter.content as any)[0].text,/graph|flowchart/)
  } finally { await client.close() }
})
