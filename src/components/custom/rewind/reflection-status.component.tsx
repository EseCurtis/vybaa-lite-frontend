import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'

import { PartnerEmoji } from './partner-emoji.component'
import type { PartnerEmotion } from '@/shared/rewind/partner-emojis'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'

const EXPRESSIONS: PartnerEmotion[] = ['thinking', 'typing', 'listening']

export function ReflectionProcessingStatus({
  partnerId,
  message = 'Preparing summary for you…',
}: {
  partnerId: RewindPersonaId
  message?: string
}): ReactElement {
  const reducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (reducedMotion) return
    const interval = window.setInterval(() => {
      if (!document.hidden)
        setIndex((value) => (value + 1) % EXPRESSIONS.length)
    }, 1800)
    return () => window.clearInterval(interval)
  }, [reducedMotion])
  const emotion = reducedMotion
    ? 'thinking'
    : (EXPRESSIONS[index] ?? 'thinking')
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col items-center gap-4 px-5 py-10 text-center font-bbh"
    >
      <div className="relative size-28" aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.div
            key={`${partnerId}:${emotion}`}
            className="absolute inset-0"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.22 }}
          >
            <PartnerEmoji
              partnerId={partnerId}
              emotion={emotion}
              decorative
              className="size-full"
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="text-base font-semibold leading-6 text-white">{message}</p>
      <p className="text-xs text-card-lighter-2">
        w/ @{getRewindPersona(partnerId).id}
      </p>
    </div>
  )
}

export function MissedRewindStatus({
  partnerId,
}: {
  partnerId: RewindPersonaId
}): ReactElement {
  return (
    <div className="flex flex-col items-center gap-4 px-5 py-12 text-center font-bbh">
      <PartnerEmoji
        partnerId={partnerId}
        emotion="listening"
        className="size-28"
      />
      <h1 className="text-xl font-semibold leading-7 text-white">
        You missed this Rewind
      </h1>
      <p className="max-w-64 text-sm leading-6 text-card-lighter-2">
        No summary was created for this session.
      </p>
    </div>
  )
}
