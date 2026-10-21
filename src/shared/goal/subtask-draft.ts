import { createTaskDraft } from './task-draft'

export interface SubtaskDraft {
  title: string
  request: { id: string; title: string } | null
  pending: boolean
  error: string | null
}

// Task-screen owned, so dismissal never discards a draft or its retry ID.
export function createSubtaskDraft() {
  return createTaskDraft<SubtaskDraft>({
    title: '',
    request: null,
    pending: false,
    error: null,
  })
}

export type SubtaskDraftStore = ReturnType<typeof createSubtaskDraft>
