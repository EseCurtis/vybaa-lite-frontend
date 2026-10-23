import { PartnerEmoji } from '@/components/custom/rewind/partner-emoji.component'
import {
  questionnaireDecoration,
  questionnairePresentation,
} from '@/shared/onboarding/questionnaire-presentation'
import type { OnboardingQuestion } from '@/shared/onboarding/questionnaire-contract'
import { REWIND_PERSONAS } from '@/shared/rewind/rewind-personas'

export function QuestionnaireArt({
  question,
  reviewing,
  userId,
}: {
  question: OnboardingQuestion | undefined
  reviewing: boolean
  userId: string
}) {
  const style = questionnairePresentation(question, reviewing)
  const decoration = questionnaireDecoration(
    `${userId}:${question?.id ?? reviewing}`,
  )
  return (
    <div
      className={`relative isolate flex min-h-32 items-center py-3 ${reviewing ? 'flex-col' : 'gap-1'}`}
      style={{ color: style.accent }}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <span
          className="absolute right-3 top-2 size-3 rounded-full"
          style={{
            backgroundColor: style.accent,
            transform: `translateY(${decoration.offset}px)`,
          }}
        />
        <span
          className="absolute bottom-3 left-3 size-5 rounded-md"
          style={{
            backgroundColor: style.surface,
            transform: `rotate(${decoration.rotation + 30}deg)`,
          }}
        />
        <svg
          className="absolute right-24 top-0 size-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="m12 0 3.2 8.8L24 12l-8.8 3.2L12 24l-3.2-8.8L0 12l8.8-3.2Z" />
        </svg>
      </div>
      {reviewing ? (
        <div
          role="img"
          aria-label="All six Rewind partners together"
          className="relative z-10 grid w-full max-w-sm grid-cols-6 items-end pb-2"
        >
          {REWIND_PERSONAS.map((partner, position) => (
            <PartnerEmoji
              key={partner.id}
              partnerId={partner.id}
              emotion={style.emotion}
              decorative
              className={`w-full min-w-0 ${position % 2 ? 'translate-y-2' : ''}`}
            />
          ))}
        </div>
      ) : (
        <PartnerEmoji
          partnerId={style.partnerId}
          emotion={style.emotion}
          decorative
          className="relative z-10 size-24 shrink-0 sm:size-28"
        />
      )}
      <div
        className={`relative my-3 min-w-0 rounded-[1.4rem] px-4 py-4 ${reviewing ? 'w-full text-center' : 'flex-1 rounded-bl-md'}`}
        style={{ backgroundColor: style.surface }}
      >
        <p className="text-sm font-semibold leading-relaxed">{style.message}</p>
      </div>
    </div>
  )
}
