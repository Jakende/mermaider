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
            <div className="tabs-container">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
                        onClick={() => onSelectTab(tab.id)}
                    >
                        <span className="tab-name">{tab.name || 'Untitled'}</span>
                        {tabs.length > 1 && (
                            <button
                                className="tab-close"
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
