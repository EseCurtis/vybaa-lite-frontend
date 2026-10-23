import { RiArrowRightLine, RiDoubleQuotesL } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { useState } from 'react'

import { QueryFeedback } from '@/components/common/query-feedback.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { PartnerEmoji } from '@/components/custom/rewind/partner-emoji.component'
import { Pressable } from '@/components/layout/pressables.component'
import { useRewindInsights } from '@/hooks/use-rewind.hook'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'

const STARTER_THOUGHTS = [
  'What is one small thing from today you would like to keep?',
  'If today had a title, what would you call it?',
  'What gave you a little breathing room lately?',
  'Which moment deserves a kinder second look?',
  'What felt like you today, even for a minute?',
] as const

export function HomePerspective({
  personaId = 'ella',
}: {
  personaId?: RewindPersonaId | null
}): ReactElement {
  const query = useRewindInsights('7d')
  const navigate = useNavigate()
  const persona = getRewindPersona(personaId ?? 'ella')
  const [starterThought] = useState(
    () =>
      STARTER_THOUGHTS[Math.floor(Math.random() * STARTER_THOUGHTS.length)] ??
      STARTER_THOUGHTS[0],
  )
  const insight = query.data?.contextualInsight?.trim() || null
  if (query.isPending && !query.data)
    return (
      <section
        role="status"
        aria-label="Loading your reflection highlight"
        className="space-y-4 px-mg py-6"
      >
        <Skeleton height={18} width="45%" />
        <Skeleton height={20} width="90%" />
        <Skeleton height={20} width="70%" />
      </section>
    )
  if (query.isError && !query.data)
    return (
      <div className="px-mg py-5">
        <QueryFeedback
          message="Your reflection highlight couldn’t load."
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      </div>
    )
  return (
    <section
      aria-labelledby="home-perspective-title"
      className="px-mg pt-6 pb-28"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="home-perspective-title"
          className="font-bbh text-lg font-bold text-white"
        >
          {insight ? 'Worth keeping' : 'A little perspective'}
        </h2>
        <RiDoubleQuotesL
          size={24}
          aria-hidden="true"
          className="shrink-0 text-card-lighter"
        />
      </div>
      <div className="mt-5 flex items-start gap-3">
        <p className="min-w-0 flex-1 break-words font-bbh text-sm font-medium text-card-lighter">
          {insight ?? starterThought}
        </p>
        <PartnerEmoji
          partnerId={persona.id}
          emotion={insight ? 'listening' : 'thinking'}
          decorative
          className="size-20 shrink-0"
        />
      </div>
      {insight ? (
        <p className="mt-3 font-bbh text-xs text-card-lighter-3">
          From your reflections · last 7 days
        </p>
      ) : null}
      <Pressable
        type="button"
        accessibilityLabel={
          insight ? 'View your reflections' : `Open Rewind with ${persona.name}`
        }
        onPress={() =>
          void navigate({ to: insight ? '/app/rewind-history' : '/app/rewind' })
        }
        className="mt-4 min-h-11 flex-row items-center gap-2 rounded-full bg-card-light px-4 font-bbh text-sm font-bold text-white"
      >
        {insight ? 'Your reflections' : 'Make a little space'}
        <RiArrowRightLine size={17} aria-hidden="true" />
      </Pressable>
    </section>
  )
}
