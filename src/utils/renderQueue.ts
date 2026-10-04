// Mermaid uses global configuration and DOM state. Keep initialize/render pairs
// together even when a newer React effect arrives during an existing render.
let pending: Promise<void> = Promise.resolve()

export function queueMermaidRender(task: () => Promise<void>): Promise<void> {
  const result = pending.then(task)
  pending = result.catch(() => {})
  return result
}
