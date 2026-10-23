import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import type {
  OnboardingAnswer,
  OnboardingData,
  OnboardingProfile,
} from '@/shared/api/onboarding.api'
import {
  readQuestionnaireDraft,
  saveQuestionnaireDraft,
} from '@/shared/onboarding/questionnaire.util'
import { questionnairePresentation } from '@/shared/onboarding/questionnaire-presentation'

import { QuestionnaireArt } from './questionnaire-art.component'
import { QuestionnaireChoices } from './questionnaire-choices.component'

export function UserQuestionnaire({
  data,
  userId,
  saving,
  onSave,
}: {
  data: OnboardingData
  userId: string
  saving: boolean
  onSave: (profile: OnboardingProfile) => void
}) {
  const [draft] = useState(() => readQuestionnaireDraft(userId, data))
  const [index, setIndex] = useState(draft.index)
  const [answers, setAnswers] = useState(draft.answers)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const revision = data.profile?.revision ?? 0
  const question = data.questions[index]
  const answer = answers.find((entry) => entry.questionId === question?.id)
  const choices = answer?.choices ?? []
  const customText = answer?.customText ?? ''
  const reviewing = index >= data.questions.length
  let continueLabel = 'Continue'
  if (index < 0) continueLabel = 'Let’s do it'
  if (reviewing) continueLabel = 'Save my preferences'
  if (saving) continueLabel = 'Saving…'

  useEffect(() => {
    saveQuestionnaireDraft(userId, revision, index, answers)
  }, [userId, revision, index, answers])
  useEffect(() => {
    titleRef.current?.focus()
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [index])

  function updateAnswer(next: OnboardingAnswer): void {
    setAnswers((previous) =>
      [
        ...previous.filter((entry) => entry.questionId !== next.questionId),
        next,
      ].filter((entry) => entry.choices.length || entry.customText.trim()),
    )
  }

  function choose(choice: string): void {
    if (!question) return
    let next = [...choices]
    if (choices.includes(choice))
      next = choices.filter((entry) => entry !== choice)
    else if (question.maxChoices === 1) next = [choice]
    else if (choices.length < question.maxChoices) next = [...choices, choice]
    updateAnswer({ questionId: question.id, choices: next, customText })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <motion.div
          key={index}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
          className="mx-auto max-w-lg space-y-5 pt-2"
        >
          <QuestionnaireArt
            question={question}
            reviewing={reviewing}
            userId={userId}
          />
          <h1
            ref={titleRef}
            tabIndex={-1}
            className="text-[clamp(1.75rem,6vw,2.25rem)] font-bold leading-[1.15] tracking-tight outline-none"
          >
            {question?.title ??
              (reviewing
                ? 'Does this feel like you?'
                : 'Let’s make this feel like you.')}
          </h1>
          {index < 0 ? (
            <>
              <p className="text-base leading-7 text-card-lighter-3">
                Your rhythm. Your kind of support. Help your partners get you.
              </p>
              <p className="text-sm leading-6 text-card-lighter-3">
                About 3 minutes · All optional · Editable in Profile
              </p>
              <p className="text-sm leading-6 text-card-lighter-3">
                Private to your account. With personalization on, answers are
                shared with your partners’ AI service.
              </p>
              <details className="text-sm text-card-lighter-3">
                <summary className="flex min-h-11 cursor-pointer items-center font-semibold">
                  You’re in control
                </summary>
                <p className="pb-2 leading-6">
                  These are preferences, not a personality test. Change or
                  remove answers in Profile → About you. They won’t set tasks,
                  reminders or notification preferences.
                </p>
              </details>
              {!data.personalizationEnabled ? (
                <p className="rounded-2xl bg-card-light-50 p-4 text-sm text-card-lighter-2">
                  Personalization is off. Answers stay saved, but aren’t used in
                  Rewind until you enable it in settings.
                </p>
              ) : null}
            </>
          ) : null}
          {question ? (
            <>
              <Pressable
                type="button"
                disabled={saving}
                onPress={() => {
                  setAnswers((previous) =>
                    previous.filter(
                      (entry) => entry.questionId !== question.id,
                    ),
                  )
                  setIndex(index + 1)
                }}
                className="min-h-11 ml-auto px-1 text-sm text-card-lighter-3"
              >
                Skip this question
              </Pressable>
              <QuestionnaireChoices
                question={question}
                choices={choices}
                saving={saving}
                onChoose={choose}
              />
              <details
                open={customText ? true : undefined}
                className="rounded-2xl bg-card-light-50 px-4"
              >
                <summary className="flex min-h-12 cursor-pointer items-center text-sm font-semibold">
                  In my own words
                </summary>
                <label className="sr-only" htmlFor="onboarding-custom-answer">
                  Your own answer
                </label>
                <textarea
                  id="onboarding-custom-answer"
                  value={customText}
                  maxLength={500}
                  rows={3}
                  disabled={saving}
                  onChange={(event) =>
                    updateAnswer({
                      questionId: question.id,
                      choices,
                      customText: event.target.value,
                    })
                  }
                  className="mb-4 w-full resize-none rounded-xl bg-card-light-100 p-3 text-base text-white outline-none placeholder:text-card-lighter-3"
                  placeholder="Only what you want to share…"
                />
              </details>
            </>
          ) : null}
          {reviewing ? (
            <>
              <p className="text-sm leading-6 text-card-lighter-3">
                Tap to edit. Save what fits.
              </p>
              <ol
                role="list"
                aria-label="Your answers"
                className="space-y-7 pt-1"
              >
                {data.questions.map((entry, position) => {
                  const saved = answers.find(
                    (item) => item.questionId === entry.id,
                  )
                  const hasAnswer = Boolean(
                    saved?.choices.length || saved?.customText.trim(),
                  )
                  const style = questionnairePresentation(entry, false)
                  return (
                    <li key={entry.id}>
                      <Pressable
                        type="button"
                        disabled={saving}
                        onPress={() => setIndex(position)}
                        accessibilityLabel={`Edit: ${entry.title}`}
                        className="min-h-14 w-full flex-row items-start gap-3 rounded-xl py-2 text-left active:!scale-[0.98] motion-reduce:!transform-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                      >
                        <span
                          aria-hidden="true"
                          className="min-w-7 shrink-0 pt-0.5 text-base font-bold tabular-nums"
                          style={{ color: style.accent }}
                        >
                          {position + 1}.
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-3">
                          <span className="flex items-start gap-3">
                            <span className="min-w-0 flex-1 break-words text-base font-semibold leading-6">
                              {entry.title}
                            </span>
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 20 20"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mt-1 size-4 shrink-0 text-card-lighter-3"
                            >
                              <path d="m12.5 4.5 3 3m-11 8 1-4L13 4a2.12 2.12 0 0 1 3 3l-7.5 7.5-4 1Z" />
                            </svg>
                          </span>
                          <span className="flex min-w-0 flex-col gap-2.5">
                            {saved?.choices.map((choice) => (
                              <span
                                key={choice}
                                className="flex items-start gap-2.5 text-sm leading-6 text-card-lighter-3"
                              >
                                <svg
                                  aria-hidden="true"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="mt-1 size-4 shrink-0"
                                  style={{ color: style.accent }}
                                >
                                  <path d="m4 10 4 4 8-8" />
                                </svg>
                                <span className="min-w-0 flex-1 break-words">
                                  {choice}
                                </span>
                              </span>
                            ))}
                            {saved?.customText.trim() ? (
                              <span className="block whitespace-pre-wrap break-words rounded-xl bg-card-light-100 px-3 py-2.5 text-sm leading-6 text-white">
                                {saved.customText}
                              </span>
                            ) : null}
                            {!hasAnswer ? (
                              <span className="text-sm leading-6 text-card-lighter-3">
                                Skipped
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </Pressable>
                    </li>
                  )
                })}
              </ol>
            </>
          ) : null}
        </motion.div>
      </div>
      <footer className="shrink-0 bg-cardd px-5 pt-3 pb-[calc(var(--safe-area-inset-bottom,0px)+1rem)]">
        {question ? (
          <p
            className="mb-3 ml-3 text-center text-xs tabular-nums text-card-lighter-3"
            aria-label={`Question ${index + 1} of ${data.questions.length}`}
          >
            {index + 1} / {data.questions.length}
          </p>
        ) : null}
        <div className="mx-auto flex max-w-lg gap-3">
          {index >= 0 ? (
            <Pressable
              type="button"
              disabled={saving}
              onPress={() => setIndex(index - 1)}
              className="min-h-12 items-center justify-center rounded-full bg-card-light-100 px-5 font-semibold active:!scale-[0.97] motion-reduce:!transform-none"
            >
              Back
            </Pressable>
          ) : null}
          <Pressable
            type="button"
            disabled={saving}
            aria-busy={saving}
            onPress={() => {
              if (reviewing)
                onSave({ version: 1, revision, skipped: false, answers })
              else setIndex(index + 1)
            }}
            className="min-h-12 flex-1 items-center justify-center rounded-full bg-white px-5 font-bold text-black active:!scale-[0.97] motion-reduce:!transform-none"
          >
            {continueLabel}
          </Pressable>
        </div>
      </footer>
    </div>
  )
}
