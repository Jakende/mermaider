import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseMermaidFlowchart, readMermaidNode } from '../src/utils/mermaidParser'
import { validateMermaidSyntax } from '../src/utils/mcpService'
import { queueMermaidRender } from '../src/utils/renderQueue'
import { restoreWorkspace } from '../src/utils/workspaceStorage'
import { MermaidModifier } from '../src/utils/mermaidModifier'

test('inline nodes, quoted labels and chained labeled edges retain topology', () => {
  const diagram = parseMermaidFlowchart('graph TD; A["Start; now"] --> B{"Choose [option]"} -->|Yes| C([Finish])')!
  assert.deepEqual(diagram.nodes.map(n => [n.id, n.label, n.shape]), [['A','Start; now','rect'],['B','Choose [option]','diamond'],['C','Finish','stadium']])
  assert.deepEqual(diagram.edges.map(e => [e.source,e.target,e.label]), [['A','B',undefined],['B','C','Yes']])
})
for (const [source, shape] of [['A((Circle))','circle'],['A(((Double)))','doublecircle'],['A[(Data)]','cylinder'],['A([End])','stadium'],['A[[Sub]]','subroutine'],['A{{Hex}}','hexagon']] as const) {
  test(`shape ${shape} survives parsing`, () => assert.equal(readMermaidNode(source)?.node.shape,shape))
}
test('subgraphs, comments, styles and repeated node references survive', () => {
  const d = parseMermaidFlowchart('%% comment\nflowchart LR\nsubgraph group [Team]\nA[First] --> B\nend\nB --> A\nstyle A fill:red')!
  assert.equal(d.nodes.length,2); assert.equal(d.nodes[0].label,'First'); assert.equal(d.nodes[0].style,'fill:red')
  assert.deepEqual(d.subgraphs?.[0].nodes,['A','B'])
})
test('unsupported fanout and diagram types disable visual editing', () => {
  assert.equal(parseMermaidFlowchart('graph TD\nA & B --> C'),null)
  assert.equal(parseMermaidFlowchart('sequenceDiagram\nAlice->>Bob: hi'),null)
})
test('entry checks accept exact keywords only, with comments and config', () => {
  assert.equal(validateMermaidSyntax('stateDiagram-v2\n[*] --> Ready').detectedType,'stateDiagram-v2')
  assert.equal(validateMermaidSyntax('%% hello\nsequenceDiagram').valid,true)
  assert.equal(validateMermaidSyntax('---\ntitle: Hi\n---\ngraph TD').valid,true)
  for (const code of ['graphical TD','flowchartInvalid TD','junk\ngraph TD','']) assert.equal(validateMermaidSyntax(code).valid,false)
  assert.equal(validateMermaidSyntax('graph TD\nA[broken').scope,'entry_point')
})
test('render operations serialize and recover after a rejected render', async () => {
  const order: number[] = []
  const a=queueMermaidRender(async () => {order.push(1); await new Promise(r=>setTimeout(r,10)); order.push(2); throw Error('invalid')})
  const b=queueMermaidRender(async () => {order.push(3)})
  await assert.rejects(a); await b; assert.deepEqual(order,[1,2,3])
})
test('workspace restores legacy history and selects a real tab/session', () => {
  const values: Record<string,string> = {'mermaider-tabs':JSON.stringify([{id:'saved',name:'saved',code:'graph TD',chatHistory:[{role:'user',content:'keep'}]}]),'mermaider-active-tab':'missing'}
  const restored=restoreWorkspace({getItem:key=>values[key]??null},[])
  assert.equal(restored.activeTabId,'saved'); assert.equal(restored.tabs[0].chatSessions[0].messages[0].content,'keep')
  assert.equal(restored.tabs[0].activeChatSessionId,'initial-session-saved')
})
test('renaming an inline target preserves its diamond shape and literal dollar signs', () => {
  const code=MermaidModifier.updateNodeLabel('graph TD\nA[Start] --> B{Old}','B','New $1 [choice]')
  const node=parseMermaidFlowchart(code)?.nodes.find(n=>n.id==='B')
  assert.equal(node?.shape,'diamond'); assert.equal(node?.label,'New $1 [choice]')
})

test('deleting a chain edge retains inline endpoint labels and other edges', () => {
  const d=parseMermaidFlowchart(MermaidModifier.deleteEdge('graph TD\nA[Start] --> B{Choice} --> C([Done])','A','B'))!
  assert.deepEqual(d.edges.map(e=>[e.source,e.target]),[['B','C']])
  assert.equal(d.nodes.find(n=>n.id==='B')?.shape,'diamond')
  assert.equal(d.nodes.find(n=>n.id==='A')?.label,'Start')
})
test('deleting an inline node removes incoming/outgoing edges without losing other nodes', () => {
  const d=parseMermaidFlowchart(MermaidModifier.deleteNode('graph TD\nA[Start] --> B{Choice} --> C([Done])\nC --> D[Keep]\nstyle B fill:red','B'))!
  assert.deepEqual(d.nodes.map(n=>n.id),['A','C','D'])
  assert.deepEqual(d.edges.map(e=>[e.source,e.target]),[['C','D']])
})

test('deleting an edge in a semicolon diagram preserves frontmatter and multiline labels', () => {
  const source='---\ntitle: Keep\n---\ngraph TD; A["Start\nnow"] --> B{Choice}; B --> C'
  const updated=MermaidModifier.deleteEdge(source,'A','B')
  assert.ok(updated.startsWith('---\ntitle: Keep\n---\n'))
  const d=parseMermaidFlowchart(updated)!
  assert.equal(d.nodes[0].label,'Start\nnow')
  assert.deepEqual(d.edges.map(e=>[e.source,e.target]),[['B','C']])
})

test('renaming does not modify labels or comments that mention node syntax', () => {
  const code='graph TD\nA["Mention B{fake}"] -->|B{edge}| B{Real}\n%% B{comment}'
  const updated=MermaidModifier.updateNodeLabel(code,'B','Changed')
  assert.ok(updated.includes('Mention B{fake}')); assert.ok(updated.includes('|B{edge}|'))
  assert.ok(updated.includes('%% B{comment}')); assert.ok(updated.includes('B{"Changed"}'))
})
