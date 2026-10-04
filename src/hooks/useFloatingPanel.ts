import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

/** Captured pointers work with mouse, touch and pen; clamping keeps headers reachable. */
export function useFloatingPanel<T extends HTMLElement = HTMLDivElement>(enabled: boolean, initial = { x: 20, y: 64 }) {
  const panelRef = useRef<T>(null)
  const [position, setPosition] = useState(initial)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const clamp = (x: number, y: number) => {
    const rect = panelRef.current?.getBoundingClientRect()
    const viewport = window.visualViewport
    const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0
    const width = viewport?.width || window.innerWidth, height = viewport?.height || window.innerHeight
    return { x: Math.max(left, Math.min(x, left + Math.max(0, width - (rect?.width || 320)))), y: Math.max(top + 56, Math.min(y, top + Math.max(56, height - Math.min(rect?.height || 400, height - 56)))) }
  }
  useEffect(() => {
    if (!enabled) return
    const keepVisible = () => setPosition(old => clamp(old.x, old.y))
    keepVisible()
    const observer = new ResizeObserver(keepVisible)
    if (panelRef.current) observer.observe(panelRef.current)
    window.addEventListener('resize', keepVisible)
    window.visualViewport?.addEventListener('resize', keepVisible)
    window.visualViewport?.addEventListener('scroll', keepVisible)
    return () => { observer.disconnect(); window.removeEventListener('resize', keepVisible); window.visualViewport?.removeEventListener('resize', keepVisible); window.visualViewport?.removeEventListener('scroll', keepVisible); drag.current = null }
  }, [enabled])
  const headerProps = {
    tabIndex: enabled ? 0 : undefined,
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (!enabled || event.button !== 0 || (event.target as HTMLElement).closest('button,input,select,textarea,a')) return
      event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId)
      drag.current = { x: event.clientX, y: event.clientY, left: position.x, top: position.y }
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => { if (drag.current) setPosition(clamp(drag.current.left + event.clientX - drag.current.x, drag.current.top + event.clientY - drag.current.y)) },
    onPointerUp: () => { drag.current = null }, onPointerCancel: () => { drag.current = null }, onLostPointerCapture: () => { drag.current = null },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (!enabled || event.target !== event.currentTarget) return
      const direction: Record<string, [number, number]> = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }
      if (direction[event.key]) { event.preventDefault(); const [x,y] = direction[event.key]; setPosition(clamp(position.x + x, position.y + y)) }
    }
  }
  return { panelRef, position, headerProps }
}
