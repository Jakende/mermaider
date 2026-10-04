import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Tab } from '../types'
import './DiagramSwitcher.css'

interface Props {
  toolbar?: boolean
  tabs: Tab[]; activeTabId: string; open: boolean; onOpen: (open: boolean) => void
  onSelectTab: (id: string) => void; onCloseTab: (id: string) => void; onNewTab: () => void
}

export default function DiagramSwitcher({ toolbar = false, tabs, activeTabId, open, onOpen, onSelectTab, onCloseTab, onNewTab }: Props) {
  const [query, setQuery] = useState('')
  const dialog = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
  const active = tabs.find(tab => tab.id === activeTabId) || tabs[0]
  const matches = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
    return tabs.filter(tab => terms.every(term => `${tab.name}\n${tab.code}`.toLocaleLowerCase().includes(term))).map(tab => {
      const lines = tab.code.split('\n')
      const line = terms.length ? lines.findIndex(line => terms.some(term => line.toLocaleLowerCase().includes(term))) : -1
      return { tab, snippet: line >= 0 ? lines[line].trim() : lines.find(line => line.trim()) || 'Empty diagram', line }
    })
  }, [tabs, query])
  useEffect(() => {
    if (!open) return
    restoreFocus.current = document.activeElement as HTMLElement
    setQuery(''); input.current?.focus()
    const trap = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onOpen(false) }
      if (event.key === 'Tab') {
        const items = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,[tabindex="0"]') || [])]
        const index = items.indexOf(document.activeElement as HTMLElement)
        if (event.shiftKey && index <= 0) { event.preventDefault(); items[items.length - 1]?.focus() }
        if (!event.shiftKey && index === items.length - 1) { event.preventDefault(); items[0]?.focus() }
      }
    }
    const keepFocus = (event: FocusEvent) => { if (!dialog.current?.contains(event.target as Node)) input.current?.focus() }
    document.addEventListener('keydown', trap)
    document.addEventListener('focusin', keepFocus)
    return () => { document.removeEventListener('keydown', trap); document.removeEventListener('focusin', keepFocus); restoreFocus.current?.focus() }
  }, [open, onOpen])
  const select = (id: string) => { onSelectTab(id); onOpen(false) }
  return <>
    <div className={`diagram-switcher ${toolbar ? 'in-toolbar' : ''}`} data-diagram-count={tabs.length}>
      <button className="diagram-library-trigger toolbar-btn" onClick={() => onOpen(true)} title="Search diagrams and Mermaid code (⌘/Ctrl K)" aria-haspopup="dialog" aria-expanded={open}>
        Diagrams <span className="diagram-count">{tabs.length}</span>{toolbar && <span className="current-diagram" title={active.name}>{active.name || 'Untitled'}</span>} <span aria-hidden="true">⌄</span>
      </button>
      {!toolbar && <><span className="current-diagram" title={active.name}>{active.name || 'Untitled'}</span>
      <button className="diagram-new" onClick={onNewTab} aria-label="New diagram">+</button></>}
    </div>
    {open && createPortal(<div className="modal-overlay diagram-library-overlay" onClick={() => onOpen(false)}>
      <div className="diagram-library" role="dialog" aria-modal="true" aria-labelledby="diagram-library-title" ref={dialog} onClick={event => event.stopPropagation()}>
        <header><div><h2 id="diagram-library-title">Your diagrams</h2><p>Find a diagram by name or Mermaid code.</p></div><button aria-label="Close diagram search" onClick={() => onOpen(false)}>×</button></header>
        <label className="diagram-search"><span>Search diagrams</span><input ref={input} type="search" placeholder="Name, node, label or Mermaid code…" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => {
          if (event.key === 'ArrowDown') { event.preventDefault(); dialog.current?.querySelector<HTMLButtonElement>('.diagram-result-select')?.focus() }
          if (event.key === 'Enter' && matches.length) { event.preventDefault(); select(matches[0].tab.id) }
        }} /></label>
        <p className="diagram-result-count" role="status">{matches.length} of {tabs.length} diagrams</p>
        <div className="diagram-results" aria-label="Matching diagrams" onKeyDown={event => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
          const buttons = [...(dialog.current?.querySelectorAll<HTMLButtonElement>('.diagram-result-select') || [])]
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
          if (index < 0) return
          event.preventDefault(); buttons[(index + (event.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length]?.focus()
        }}>
          {matches.map(({ tab, snippet, line }) => <div key={tab.id} className={`diagram-result ${tab.id === activeTabId ? 'active' : ''}`}>
            <button className="diagram-result-select" aria-label={`Open diagram: ${tab.name || 'Untitled'}`} aria-current={tab.id === activeTabId ? 'true' : undefined} onClick={() => select(tab.id)}>
              <span className="diagram-result-heading"><strong>{tab.name || 'Untitled'}</strong><small>{tab.id === activeTabId ? 'Current' : tab.decision ? 'Decision flow' : `${tab.code.split('\n').length} lines`}</small></span>
              <code>{line >= 0 ? `L${line + 1} · ` : ''}{snippet}</code>
            </button>
            <button className="diagram-result-close" aria-label={`Close diagram: ${tab.name || 'Untitled'}`} disabled={tabs.length === 1} onClick={() => onCloseTab(tab.id)}>×</button>
          </div>)}
          {!matches.length && <p className="diagram-empty">No matching diagrams. Try another name or phrase.</p>}
        </div>
        <footer><span>↑ ↓ to browse · Enter to open</span><button onClick={() => { onOpen(false); onNewTab() }}>New diagram</button></footer>
      </div>
    </div>, document.querySelector('.app') || document.body)}
  </>
}
