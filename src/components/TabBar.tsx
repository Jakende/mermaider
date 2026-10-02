import { Tab } from '../types'
import './TabBar.css'

interface TabBarProps {
    tabs: Tab[]
    activeTabId: string
    onSelectTab: (id: string) => void
    onCloseTab: (id: string) => void
    onNewTab: () => void
}

export default function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab }: TabBarProps) {
    return (
        <div className="tab-bar">
            <div className="tabs-container" role="tablist" aria-label="Diagrams">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
                    >
                        <button className="tab-select" role="tab" aria-selected={tab.id === activeTabId} tabIndex={tab.id === activeTabId ? 0 : -1} title={tab.name || 'Untitled'} onClick={() => onSelectTab(tab.id)} onKeyDown={event => {
                            const index = tabs.findIndex(item => item.id === tab.id)
                            const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1
                            if (next >= 0) {
                                event.preventDefault(); onSelectTab(tabs[next].id)
                                const buttons = event.currentTarget.closest('.tabs-container')?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                                buttons?.[next]?.focus(); buttons?.[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
                            }
                        }}><span className="tab-name">{tab.name || 'Untitled'}</span></button>
                        {tabs.length > 1 && (
                            <button
                                className="tab-close"
                                aria-label={`Close ${tab.name || 'Untitled'}`}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onCloseTab(tab.id)
                                }}
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <button className="new-tab-btn" onClick={onNewTab} title="New Tab (⌘T)">
                +
            </button>
        </div>
    )
}
