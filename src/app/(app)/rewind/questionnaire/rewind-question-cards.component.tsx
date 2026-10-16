import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ReactElement } from 'react'

import type { RewindQuestion } from '@/shared/api/rewind-questionnaire.api'
import { colors } from '@/shared/colors.shared'

const CARD_PALETTE = [
  { background: '#FAC000', foreground: colors.black },
  { background: '#CC5500', foreground: colors.black },
  { background: colors.success[700], foreground: colors.white },
  { background: colors.accent[700], foreground: colors.white },
]

const EMOJI_POSITIONS = [
  'right-5 top-5 rotate-12',
  'left-6 bottom-5 -rotate-12',
  'right-6 bottom-5 rotate-6',
  'left-5 top-5 -rotate-6',
]

export function RewindQuestionCards({
  question,
  index,
  total,
  complete = false,
}: {
  question: RewindQuestion | null
  index: number
  total: number
  complete?: boolean
}): ReactElement {
  const reduceMotion = useReducedMotion()
  const palette = CARD_PALETTE[index % CARD_PALETTE.length]
  const nextPalette = CARD_PALETTE[(index + 1) % CARD_PALETTE.length]
  const backPalette = CARD_PALETTE[(index + 2) % CARD_PALETTE.length]
  return (
    <div
      className="relative mx-auto w-full max-w-[340px] px-2 pb-5 pt-4"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-5 bottom-3 top-5 rotate-[5deg] rounded-2xl"
        style={{ backgroundColor: backPalette.background }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-4 bottom-4 top-5 -rotate-[4deg] rounded-2xl"
        style={{ backgroundColor: nextPalette.background }}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={question?.id ?? (complete ? 'complete' : 'preparing')}
          initial={
            reduceMotion ? false : { opacity: 0, x: 32, rotate: 4, scale: 0.97 }
          }
          animate={{ opacity: 1, x: 0, rotate: index % 2 ? 1 : -1, scale: 1 }}
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, x: -45, rotate: -5, scale: 0.98 }
          }
          transition={{ duration: reduceMotion ? 0 : 0.24, ease: 'easeOut' }}
          className="relative flex min-h-[230px] flex-col justify-center rounded-2xl px-7 py-14 sm:min-h-[260px]"
          style={{
            backgroundColor: palette.background,
            color: palette.foreground,
          }}
        >
          {question ? (
            <>
              <span
                aria-hidden="true"
                className="absolute left-5 top-2 font-display text-6xl leading-none"
              >
                “
              </span>
              <span
                aria-hidden="true"
                className={`absolute text-[30px] ${EMOJI_POSITIONS[index % EMOJI_POSITIONS.length]}`}
              >
                {question.emoji}
              </span>
              <p className="relative z-10 !text-center font-display text-[23px] font-extrabold leading-[1.3]">
                {question.text}
              </p>
              <span
                aria-hidden="true"
                className="absolute bottom-1 right-5 font-display text-6xl leading-none"
              >
                ”
              </span>
              <span className="absolute inset-x-0 bottom-5 !text-center font-bbh text-xs font-bold">
                {Math.min(index + 1, total)} / {total}
              </span>
            </>
          ) : null}
          {!question && complete ? (
            <div className="flex flex-col items-center gap-4">
              <span aria-hidden="true" className="text-3xl">
                🫶
              </span>
              <p className="!text-center font-display text-[23px] font-extrabold leading-[1.3]">
                A little clearer. A little more you.
              </p>
            </div>
          ) : null}
          {!question && !complete ? <PreparingRewindCard /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function PreparingRewindCard(): ReactElement {
  const reduceMotion = useReducedMotion()
  return (
    <div
      role="status"
      aria-label="Preparing today's questions"
      className="flex flex-col items-center gap-3"
    >
      <motion.span
        aria-hidden="true"
        className="font-display text-6xl font-extrabold leading-none"
        animate={
          reduceMotion ? undefined : { y: [0, -4, 0], rotate: [-5, 5, -5] }
        }
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        ?
      </motion.span>
      <div
        aria-hidden="true"
        className="flex flex-col items-center gap-2"
        style={{ color: colors.warning[700] }}
      >
        <span className="h-2 w-32 rounded-full bg-current" />
        <span className="h-2 w-24 rounded-full bg-current" />
        <div className="mt-3 flex gap-2">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="size-2 rounded-full bg-current"
              animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: dot * 0.18,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
