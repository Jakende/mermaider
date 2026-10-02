import { useEffect, useRef, useState } from 'react'

type Action = { label: string; title?: string; onClick: () => void; disabled?: boolean }
export default function ActionMenu({ label, actions, align = 'start' }: { label: string; actions: Action[]; align?: 'start' | 'end' }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const focusLast = useRef(false)
  useEffect(() => {
    if (!open) return
    const items = root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')
    items?.[focusLast.current ? items.length - 1 : 0]?.focus()
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  return <div className={`action-menu align-${align}`} ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false)
  }} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus() }
    if (!open) return
    const items = [...(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') || [])]
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    let next: number | undefined
    if (event.key === 'ArrowDown') next = (index + 1) % items.length
    if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = items.length - 1
    if (next !== undefined) { event.preventDefault(); items[next]?.focus() }
  }}>
    <button ref={trigger} className="toolbar-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => { focusLast.current = false; setOpen(!open) }} onKeyDown={event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); event.stopPropagation(); focusLast.current = event.key === 'ArrowUp'; setOpen(true) }
    }}>{label} <span aria-hidden="true">⌄</span></button>
    {open && <div className="action-menu-items" role="menu" aria-label={label}>
      {actions.map(action => <button role="menuitem" key={action.label} title={action.title} disabled={action.disabled} onClick={() => {
        setOpen(false); trigger.current?.focus(); action.onClick()
      }}>{action.label}</button>)}
    </div>}
  </div>
}
