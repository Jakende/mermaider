import localforage from 'localforage'

export interface VectorDocument {
    id: string
    textChunk: string
    embedding: number[]
    source: string
}

// Initialize localforage store specifically for vectors
const vectorDb = localforage.createInstance({
    name: 'MermaiderVectorDB',
    storeName: 'documents'
})

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0
    let dotProduct = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i]
        normA += vecA[i] * vecA[i]
        normB += vecB[i] * vecB[i]
    }
    if (normA === 0 || normB === 0) return 0
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function addDocument(doc: VectorDocument): Promise<void> {
    await vectorDb.setItem(doc.id, doc)
}

export async function addDocuments(docs: VectorDocument[]): Promise<void> {
    const promises = docs.map(doc => vectorDb.setItem(doc.id, doc))
    await Promise.all(promises)
}

export async function getAllDocuments(): Promise<VectorDocument[]> {
    const docs: VectorDocument[] = []
    await vectorDb.iterate((value: VectorDocument) => {
        docs.push(value)
    })
    return docs
}

export async function searchSimilar(queryEmbedding: number[], limit: number = 3, activeSources?: string[]): Promise<VectorDocument[]> {
    let allDocs = await getAllDocuments()

    if (activeSources && activeSources.length > 0) {
        allDocs = allDocs.filter(d => activeSources.includes(d.source))
    } else if (activeSources && activeSources.length === 0) {
        // If activeSources is explicitly an empty array, it means user deselected all sources
        return []
    }

    if (allDocs.length === 0) return []

    const scoredDocs = allDocs.map(doc => ({
        doc,
        score: cosineSimilarity(queryEmbedding, doc.embedding)
    }))

    // Sort by highest score first
    scoredDocs.sort((a, b) => b.score - a.score)

    return scoredDocs.slice(0, limit).map(v => v.doc)
}

export async function getUniqueSources(): Promise<string[]> {
    const allDocs = await getAllDocuments()
    const sources = new Set(allDocs.map(d => d.source))
    return Array.from(sources)
}

export async function deleteSource(source: string): Promise<void> {
    const allDocs = await getAllDocuments()
    const promises: Promise<void>[] = []

    allDocs.forEach(doc => {
        if (doc.source === source) {
            promises.push(vectorDb.removeItem(doc.id))
        }
    })

    await Promise.all(promises)
}

export async function clearVectorStore(): Promise<void> {
    await vectorDb.clear()
}

export function chunkText(text: string, maxTokens: number = 500): string[] {
    // Simple heuristic: split by double newlines, then merge up to maxTokens (approx 4 chars per token)
    const maxChars = maxTokens * 4
    const paragraphs = text.split(/\n\s*\n/)

    const chunks: string[] = []
    let currentChunk = ''

    for (const p of paragraphs) {
        if ((currentChunk.length + p.length) > maxChars && currentChunk.length > 0) {
            chunks.push(currentChunk.trim())
            currentChunk = p
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + p
        }
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim())
    }

    // fallback if a single chunk is still too big, brute-force split it
    const finalChunks: string[] = []
    for (const c of chunks) {
        if (c.length > maxChars * 1.5) {
            for (let i = 0; i < c.length; i += maxChars) {
                finalChunks.push(c.substring(i, i + maxChars))
            }
        } else {
            finalChunks.push(c)
        }
    }

    return finalChunks
}
