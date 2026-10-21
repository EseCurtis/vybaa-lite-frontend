export function createTaskDraft<T extends object>(initial: T) {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => value,
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    update(change: Partial<T>): void {
      value = { ...value, ...change }
      for (const listener of listeners) listener()
    },
  }
}
