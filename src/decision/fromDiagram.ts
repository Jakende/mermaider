import {parseMermaidFlowchart} from '../utils/mermaidParser'
import type {FlowQuestion} from './flow'
/** Explicit opt-in conversion of one supported branching node; never rewrites source. */
export function questionFromDiagram(code:string,nodeId:string):FlowQuestion|undefined {
  const diagram=parseMermaidFlowchart(code)
  const node=diagram?.nodes.find(item=>item.id===nodeId)
  const edges=diagram?.edges.filter(item=>item.source===nodeId)
  if(!node||!edges||edges.length<2||edges.length>12)return undefined
  return {id:`q_${node.id.replace(/[^A-Za-z0-9_]/g,'_').slice(0,44)}`,text:node.label.slice(0,1000),options:edges.map((edge,index)=>{
    const target=diagram!.nodes.find(item=>item.id===edge.target)?.label||edge.target
    return {id:`a_${index}`,label:(edge.label?`${edge.label} · ${target}`:target).slice(0,300),nextId:undefined}
  })}
}
