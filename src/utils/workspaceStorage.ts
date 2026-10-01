import type { Tab, ChatSession } from '../types'

/** Restore before the first persistence effect, including StrictMode mounts. */
export function restoreWorkspace(storage: Pick<Storage, 'getItem'>, fallback: Tab[]) {
  let tabs = fallback
  let savedActive: string | null = null
  try {
    savedActive = storage.getItem('mermaider-active-tab')
    const saved = JSON.parse(storage.getItem('mermaider-tabs') || 'null')
    if (Array.isArray(saved) && saved.length && saved.every(tab => tab &&
      typeof tab.id === 'string' && typeof tab.name === 'string' && typeof tab.code === 'string')) {
      tabs = saved.map(tab => {
        const sessions: ChatSession[] = Array.isArray(tab.chatSessions) && tab.chatSessions.length
          ? tab.chatSessions : [{ id: `initial-session-${tab.id}`, messages: Array.isArray(tab.chatHistory) ? tab.chatHistory : [], timestamp: Date.now() }]
        return { ...tab, chatSessions: sessions,
          activeChatSessionId: sessions.some(s => s.id === tab.activeChatSessionId) ? tab.activeChatSessionId : sessions[0].id }
      })
    }
  } catch { /* Unavailable storage or invalid JSON: retain a usable workspace. */ }
  return { tabs, activeTabId: tabs.some(tab => tab.id === savedActive) ? savedActive! : tabs[0].id }
}
