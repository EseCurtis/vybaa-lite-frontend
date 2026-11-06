import {
  RiArrowDownSLine,
  RiCheckboxCircleLine,
  RiLockLine,
  RiMoonLine,
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
  reflectionDirectAddress,
  reflectionStoryVariation,
  reflectionSummaryPassages,
} from '@/shared/rewind/daily-reflection-story'
import { REWIND_PERSONAS } from '@/shared/rewind/rewind-personas'

import { DailyReflectionActivity } from './daily-reflection-activity.component'

export function DailyReflectionStory({
  reflection,
  avatars,
  firstName,
  username,
}: {
  reflection: DailyReflection
  avatars: ReactNode
  firstName?: string
  username?: string
}): ReactElement {
  const reducedMotion = useReducedMotion()
  const [expanded, setExpanded] = useState(false)
  const detailsId = useId()
  const partners = REWIND_PERSONAS.filter((persona) =>
    reflection.participantIds.includes(persona.id),
  )
  const activities = reflectionActivities(reflection.sourceCounts)
  const variation = reflectionStoryVariation(
    reflection.id + ':' + reflection.localDateKey,
  )
  const ready = reflection.state === 'READY'
  const name = username?.trim() || firstName?.trim() || ''
  const passages = reflectionSummaryPassages(reflection.summary)
  const compact = reflection.summary.trim().split(/\s+/u).length <= 110
  const visiblePassages = compact ? passages : passages.slice(0, 1)
  const extraPassages = compact ? [] : passages.slice(1)
  const hasDetails =
    extraPassages.length ||
    reflection.insights.length ||
    (ready && activities.length)
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
      className="flex min-w-0 flex-col gap-6 pb-8 pt-3 font-bbh"
      aria-label="Daily reflection story"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h1 className="text-base font-semibold text-white">
            <time dateTime={reflection.localDateKey}>
              {new Date(
                reflection.localDateKey + 'T12:00:00',
              ).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </h1>
          <p className="flex items-center gap-1.5 text-xs text-card-lighter-3">
            <StateIcon
              size={14}
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
        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        aria-label="The day's reflection"
        className="min-w-0 space-y-5"
      >
        <div className="space-y-4">
          {visiblePassages.map((passage, index) => (
            <p
              key={index + ':' + passage}
              className="whitespace-pre-line break-words text-base leading-7 text-white [overflow-wrap:anywhere]"
            >
              {reflectionDirectAddress(passage, name)}
            </p>
          ))}
        </div>
        {ready && partners.length ? (
          <div
            className="flex flex-wrap items-center gap-3 pt-1"
            aria-label="Contributing partners"
          >
            <div className="flex -space-x-2" aria-hidden="true">
              {partners.slice(0, 3).map((partner) => (
                <PartnerEmoji
                  key={partner.id}
                  partnerId={partner.id}
                  emotion={variation.emotion}
                  decorative
                  className="size-12"
                />
              ))}
            </div>
            <p className="min-w-0 text-xs leading-5 text-card-lighter-3">
              {partners.map((partner) => partner.name).join(' · ')}
            </p>
          </div>
        ) : null}
      </motion.section>

      {hasDetails ? (
        <div>
          <Pressable
            type="button"
            aria-expanded={expanded}
            aria-controls={detailsId}
            onPress={() => setExpanded((previous) => !previous)}
            className="min-h-11 items-center gap-2 rounded-full pr-3 text-xs font-semibold text-card-lighter-3 outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:!scale-[0.98]"
          >
            {expanded ? 'Less for now' : 'A little more'}
            <RiArrowDownSLine
              size={18}
              aria-hidden="true"
              className={expanded ? 'rotate-180' : ''}
            />
          </Pressable>
          <div id={detailsId} hidden={!expanded} className="space-y-7 pt-4">
            {extraPassages.length ? (
              <div className="space-y-4">
                {extraPassages.map((passage, index) => (
                  <p
                    key={index + ':' + passage}
                    className="whitespace-pre-line break-words text-sm leading-7 text-card-lighter-3 [overflow-wrap:anywhere]"
                  >
                    {reflectionDirectAddress(passage, name)}
                  </p>
                ))}
              </div>
            ) : null}
            {reflection.insights.length ? (
              <section aria-label="Other thoughts">
                <ol className="space-y-4">
                  {reflection.insights.map((insight, index) => (
                    <li
                      key={index + ':' + insight}
                      className="flex min-w-0 items-start gap-3"
                    >
                      <span className="pt-1 text-xs tabular-nums text-card-lighter-3">
                        {index + 1}.
                      </span>
                      <p className="min-w-0 whitespace-pre-line break-words text-sm leading-7 text-card-lighter-3 [overflow-wrap:anywhere]">
                        {reflectionDirectAddress(insight, name)}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
            {ready ? <DailyReflectionActivity activities={activities} /> : null}
          </div>
        </div>
      ) : null}
    </article>
  )
}
