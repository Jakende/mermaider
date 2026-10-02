import type { FlowSession } from './decision/flow'
export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    codeBefore?: string // Store code state before this message (for user messages)
}

export interface ChatSession {
    id: string
    messages: ChatMessage[]
    timestamp: number
}

export interface Tab {
    id: string
    name: string
    code: string
    chatSessions: ChatSession[]
    activeChatSessionId: string
    decision?: FlowSession
}
