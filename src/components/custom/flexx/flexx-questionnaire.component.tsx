import { RiCheckLine, RiDoubleQuotesL } from '@remixicon/react'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { VybaaMark } from '@/components/common/vybaa-mark.component'
import { useBottomSheet } from '@/hooks/use-bottom-sheet.hook'
import {
  useFlexxAnswers,
  useSaveFlexxAnswer,
} from '@/hooks/use-flexx-answers.hook'
import { FLEXX_THEMES } from '@/shared/flexx/flexx-design'
import type { FlexxDesign, FlexxQuestion } from '@/shared/flexx/flexx-design'
import { flexxPresentation } from '@/shared/flexx/flexx-presentation'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'
import { cn } from '@/shared/utils/helpers.util'
import { FlexxPartnerExpression } from './flexx-partner-expression.component'

function FlexxAnswerSheet({
  designId,
  question,
  localDateKey,
  userId,
  onSaved,
  partnerId,
}: {
  designId: string
  question: FlexxQuestion
  localDateKey: string
  userId?: string
  onSaved: () => void
  partnerId: RewindPersonaId | undefined
}): ReactElement {
  const [selected, setSelected] = useState('')
  const [custom, setCustom] = useState(false)
  const [draft, setDraft] = useState('')
  const mutation = useSaveFlexxAnswer(userId)
  const context = useFlexxAnswers(userId)
  const text = custom ? draft.trim() : selected
  let errorMessage = "Couldn't save your answer. Please retry."
  if (
    isAxiosError<{ msg?: string }>(mutation.error) &&
    mutation.error.response?.data.msg
  )
    errorMessage = mutation.error.response.data.msg
  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex items-center gap-3">
        <h2 className="min-w-0 flex-1 font-display text-xl font-bold text-white">
          {question.question}
        </h2>
        {partnerId ? (
          <FlexxPartnerExpression
            partnerId={partnerId}
            expression={custom ? 'typing' : 'listening'}
            className="w-16"
          />
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {question.options.map((option) => (
          <Pressable
            key={option}
            type="button"
            aria-pressed={!custom && selected === option}
            disabled={mutation.isPending}
            onPress={() => {
              setCustom(false)
              setSelected(option)
            }}
            className={cn(
              'min-h-12 min-w-0 items-center justify-center rounded-2xl px-3 py-3 text-center font-bbh text-sm',
              !custom && selected === option
                ? 'bg-white text-black'
                : 'bg-card-light text-white',
            )}
          >
            {option}
          </Pressable>
        ))}
      </div>
      <Pressable
        type="button"
        aria-pressed={custom}
        onPress={() => setCustom(true)}
        disabled={mutation.isPending}
        className={cn(
          'min-h-12 items-center justify-center rounded-full px-4 font-bbh text-sm',
          custom ? 'bg-white text-black' : 'bg-card-light-100 text-white',
        )}
      >
        Write my own
      </Pressable>
      {custom ? (
        <label className="flex flex-col gap-2 font-bbh text-sm text-card-lighter-3">
          Your answer
          <textarea
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={800}
            disabled={mutation.isPending}
            rows={4}
            className="w-full resize-none rounded-2xl bg-card-light p-4 text-base text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          />
        </label>
      ) : null}
      {mutation.isError ? (
        <p role="alert" className="font-bbh text-sm text-white">
          {errorMessage}
        </p>
      ) : null}
      <Pressable
        type="button"
        accessibilityLabel="Save Flexx answer"
        disabled={
          !text ||
          mutation.isPending ||
          (mutation.isError && context.isFetching)
        }
        onPress={() =>
          mutation.mutate(
            {
              designId,
              localDateKey: context.data?.localDateKey ?? localDateKey,
              answer: text,
              custom,
            },
            { onSuccess: onSaved },
          )
        }
        className="min-h-12 items-center justify-center rounded-full bg-white px-5 font-bbh font-bold text-black disabled:bg-card-light disabled:text-card-lighter-3"
      >
        {mutation.isPending ? 'Saving…' : 'Save answer'}
      </Pressable>
    </div>
  )
}

export function FlexxQuestionnaire({
  design,
  userId,
  animate = false,
}: {
  design: FlexxDesign
  userId?: string
  animate?: boolean
}): ReactElement {
  const answers = useFlexxAnswers(userId)
  const { present, dismiss } = useBottomSheet()
  const theme = FLEXX_THEMES[design.palette]
  const question = design.questionnaire
  const presentation = flexxPresentation(design)
  const partnerId = design.author.partnerIds[0]
  const saved = answers.data?.answers.find(
    (entry) => entry.designId === design.id,
  )
  if (!question) throw new Error('Questionnaire content is required')
  function openAnswer(): void {
    if (!answers.data || saved || !question) return
    present(
      <FlexxAnswerSheet
        designId={design.id}
        question={question}
        localDateKey={answers.data.localDateKey}
        userId={userId}
        partnerId={partnerId}
        onSaved={dismiss}
      />,
      { title: 'A moment for today' },
    )
  }
  return (
    <div
      data-flexx-layout="questionnaire"
      data-flexx-palette={design.palette}
      data-flexx-animate={animate}
      className="grid size-full min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-5 overflow-hidden p-[7cqw]"
      style={{
        containerType: 'inline-size',
        backgroundColor: theme.background,
        color: theme.foreground,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <RiDoubleQuotesL
          className="size-[12cqw] shrink-0"
          aria-hidden="true"
          style={{ color: theme.accent }}
        />
        {partnerId && presentation.expression ? (
          <FlexxPartnerExpression
            partnerId={partnerId}
            expression={saved ? 'calm' : presentation.expression}
            className="w-[38cqw]"
          />
        ) : null}
      </div>
      <div className="flex min-h-0 flex-col justify-center gap-4">
        <h2
          className="break-words font-display font-extrabold leading-tight"
          style={{
            fontSize: `clamp(18px, ${Math.min(11, 950 / question.question.length)}cqw, 38px)`,
          }}
        >
          {question.question}
        </h2>
        {saved ? (
          <p
            data-html2canvas-ignore="true"
            className="break-words font-bbh text-sm"
            style={{ color: theme.secondary }}
          >
            {saved.answer}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-4">
        <div data-html2canvas-ignore="true">
          {answers.isError && !answers.data ? (
            <Pressable
              type="button"
              onPress={() => void answers.refetch()}
              className="min-h-12 items-center justify-center rounded-full bg-card-light px-4 text-sm text-white"
            >
              Retry loading answers
            </Pressable>
          ) : null}
          {!saved ? (
            <Pressable
              type="button"
              onPress={openAnswer}
              disabled={!answers.data}
              className="min-h-12 w-full items-center justify-center rounded-full bg-white px-4 font-bbh text-sm font-bold text-black disabled:bg-card-light disabled:text-card-lighter-3"
            >
              {answers.isPending ? 'Loading…' : 'Answer'}
            </Pressable>
          ) : (
            <p
              role="status"
              className="flex items-center gap-2 font-bbh text-xs"
            >
              <RiCheckLine size={18} aria-hidden="true" />
              {saved.contributesToReflection
                ? "Added to today's reflection"
                : 'Saved privately'}
            </p>
          )}
        </div>
        <VybaaMark
          tone={theme.foreground === '#ffffff' ? 'white' : 'dark'}
          className="size-7 self-end"
        />
      </div>
    </div>
  )
}
