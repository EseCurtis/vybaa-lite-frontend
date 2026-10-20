import { http } from './http'

export interface GoalSubtask {
  completedAt: string | null
  createdAt: string
  deletedAt: string | null
  id: string
  revision: number
  title: string
}

export interface SubtaskUpdate {
  completed?: boolean
  deleted?: boolean
  revision: number
  title?: string
}

function endpoint(goalId: string): string {
  return `/api/v2/goals/${encodeURIComponent(goalId)}/subtasks`
}

export const goalSubtaskAPI = {
  async list(goalId: string, signal?: AbortSignal): Promise<GoalSubtask[]> {
    return (
      await http.get<{ data: GoalSubtask[] }>(endpoint(goalId), { signal })
    ).data.data
  },
  async create(
    goalId: string,
    input: { id: string; title: string },
  ): Promise<GoalSubtask> {
    return (await http.post<{ data: GoalSubtask }>(endpoint(goalId), input))
      .data.data
  },
  async update(
    goalId: string,
    id: string,
    input: SubtaskUpdate,
  ): Promise<GoalSubtask> {
    return (
      await http.patch<{ data: GoalSubtask }>(
        `${endpoint(goalId)}/${encodeURIComponent(id)}`,
        input,
      )
    ).data.data
  },
}
