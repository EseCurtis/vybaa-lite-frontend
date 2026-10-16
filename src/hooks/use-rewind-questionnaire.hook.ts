import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'

import { rewindQuestionnaireAPI } from '@/shared/api/rewind-questionnaire.api'
import type {
  RewindQuestionnaire,
  RewindQuestionnaireAnswer,
} from '@/shared/api/rewind-questionnaire.api'
import { rewindQueryKeys } from '@/shared/api/rewind.query-keys'

export function getQuestionnaireError(error: unknown): string {
  if (isAxiosError<{ msg?: string }>(error))
    return error.response?.data?.msg ?? error.message
  return error instanceof Error
    ? error.message
    : 'Your Rewind could not be saved. Please try again.'
}

export function useRewindQuestionnaire(userId: string | undefined) {
  const queryClient = useQueryClient()
  const [snapshot, setSnapshot] = useState<{
    userId: string
    deck: RewindQuestionnaire
  } | null>(null)
  const deck = snapshot && snapshot.userId === userId ? snapshot.deck : null
  const start = useMutation({
    mutationFn: async () => ({
      ownerId: userId,
      deck: await rewindQuestionnaireAPI.start(),
    }),
    onSuccess: ({ ownerId, deck: nextDeck }) => {
      if (ownerId) setSnapshot({ userId: ownerId, deck: nextDeck })
    },
  })
  const answer = useMutation({
    mutationFn: async (input: RewindQuestionnaireAnswer) => {
      if (!deck) throw new Error('Open your Rewind first')
      return {
        ownerId: userId,
        deck: await rewindQuestionnaireAPI.answer(deck.sessionId, input),
      }
    },
    onSuccess: ({ ownerId, deck: nextDeck }) => {
      if (ownerId) setSnapshot({ userId: ownerId, deck: nextDeck })
    },
  })
  const finish = useMutation({
    mutationFn: async () => {
      if (!deck) throw new Error('Open your Rewind first')
      const result = await rewindQuestionnaireAPI.finish(deck.sessionId)
      if (
        result.status === 'missed' ||
        result.status === 'missing' ||
        result.status === 'needs_more_reflection'
      ) {
        throw new Error(
          'This Rewind could not be completed. Your saved answers are kept; please reopen your Rewind.',
        )
      }
      return result
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rewindQueryKeys.all })
    },
  })
  return { answer, deck, finish, start }
}
