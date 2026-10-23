import type { KeyboardEvent } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import type { OnboardingQuestion } from '@/shared/onboarding/questionnaire-contract'

export function QuestionnaireChoices({
  question,
  choices,
  saving,
  onChoose,
}: {
  question: OnboardingQuestion
  choices: string[]
  saving: boolean
  onChoose: (choice: string) => void
}) {
  const single = question.maxChoices === 1
  const focusChoice = choices[0] ?? question.options[0]
  const full = !single && choices.length >= question.maxChoices

  function navigateChoices(event: KeyboardEvent<HTMLDivElement>): void {
    if (
      !single ||
      saving ||
      ![
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'Home',
        'End',
      ].includes(event.key)
    )
      return
    if (!(event.target instanceof HTMLButtonElement)) return
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
    )
    const current = buttons.indexOf(event.target)
    if (current < 0) return
    event.preventDefault()
    let next = current
    if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = buttons.length - 1
    else {
      const direction = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1
      next = (current + direction + buttons.length) % buttons.length
    }
    const choice = question.options[next]
    buttons[next]?.focus()
    if (choice && !choices.includes(choice)) onChoose(choice)
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3 text-sm text-card-lighter-3">
        <span id="question-hint">
          {single ? 'Pick one' : `Pick up to ${question.maxChoices}`}
        </span>
        {!single ? (
          <span role="status" aria-live="polite" aria-atomic="true">
            {choices.length}/{question.maxChoices} selected
          </span>
        ) : null}
      </div>
      <div
        role={single ? 'radiogroup' : 'group'}
        aria-label={question.title}
        aria-describedby="question-hint"
        onKeyDown={navigateChoices}
        className="flex flex-col gap-2.5"
      >
        {question.options.map((choice) => {
          const selected = choices.includes(choice)
          return (
            <Pressable
              key={choice}
              type="button"
              accessibilityRole={single ? 'radio' : 'checkbox'}
              aria-checked={selected}
              tabIndex={single && choice !== focusChoice ? -1 : 0}
              disabled={saving || (full && !selected)}
              onPress={() => onChoose(choice)}
              className={`min-h-14 w-full flex-row items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-base font-semibold !transition-[transform,background-color,color] active:!scale-[0.98] motion-reduce:!transform-none motion-reduce:!transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${selected ? 'bg-white text-black' : 'bg-card-light-100 text-white'}`}
            >
              <span
                aria-hidden="true"
                data-selection-kind={single ? 'radio' : 'checkmark'}
                className={`flex size-6 shrink-0 items-center justify-center ${single ? 'rounded-full' : 'rounded-lg'} ${selected ? 'bg-cardd text-white' : 'bg-card-lighter'}`}
              >
                {selected ? (
                  <>
                    {single ? (
                      <span className="size-2.5 rounded-full bg-white" />
                    ) : (
                      <svg
                        viewBox="0 0 20 20"
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m4 10 4 4 8-8" />
                      </svg>
                    )}
                  </>
                ) : (
                  <span
                    className={`size-4 bg-card-light-100 ${single ? 'rounded-full' : 'rounded-[5px]'}`}
                  />
                )}
              </span>
              <span className="min-w-0 flex-1 break-words">{choice} </span>
            </Pressable>
          )
        })}
      </div>
    </div>
  )
}
