export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
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
}
