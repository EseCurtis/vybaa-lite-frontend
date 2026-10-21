import { http } from './http'

export interface QuickTaskSuggestion {
  id: string
  title: string
  reason: string
}

export const quickTaskSuggestionAPI = {
  async list(signal?: AbortSignal): Promise<QuickTaskSuggestion[]> {
    return (
      await http.get<{ data: QuickTaskSuggestion[] }>(
        '/api/v2/goals/suggestions',
        { signal },
      )
    ).data.data
  },
}
