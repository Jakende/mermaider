import { useEffect, useRef } from 'react'
interface Props { width:number; min:number; max:number; onResize:(width:number)=>void }

/** Captured pointers also support touch/pen and keep dragging outside the handle. */
export default function DecisionResizeHandle({width,min,max,onResize}:Props) {
  const drag=useRef<{x:number;width:number;cursor:string;selection:string}|null>(null)
  const finish=()=>{
    if(!drag.current)return
    document.body.style.cursor=drag.current.cursor
    document.body.style.userSelect=drag.current.selection
    drag.current=null
  }
  useEffect(()=>finish,[])
  return <div className="decision-resize-handle" role="separator" tabIndex={0}
    aria-label="Resize decision panel" aria-orientation="vertical"
    aria-valuemin={Math.round(min)} aria-valuemax={Math.round(max)} aria-valuenow={Math.round(width)}
    aria-valuetext={`${Math.round(width)} pixels`} aria-controls="decision-workspace"
    onPointerDown={event=>{
      if(event.button!==0)return
      event.preventDefault();event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId)
      drag.current={x:event.clientX,width,cursor:document.body.style.cursor,selection:document.body.style.userSelect}
      document.body.style.cursor='col-resize';document.body.style.userSelect='none'
    }}
    onPointerMove={event=>{if(drag.current)onResize(drag.current.width+drag.current.x-event.clientX)}}
    onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
    onDoubleClick={()=>onResize(380)}
    onKeyDown={event=>{
      const next=event.key==='ArrowLeft'?width+20:event.key==='ArrowRight'?width-20:event.key==='Home'?min:event.key==='End'?max:undefined
      if(next!==undefined){event.preventDefault();onResize(next)}
    }} />
}
