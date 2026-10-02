import { useEffect, useRef, useState, type Dispatch, type SetStateAction, type PointerEvent, type MouseEvent } from 'react'

type Point = { x: number; y: number }
type Camera = { zoom: number; pan: Point }
const clamp = (zoom: number) => Math.max(0.05, Math.min(20, zoom))
const centerOf = (points: Point[]) => points.length === 1 ? points[0] : { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
const distanceOf = (points: Point[]) => points.length < 2 ? 0 : Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)

/** Pan with scroll/drag; zoom with pinch or Ctrl/Cmd + wheel. Only the canvas owns these gestures. */
export function useDiagramGestures(zoom: number, pan: Point, setZoom: Dispatch<SetStateAction<number>>, setPan: Dispatch<SetStateAction<Point>>, enabled: boolean, onInteraction: () => void) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const interaction = useRef(onInteraction)
  interaction.current = onInteraction
  const camera = useRef<Camera>({ zoom, pan })
  camera.current = { zoom, pan }
  const points = useRef(new Map<number, Point>())
  const baseline = useRef<{ camera: Camera; center: Point; distance: number } | null>(null)
  const moved = useRef(false)
  const ignoreClickUntil = useRef(0)
  const [isPanning, setIsPanning] = useState(false)
  const update = (next: Camera) => { camera.current = next; setZoom(next.zoom); setPan(next.pan) }
  const rebase = () => {
    const active = [...points.current.values()]
    baseline.current = active.length ? { camera: camera.current, center: centerOf(active), distance: distanceOf(active) } : null
  }
  useEffect(() => {
    const element = viewportRef.current
    if (!enabled || !element) return
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      interaction.current()
      const current = camera.current
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1
      if (event.ctrlKey || event.metaKey) {
        const nextZoom = clamp(current.zoom * Math.exp(-event.deltaY * unit * 0.005))
        const bounds = element.getBoundingClientRect()
        const anchor = { x: event.clientX - bounds.left - bounds.width / 2, y: event.clientY - bounds.top - bounds.height / 2 }
        const ratio = nextZoom / current.zoom
        const next = { zoom: nextZoom, pan: { x: anchor.x - (anchor.x - current.pan.x) * ratio, y: anchor.y - (anchor.y - current.pan.y) * ratio } }
        camera.current = next; setZoom(next.zoom); setPan(next.pan)
      } else {
        const next = { ...current, pan: { x: current.pan.x - event.deltaX * unit, y: current.pan.y - event.deltaY * unit } }
        camera.current = next; setPan(next.pan)
      }
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => { element.removeEventListener('wheel', wheel); points.current.clear(); baseline.current = null }
  }, [enabled, setZoom, setPan])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled || event.pointerType === 'mouse' && event.button !== 0 || points.current.size >= 2) return
    if (!points.current.size) moved.current = false
    points.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (points.current.size === 2) {
      moved.current = true
      for (const id of points.current.keys()) event.currentTarget.setPointerCapture(id)
    }
    rebase()
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!points.current.has(event.pointerId) || !baseline.current) return
    points.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const active = [...points.current.values()], center = centerOf(active), start = baseline.current
    const dx = center.x - start.center.x, dy = center.y - start.center.y
    if (!moved.current && Math.hypot(dx, dy) < 4) return
    moved.current = true
    interaction.current()
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsPanning(true)
    const nextZoom = start.distance > 0 && active.length === 2 ? clamp(start.camera.zoom * distanceOf(active) / start.distance) : start.camera.zoom
    const bounds = event.currentTarget.getBoundingClientRect()
    const anchor = { x: start.center.x - bounds.left - bounds.width / 2, y: start.center.y - bounds.top - bounds.height / 2 }
    const ratio = nextZoom / start.camera.zoom
    update({ zoom: nextZoom, pan: { x: anchor.x + dx - (anchor.x - start.camera.pan.x) * ratio, y: anchor.y + dy - (anchor.y - start.camera.pan.y) * ratio } })
  }
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!points.current.delete(event.pointerId)) return
    if (moved.current) ignoreClickUntil.current = Date.now() + 400
    rebase()
    if (!points.current.size) setIsPanning(false)
  }
  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (Date.now() < ignoreClickUntil.current) { event.preventDefault(); event.stopPropagation() }
  }
  return { viewportRef, isPanning, handlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onPointerEnd(event) }, onClickCapture } }
}
