import { useToast } from '@/providers/toast.provider'
import {
  goalAPI,
  type Attachment,
  type CreateGoalRequest,
  type GoalListFilter,
  type GoalsListResponse,
} from '@/shared/api/goal.api'
import { goalQueryKeys } from '@/shared/api/goal.query-keys'
import { insightsQueryKeys } from '@/shared/api/insights.query-keys'
import { isSubscriptionApiError } from '@/shared/api/http'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function useInfiniteGoals({
  filter = 'ACTIVE',
  limit = 20,
}: {
  filter?: GoalListFilter
  limit?: number
} = {}) {
  return useInfiniteQuery({
    getNextPageParam: (lastPage: GoalsListResponse) =>
      lastPage.pagination.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }): Promise<GoalsListResponse> =>
      goalAPI.list(filter, pageParam, limit),
    queryKey: goalQueryKeys.list(filter),
  })
}

export function useGoal(goalId?: string) {
  return useQuery({
    enabled: Boolean(goalId),
    queryFn: async () => (await goalAPI.get(goalId!)).data,
    queryKey: goalQueryKeys.detail(goalId ?? 'none'),
  })
}

export function useLegacyGoals(enabled = true) {
  return useQuery({
    enabled,
    queryFn: async () => (await goalAPI.listLegacy()).data,
    queryKey: goalQueryKeys.legacy(),
  })
}

export function useGoalOccurrences(goalId: string) {
  return useQuery({
    queryFn: async () => (await goalAPI.listOccurrences(goalId)).data,
    queryKey: goalQueryKeys.occurrences(goalId),
  })
}

function useGoalMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  successMessage: string,
) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, 'Goal update failed')),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: insightsQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['rewards'] })
      toast.success(successMessage)
    },
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: CreateGoalRequest) => goalAPI.create(input),
    onError: (error: unknown) => {
      if (isSubscriptionApiError(error)) return
      toast.error(getErrorMessage(error, 'Failed to create goal'))
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalQueryKeys.all })
      toast.success('Goal created successfully')
    },
  })
}

export function useRecordGoalProgress() {
  return useGoalMutation(
    (input: {
      amount?: number
      attachments?: Array<{
        name?: string
        publicId?: string
        type: 'audio' | 'image'
        url: string
      }>
      goalId: string
      notes?: string
      occurrenceId: string
    }) =>
      goalAPI.recordProgress(input.goalId, input.occurrenceId, {
        amount: input.amount,
        attachments: input.attachments,
        notes: input.notes,
      }),
    'Progress recorded',
  )
}

export function useCorrectGoalProgress() {
  return useGoalMutation(
    (input: {
      amount?: number
      goalId: string
      notes?: string
      occurrenceId: string
    }) =>
      goalAPI.correctProgress(input.goalId, input.occurrenceId, {
        amount: input.amount,
        notes: input.notes,
      }),
    'Progress corrected',
  )
}

export function useUndoGoalProgress() {
  return useGoalMutation(
    (input: { goalId: string; occurrenceId: string }) =>
      goalAPI.undoProgress(input.goalId, input.occurrenceId),
    'Progress undone',
  )
}

export function useRescheduleGoalOccurrence() {
  return useGoalMutation(
    (input: { dueDate: string; goalId: string; occurrenceId: string }) =>
      goalAPI.reschedule(input.goalId, input.occurrenceId, input.dueDate),
    'Occurrence rescheduled',
  )
}

export function usePauseGoal() {
  return useGoalMutation(
    (goalId: string) => goalAPI.pause(goalId),
    'Goal paused',
  )
}

export function useResumeGoal() {
  return useGoalMutation(
    (input: {
      deadlinePolicy: 'KEEP_DEADLINE' | 'SHIFT_DEADLINE'
      goalId: string
    }) => goalAPI.resume(input.goalId, input.deadlinePolicy),
    'Goal resumed',
  )
}

export function useAbandonGoal() {
  return useGoalMutation(
    (goalId: string) => goalAPI.abandon(goalId),
    'Goal moved to history',
  )
}

export function useArchiveGoal() {
  return useGoalMutation(
    (goalId: string) => goalAPI.archive(goalId),
    'Goal archived',
  )
}

export function usePermanentlyDeleteGoal() {
  return useGoalMutation(
    (goalId: string) => goalAPI.permanentlyDelete(goalId),
    'Goal permanently deleted',
  )
}

export function useReopenGoal() {
  return useGoalMutation(
    (goalId: string) => goalAPI.reopen(goalId),
    'New goal run started',
  )
}

export function useSaveGoalReview() {
  return useGoalMutation(
    (input: {
      attachments?: Attachment[]
      goalId: string
      nextStep?: string | null
      rating?: number | null
      reflection?: string | null
    }) => goalAPI.saveReview(input.goalId, input),
    'Review saved',
  )
}

export function useArchiveLegacyGoal() {
  return useGoalMutation(
    (goalId: string) => goalAPI.archiveLegacy(goalId),
    'Legacy goal archived',
  )
}

export function useReopenLegacyGoal() {
  return useGoalMutation(
    (goalId: string) => goalAPI.reopenLegacy(goalId),
    'New goal run started',
  )
}

export function useDeleteLegacyGoal() {
  return useGoalMutation(
    (goalId: string) => goalAPI.deleteLegacy(goalId),
    'Legacy goal permanently deleted',
  )
}
