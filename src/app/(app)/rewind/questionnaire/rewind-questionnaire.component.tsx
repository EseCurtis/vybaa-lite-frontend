import { RiArrowRightLine, RiCheckLine, RiEditLine } from '@remixicon/react'
import type { ReactElement } from 'react'
import { useState } from 'react'

import { RewindCountdownTimer } from '@/components/custom/rewind/rewind-countdown-timer.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { useRewindQuestionnaire } from '@/hooks/use-rewind-questionnaire.hook'
import { getQuestionnaireError } from '@/hooks/use-rewind-questionnaire.hook'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { cn } from '@/shared/utils/helpers.util'
import { CustomRewindAnswerSheet } from './custom-rewind-answer-sheet.component'
import { RewindQuestionCards } from './rewind-question-cards.component'

export function RewindQuestionnaireContent({
  questionnaire,
  onStart,
  onCompleted,
  available,
  startLabel,
}: {
  questionnaire: ReturnType<typeof useRewindQuestionnaire>
  onStart: () => void
  onCompleted: (sessionId: string) => void
  available: boolean
  startLabel: string
}): ReactElement {
  const { answer, deck, finish, start } = questionnaire
  const sheet = useBottomSheetController()
  const [selection, setSelection] = useState<{
    questionId: string
    text: string
    custom: boolean
  } | null>(null)
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>({})
  const currentQuestion = deck?.questions[deck.answers.length]
  const allAnswered = Boolean(deck && !currentQuestion)
  const isBusy = answer.isPending || finish.isPending || start.isPending

  function complete(): void {
    finish.mutate(undefined, {
      onSuccess: (result) => {
        if (
          result.status === 'completed' ||
          result.status === 'already_completed' ||
          result.status === 'finalizing'
        ) {
          onCompleted(result.sessionId)
        }
      },
    })
  }

  function openCustomAnswer(): void {
    if (!currentQuestion) return
    const question = currentQuestion
    sheet.present(
      <CustomRewindAnswerSheet
        question={question.text}
        initialValue={customDrafts[question.id] ?? ''}
        onSave={async (text) => {
          setCustomDrafts((drafts) => ({ ...drafts, [question.id]: text }))
          setSelection({ questionId: question.id, text, custom: true })
          sheet.dismiss()
        }}
      />,
      { title: 'Your answer' },
    )
  }

  const error = answer.error ?? finish.error ?? start.error
  const selected =
    currentQuestion && selection?.questionId === currentQuestion.id
      ? selection
      : null
  return (
    <View
      data-walkthrough="rewind-questionnaire"
      className="w-full mt-10 items-center gap-4 pb-7 pt-5"
    >
      <RewindQuestionCards
        question={currentQuestion ?? null}
        complete={allAnswered}
        index={deck?.answers.length ?? 0}
        total={deck?.questions.length ?? 4}
      />
      {!deck ? <RewindCountdownTimer /> : null}
      {currentQuestion ? (
        <>
          <View
            className="w-full max-w-[350px] flex-row flex-wrap justify-center gap-2 px-1"
            role="group"
            aria-label="Choose your answer"
          >
            {currentQuestion.options.map((option) => (
              <Pressable
                key={option}
                aria-pressed={selected?.text === option && !selected.custom}
                disabled={isBusy}
                onPress={() =>
                  setSelection({
                    questionId: currentQuestion.id,
                    text: option,
                    custom: false,
                  })
                }
                className={cn(
                  'min-h-11 items-center justify-center rounded-full px-4 py-3 text-center',
                  selected?.text === option && !selected.custom
                    ? 'bg-white'
                    : 'bg-card-light-50',
                )}
              >
                <Text
                  className={cn(
                    'font-bbh text-sm font-semibold',
                    selected?.text === option && !selected.custom
                      ? 'text-black'
                      : 'text-card-lighter-2',
                  )}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
            <Pressable
              aria-pressed={Boolean(selected?.custom)}
              disabled={isBusy}
              onPress={openCustomAnswer}
              className={cn(
                'min-h-11 max-w-full flex-row items-center justify-center gap-2 rounded-full px-4 py-3',
                selected?.custom ? 'bg-white' : 'bg-card-light-50',
              )}
            >
              <RiEditLine
                size={16}
                className={
                  selected?.custom ? 'text-black' : 'text-card-lighter-2'
                }
              />
              <Text
                className={cn(
                  'line-clamp-2 font-bbh text-sm font-semibold',
                  selected?.custom ? 'text-black' : 'text-card-lighter-2',
                )}
              >
                {selected?.custom ? selected.text : 'In my own words'}
              </Text>
            </Pressable>
          </View>
          <Pressable
            disabled={!selected || isBusy}
            onPress={() => {
              if (selected) answer.mutate(selected)
            }}
            className="mt-2 min-h-12 min-w-[160px] flex-row items-center justify-center gap-2 rounded-full bg-white px-6"
          >
            <Text className="font-bbh font-bold text-black">
              {answer.isPending ? 'Saving…' : 'Continue'}
            </Text>
            <RiArrowRightLine size={18} className="text-black" />
          </Pressable>
        </>
      ) : null}
      {!currentQuestion && (allAnswered || available || start.isPending) ? (
        <>
          <Pressable
            disabled={isBusy || (!allAnswered && !available)}
            onPress={() => {
              if (allAnswered) complete()
              else onStart()
            }}
            className="min-h-12 flex-row items-center justify-center gap-2 rounded-full bg-white px-6"
          >
            {allAnswered ? (
              <RiCheckLine size={19} className="text-black" />
            ) : null}
            <Text className="font-bbh  font-bold text-black">
              {finish.isPending
                ? 'Building your reflection…'
                : start.isPending
                  ? 'Choosing your questions…'
                  : allAnswered
                    ? 'Finish my Rewind'
                    : startLabel}
            </Text>
          </Pressable>
        </>
      ) : null}
      {error ? (
        <Text
          role="alert"
          className="max-w-[320px] text-center font-bbh text-sm text-card-lighter-2"
        >
          {getQuestionnaireError(error)}
        </Text>
      ) : null}
    </View>
  )
}
