export interface SubtaskDraft {
  title: string
  request: { id: string; title: string } | null
  pending: boolean
  error: string | null
}

// Task-screen owned, so dismissal never discards a draft or its retry ID.
export function createSubtaskDraft() {
  let value: SubtaskDraft = {
    title: '',
    request: null,
    pending: false,
    error: null,
  }
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => value,
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    update(change: Partial<SubtaskDraft>): void {
      value = { ...value, ...change }
      for (const listener of listeners) listener()
    },
  }
}

export type SubtaskDraftStore = ReturnType<typeof createSubtaskDraft>
