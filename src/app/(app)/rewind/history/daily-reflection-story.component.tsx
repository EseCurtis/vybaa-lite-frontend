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
    reflectionStoryVariation,
    reflectionSummaryPassages,
} from '@/shared/rewind/daily-reflection-story'
import { REWIND_PERSONAS } from '@/shared/rewind/rewind-personas'

import {
    DailyReflectionActivity,
    REFLECTION_TONE_CLASS,
} from './daily-reflection-activity.component'

// ─── seeded opening lines ─────────────────────────────────────────────────────
// Each takes (name, partnerName) — name may be empty, partnerName may be empty.

type Opener = (name: string, partnerName: string) => string

const OPENERS: Opener[] = [
  (n, p) =>
    n
      ? `Hey ${n}${p ? `, from your time with ${p}` : ''}, something's been on my mind.`
      : `${p ? `From your time with ${p}, ` : ''}something caught my attention today.`,
  (n, p) =>
    n
      ? `${n}${p ? ` — you and ${p} touched on something` : ', there was a thread'} worth pulling on.`
      : `${p ? `You and ${p} touched on something` : 'There was a thread today'} worth pulling on.`,
  (n, p) =>
    n
      ? `I noticed a pattern, ${n}${p ? ` — it showed up in your conversation with ${p}` : ''}.`
      : `There was a pattern today${p ? ` — it came up with ${p}` : ''}.`,
  (n, p) =>
    `${p ? `${p} heard something in you today` : "Something came through today"}${n ? `, ${n}` : ''}.`,
  (n, p) =>
    n
      ? `${n}, this kept coming up${p ? ` — even with ${p}` : ''}.`
      : `This kept coming up${p ? ` with ${p}` : ''} today.`,
]

function seededInt(seed: string, slot: number): number {
  let hash = 2166136261
  for (const ch of `${seed}:${slot}`)
    hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619)
  return hash >>> 0
}

function seededOpener(
  seed: string,
  name: string,
  partnerName: string,
): string {
  const index = seededInt(seed, 7) % OPENERS.length
  const fn = OPENERS[index] ?? OPENERS[0]!
  return fn(name, partnerName)
}

// ─── component ───────────────────────────────────────────────────────────────

export function DailyReflectionStory({
  reflection,
  avatars,
  firstName,
}: {
  reflection: DailyReflection
  avatars: ReactNode
  firstName?: string
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

  // Primary speaker — first partner, or none
  const speaker = partners[0]
  const name = firstName?.trim() ?? ''
  const partnerName = speaker?.name ?? ''
  const opener = ready
    ? seededOpener(reflection.id, name, partnerName)
    : ''

  // Personalise "the user" → name or "you"
  const personalise = (text: string): string =>
    name
      ? text.replace(/\bthe user\b/gi, name)
      : text.replace(/\bthe user\b/gi, 'you')

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
      className="flex min-w-0 flex-col gap-10 pb-8 pt-3 font-bbh"
      aria-label="Daily reflection story"
    >
      {/* ── date header ── */}
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs text-card-lighter-3">
            {new Date(`${reflection.localDateKey}T12:00:00`).toLocaleDateString(
              undefined,
              { weekday: 'long' },
            )}
          </p>
          <h1 className="text-[clamp(1.6rem,6vw,2.25rem)] font-semibold leading-tight tracking-tight text-white">
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
          <p className="flex items-center gap-1.5 text-[11px] text-card-lighter-3">
            <StateIcon
              size={13}
              className={ready ? 'text-success-400' : 'text-warning-400'}
              aria-hidden="true"
            />
            {stateLabels[reflection.state]}
          </p>
        </div>
        {avatars}
      </header>

      {/* ── the message ── */}
      <motion.section
        key={reflection.id}
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        aria-label="The day's reflection"
        className="flex flex-col gap-5 rounded-[28px] bg-card-light-100 p-5 sm:p-6"
      >
        {/* speaker row — only when there's a partner */}
        {ready && speaker ? (
          <div className="flex items-end gap-3">
            <PartnerEmoji
              partnerId={speaker.id}
              emotion={variation.emotion}
              decorative
              className="size-16 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-card-lighter-3">
                {speaker.name}
              </p>
              <p
                className={`mt-0.5 text-sm font-medium leading-snug ${REFLECTION_TONE_CLASS[variation.tone]}`}
              >
                {opener}
              </p>
            </div>
          </div>
        ) : null}

        {/* summary — the main message body */}
        <ReflectionSummary
          key={reflection.id}
          summary={reflection.summary}
          personalise={personalise}
        />

        {/* secondary partners as quiet handles */}
        {ready && partners.length > 1 ? (
          <div
            className="flex flex-wrap gap-x-3 gap-y-1"
            aria-label="Contributing partners"
          >
            {partners.slice(1).map((partner) => (
              <span
                key={partner.id}
                className="text-[11px] text-card-lighter-3"
              >
                @{partner.id}
              </span>
            ))}
          </div>
        ) : null}
      </motion.section>

      {/* ── what stood out — kept as list for a11y tests ── */}
      {reflection.insights.length > 0 ? (
        <section role="region" aria-label="What stood out" className="space-y-3">
          {reflection.insights.map((insight, index) => {
            const style = reflectionStoryVariation(
              `${reflection.id}:insights`,
              index,
            )
            const partner = partners[index % Math.max(partners.length, 1)]
            return (
              <motion.li
                key={`${index}:${insight}`}
                role="listitem"
                initial={reducedMotion ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  bounce: 0,
                  duration: 0.28,
                  delay: index * 0.045,
                }}
                data-story-layout={style.layout}
                className="flex min-w-0 items-start gap-3 px-1 py-2"
              >
                {/* partner emoji as the voice */}
                {partner ? (
                  <PartnerEmoji
                    partnerId={partner.id}
                    emotion={index === 0 ? 'thinking' : style.layout === 'note' ? 'love' : 'listening'}
                    decorative
                    className="mt-0.5 size-9 shrink-0"
                  />
                ) : (
                  <span
                    className={`mt-1 shrink-0 text-xs font-bold tabular-nums ${REFLECTION_TONE_CLASS[style.tone]}`}
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}

                <p className="min-w-0 flex-1 whitespace-pre-line break-words text-sm leading-7 text-white [overflow-wrap:anywhere]">
                  {personalise(insight)}
                </p>
              </motion.li>
            )
          })}
        </section>
      ) : null}

      {/* ── activity breakdown — secondary, quiet ── */}
      {ready ? <DailyReflectionActivity activities={activities} /> : null}
    </article>
  )
}

// ─── summary with expand ──────────────────────────────────────────────────────

function ReflectionSummary({
  summary,
  personalise,
}: {
  summary: string
  personalise: (text: string) => string
}): ReactElement {
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  const passages = reflectionSummaryPassages(summary)

  return (
    <div className="min-w-0">
      <p className="whitespace-pre-line break-words text-[1.0625rem] font-medium leading-8 text-white [overflow-wrap:anywhere]">
        {personalise(passages[0] ?? summary)}
      </p>
      {passages.length > 1 ? (
        <>
          <div id={id} hidden={!expanded} className="mt-4 space-y-4">
            {passages.slice(1).map((passage, index) => (
              <p
                key={`${index}:${passage}`}
                className="whitespace-pre-line break-words text-sm leading-7 text-card-lighter-3 [overflow-wrap:anywhere]"
              >
                {personalise(passage)}
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
