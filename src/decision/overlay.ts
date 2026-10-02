import type { flowPath } from './flow'
export function applyDecisionOverlay(container:HTMLElement, highlights:ReturnType<typeof flowPath>|undefined):()=>void {
  const undo:(()=>void)[]=[]
  const style=(element:SVGElement,values:Partial<CSSStyleDeclaration>)=>{
    for(const [key,value] of Object.entries(values)){
      const property=key as 'opacity'|'strokeWidth'|'fontWeight'|'stroke'|'color'|'fill';const previous=element.style[property]
      element.style[property]=value as string;undo.push(()=>{element.style[property]=previous})
    }
  }
  if(!highlights)return()=>{}
  const ink=getComputedStyle(container).getPropertyValue('--ink').trim()||'#eeeeee'
  for(const node of container.querySelectorAll<SVGElement>('.node')){
    const id=node.id.replace(/^flowchart-/,'').replace(/-\d+$/,'')
    const active=highlights.questions.includes(id)||highlights.options.includes(id)
    style(node,{opacity:active?'1':'0.4'})
    for(const label of node.querySelectorAll<SVGElement>('.label, .nodeLabel, p, text, tspan'))style(label,{color:ink,fill:ink})
    if(highlights.options.includes(id)||id===highlights.pending){
      for(const shape of node.querySelectorAll<SVGElement>('rect, polygon, ellipse, path'))style(shape,{strokeWidth:'4px',stroke:ink})
      for(const label of node.querySelectorAll<SVGElement>('.label'))style(label,{fontWeight:'bold'})
    }
  }
  for(const edge of container.querySelectorAll<SVGElement>('path.flowchart-link')){
    if(highlights.edges.some(([from,to])=>edge.id.startsWith(`L-${from}-${to}-`)))style(edge,{strokeWidth:'4px',opacity:'1',stroke:ink})
    else style(edge,{opacity:'0.4'})
  }
  return()=>{for(const restore of undo)restore()}
}
