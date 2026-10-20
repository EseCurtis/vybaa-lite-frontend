import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { flexxAPI } from '@/shared/api/flexx.api'
import type {
  FlexxAnswers,
  FlexxAnswerInput,
} from '@/shared/flexx/flexx-answer'

export function useFlexxAnswers(userId: string | undefined) {
  return useQuery({
    queryKey: ['flexx', 'answers', userId],
    queryFn: ({ signal }) => flexxAPI.answers(signal),
    enabled: Boolean(userId),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
  })
}
export function useSaveFlexxAnswer(userId: string | undefined) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: FlexxAnswerInput) => flexxAPI.saveAnswer(input),
    onSuccess: (answer, input) => {
      client.setQueryData<FlexxAnswers>(
        ['flexx', 'answers', userId],
        (previous) => {
          if (!previous || previous.localDateKey !== input.localDateKey)
            return previous
          return {
            ...previous,
            answers: [
              ...previous.answers.filter(
                (entry) => entry.designId !== answer.designId,
              ),
              answer,
            ],
          }
        },
      )
    },
    onError: () => {
      void client.invalidateQueries({ queryKey: ['flexx', 'answers', userId] })
    },
  })
}
