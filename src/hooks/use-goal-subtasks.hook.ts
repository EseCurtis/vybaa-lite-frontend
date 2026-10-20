import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useToast } from '@/providers/toast.provider'
import { goalSubtaskAPI } from '@/shared/api/goal-subtask.api'
import type { GoalSubtask, SubtaskUpdate } from '@/shared/api/goal-subtask.api'
import { goalQueryKeys } from '@/shared/api/goal.query-keys'

export function useGoalSubtasks(goalId: string) {
  const key = [...goalQueryKeys.detail(goalId), 'subtasks']
  const client = useQueryClient()
  const toast = useToast()
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => goalSubtaskAPI.list(goalId, signal),
    staleTime: 30_000,
  })
  function saved(item: GoalSubtask): void {
    client.setQueryData<GoalSubtask[]>(key, (previous = []) => {
      const others = previous.filter((existing) => existing.id !== item.id)
      return (item.deletedAt ? others : [...others, item]).sort(
        (a, b) =>
          a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
      )
    })
  }
  function failed(error: unknown): void {
    toast.error(
      error instanceof Error ? error.message : 'Could not update this subtask',
    )
    void client.invalidateQueries({ queryKey: key })
  }
  const create = useMutation({
    mutationFn: (input: { id: string; title: string }) =>
      goalSubtaskAPI.create(goalId, input),
    onSuccess: saved,
    onError: failed,
  })
  const update = useMutation({
    mutationFn: ({ id, ...input }: SubtaskUpdate & { id: string }) =>
      goalSubtaskAPI.update(goalId, id, input),
    onSuccess: saved,
    onError: failed,
  })
  return { query, create, update }
}
