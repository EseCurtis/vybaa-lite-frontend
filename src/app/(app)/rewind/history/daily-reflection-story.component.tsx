import {
  RiArrowDownSLine,
  RiCheckboxCircleLine,
  RiDoubleQuotesL,
  RiEyeLine,
  RiLightbulbFlashLine,
  RiLockLine,
  RiMoonLine,
  RiSparkling2Line,
  RiTimeLine,
} from '@remixicon/react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactElement, ReactNode } from 'react'
import { useId, useState } from 'react'

import { PartnerEmoji } from '@/components/custom/rewind/partner-emoji.component'
import { Pressable } from '@/components/layout/pressables.component'
import type { DailyReflection } from '@/shared/api/reflections.api'
import {
  reflectionActivities,
  reflectionStoryVariation,
  reflectionSummaryPassages,
} from '@/shared/rewind/daily-reflection-story'
import { REWIND_PERSONAS } from '@/shared/rewind/rewind-personas'

import {
  DailyReflectionActivity,
  REFLECTION_TONE_CLASS,
} from './daily-reflection-activity.component'

export function DailyReflectionStory({
  reflection,
  avatars,
}: {
  reflection: DailyReflection
  avatars: ReactNode
}): ReactElement {
  const reducedMotion = useReducedMotion()
  const partners = REWIND_PERSONAS.filter((persona) =>
    reflection.participantIds.includes(persona.id),
  )
  const activities = reflectionActivities(reflection.sourceCounts)
  const variation = reflectionStoryVariation(
    `${reflection.id}:${reflection.localDateKey}`,
  )
  const ready = reflection.state === 'READY'
  const stateIcons = {
    COLLECTING: RiTimeLine,
    EMPTY: RiMoonLine,
    PRIVATE: RiLockLine,
    READY: RiCheckboxCircleLine,
  }
  const StateIcon = stateIcons[reflection.state]
  const stateLabels = {
    COLLECTING: 'Taking shape',
    EMPTY: 'Quiet day',
    PRIVATE: 'Personalization off',
    READY: 'Saved',
  }
  return (
    <article
      className="flex min-w-0 flex-col gap-9 pb-8 pt-3 font-bbh"
      aria-label="Daily reflection story"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-sm text-card-lighter-3">
            {new Date(`${reflection.localDateKey}T12:00:00`).toLocaleDateString(
              undefined,
              { weekday: 'long' },
            )}
          </p>
          <h1 className="text-[clamp(1.75rem,7vw,2.5rem)] font-semibold leading-tight tracking-tight text-white">
            <time dateTime={reflection.localDateKey}>
              {new Date(
                `${reflection.localDateKey}T12:00:00`,
              ).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </h1>
          <p className="flex items-center gap-1.5 text-xs text-card-lighter-3">
            <StateIcon
              size={15}
              className={ready ? 'text-success-400' : 'text-warning-400'}
              aria-hidden="true"
            />
            {stateLabels[reflection.state]}
          </p>
        </div>
        {avatars}
      </header>
      <motion.section
        key={reflection.id}
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
        aria-label="The day's reflection"
        className="relative rounded-[28px] bg-card-light-100 p-5 sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <RiDoubleQuotesL
            size={28}
            className={REFLECTION_TONE_CLASS[variation.tone]}
            aria-hidden="true"
          />
          <RiSparkling2Line
            size={20}
            className="text-card-lighter-3"
            aria-hidden="true"
            style={{ transform: `rotate(${variation.rotation * 6}deg)` }}
          />
        </div>
        <ReflectionSummary key={reflection.id} summary={reflection.summary} />
        {ready && partners.length ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex flex-wrap gap-x-2 gap-y-1"
              aria-label="Contributing partners"
            >
              {partners.map((partner) => (
                <span key={partner.id} className="text-xs text-card-lighter-3">
                  @{partner.id}
                </span>
              ))}
            </div>
            <div className="flex items-end -space-x-3" aria-hidden="true">
              {partners.slice(0, 3).map((partner, index) => (
                <motion.div
                  key={partner.id}
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                  style={{
                    transform: `rotate(${reflectionStoryVariation(reflection.id, index).rotation * 3}deg)`,
                  }}
                >
                  <PartnerEmoji
                    partnerId={partner.id}
                    emotion={variation.emotion}
                    decorative
                    className="size-16"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        ) : null}
      </motion.section>
      {ready ? <DailyReflectionActivity activities={activities} /> : null}
      {reflection.insights.length ? (
        <section aria-label="What stood out" className="space-y-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
            <RiLightbulbFlashLine
              size={21}
              aria-hidden="true"
              className="text-warning-400"
            />
            What stood out
          </h2>
          <ol className="space-y-4">
            {reflection.insights.map((insight, index) => {
              const style = reflectionStoryVariation(
                `${reflection.id}:insights`,
                index,
              )
              const partner = partners[index % Math.max(partners.length, 1)]
              const Icon =
                style.layout === 'aside' ? RiEyeLine : RiLightbulbFlashLine
              return (
                <motion.li
                  key={`${index}:${insight}`}
                  initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                  data-story-layout={style.layout}
                  className={`flex min-w-0 items-start gap-3 ${style.layout === 'note' ? 'rounded-[24px] bg-card-light-50 p-5' : 'px-1 py-3'}`}
                >
                  <div
                    className={`flex shrink-0 flex-col items-center gap-3 pt-1 ${REFLECTION_TONE_CLASS[style.tone]}`}
                  >
                    <span className="text-xs font-semibold tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <Icon size={21} aria-hidden="true" />
                  </div>
                  <p className="min-w-0 flex-1 whitespace-pre-line break-words text-sm leading-7 text-white [overflow-wrap:anywhere]">
                    {insight}
                  </p>
                  {style.layout === 'aside' && partner ? (
                    <PartnerEmoji
                      partnerId={partner.id}
                      emotion="thinking"
                      decorative
                      className="mt-1 size-14"
                    />
                  ) : null}
                </motion.li>
              )
            })}
          </ol>
        </section>
      ) : null}
    </article>
  )
}

function ReflectionSummary({ summary }: { summary: string }): ReactElement {
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  const passages = reflectionSummaryPassages(summary)
  return (
    <div className="min-w-0">
      <p className="whitespace-pre-line break-words text-[1.0625rem] font-medium leading-8 text-white [overflow-wrap:anywhere]">
        {passages[0] ?? summary}
      </p>
      {passages.length > 1 ? (
        <>
          <div id={id} hidden={!expanded} className="mt-4 space-y-4">
            {passages.slice(1).map((passage, index) => (
              <p
                key={`${index}:${passage}`}
                className="whitespace-pre-line break-words text-sm leading-7 text-card-lighter-3 [overflow-wrap:anywhere]"
              >
                {passage}
              </p>
            ))}
          </div>
          <Pressable
            type="button"
            aria-expanded={expanded}
            aria-controls={id}
            onPress={() => setExpanded((previous) => !previous)}
            className="mt-3 min-h-11 items-center gap-2 rounded-full pr-3 text-xs font-semibold text-white outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:!scale-[0.98]"
          >
            {expanded ? 'Show less' : 'Read the full story'}
            <RiArrowDownSLine
              size={18}
              aria-hidden="true"
              className={expanded ? 'rotate-180' : ''}
            />
          </Pressable>
        </>
      ) : null}
    </div>
  )
}
