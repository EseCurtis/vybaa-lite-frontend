import {
  RiArrowDownSLine,
  RiCalendar2Line,
  RiCheckLine,
  RiRefreshLine,
  RiSparklingLine,
  RiTimeLine,
  RiUserVoiceLine,
} from '@remixicon/react'
import { motion } from 'framer-motion'
import type { CSSProperties, ReactElement } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { usePaginatedRewindSessions } from '@/hooks/use-rewind.hook'
import type {
  RewindGuidedQuestionId,
  RewindGuidedResponse,
  RewindSession,
} from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'
import {
  adjustColor,
  normalizePages,
  seededColor,
} from '@/shared/utils/helpers.util'

type RewindAccentStyle = CSSProperties & {
  '--accent'?: string
  '--accent-soft'?: string
}

const REWIND_PROMPT_COUNT = 5

const RESPONSE_LABELS: Record<RewindGuidedQuestionId, string> = {
  meaningful: 'Meaningful',
  draining: 'Draining',
  progress: 'Progress',
  different: 'Different',
  tomorrow_need: 'Tomorrow',
}

function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatSessionTime(value: string): string {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function getGuidedResponses(session: RewindSession): RewindGuidedResponse[] {
  return Object.values(session.responses)
    .filter((response): response is RewindGuidedResponse =>
      Boolean(response?.shortSummary),
    )
    .sort((left, right) => left.updatedAt - right.updatedAt)
}

function getSessionAccent(personaId: RewindSession['personaId']): {
  accent: string
  accentSoft: string
} {
  const accent = adjustColor(seededColor(personaId), {
    lightness: -6,
    saturation: -18,
  })
  const accentSoft = adjustColor(accent, {
    alpha: -0.78,
  })

  return { accent, accentSoft }
}

function RewindSkeletonRow(): ReactElement {
  return (
    <View
      className="gap-3 rounded-[22px] px-4 py-4"
      style={{ backgroundColor: colors['card-light-50'] }}
    >
      <View
        className="h-3 w-28 animate-pulse rounded-full"
        style={{ backgroundColor: colors['card-lighter'] }}
      />
      <View
        className="h-5 w-44 max-w-full animate-pulse rounded-full"
        style={{ backgroundColor: colors['card-lighter'] }}
      />
      <View
        className="h-3 w-full animate-pulse rounded-full"
        style={{ backgroundColor: colors.card[300] }}
      />
      <View
        className="h-3 w-2/3 animate-pulse rounded-full"
        style={{ backgroundColor: colors.card[300] }}
      />
    </View>
  )
}

function RewindSummaryMetric({
  label,
  value,
}: {
  label: string
  value: string | number
}): ReactElement {
  return (
    <View
      className="min-w-0 flex-1 gap-1 rounded-[18px] px-3 py-3"
      style={{ backgroundColor: colors['card-light-50'] }}
    >
      <Text
        className="truncate font-bbh text-[10px] font-bold uppercase tracking-[0.16em]"
        style={{ color: colors['card-lighter-3'] }}
      >
        {label}
      </Text>
      <Text
        className="truncate font-bbh text-base font-bold"
        style={{ color: colors.white }}
      >
        {value}
      </Text>
    </View>
  )
}

function RewindEmptyState(): ReactElement {
  return (
    <View
      className="items-center gap-3 rounded-[24px] px-6 py-12"
      style={{ backgroundColor: colors['card-light-50'] }}
    >
      <View
        className="h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: colors['card-light'] }}
      >
        <RiUserVoiceLine
          size={22}
          style={{ color: colors['card-lighter-2'] }}
        />
      </View>
      <Text
        className="font-bbh text-base font-bold"
        style={{ color: colors.white }}
      >
        No rewind sessions yet
      </Text>
      <Text
        className="max-w-[260px] text-center font-bbh text-sm leading-6"
        style={{ color: colors['card-lighter-2'] }}
      >
        Start a Rewind conversation and the saved reflections will collect here.
      </Text>
    </View>
  )
}

function RewindErrorState({ onRetry }: { onRetry: () => void }): ReactElement {
  return (
    <View
      className="items-center gap-3 rounded-[24px] px-6 py-12"
      style={{ backgroundColor: colors['card-light-50'] }}
    >
      <Text
        className="font-bbh text-base font-bold"
        style={{ color: colors.white }}
      >
        Couldn&apos;t load your rewinds
      </Text>
      <Text
        className="max-w-[260px] text-center font-bbh text-sm leading-6"
        style={{ color: colors['card-lighter-2'] }}
      >
        Check your connection and try again.
      </Text>
      <Button
        label="Retry"
        variant="secondary"
        size="sm"
        className="mt-2"
        leftIcon={<RiRefreshLine size={18} className="text-white" />}
        onClick={onRetry}
      />
    </View>
  )
}

function RewindProgress({
  accent,
  answeredCount,
}: {
  accent: string
  answeredCount: number
}): ReactElement {
  const progressStyle: RewindAccentStyle = {
    '--accent': accent,
    '--accent-soft': colors.card[300],
  }

  return (
    <View className="mt-3 flex-row gap-1.5">
      {Array.from({ length: REWIND_PROMPT_COUNT }).map((_, index) => {
        const isAnswered = index < answeredCount

        return (
          <View
            key={index}
            className="h-1.5 flex-1 rounded-full"
            style={{
              ...progressStyle,
              backgroundColor: isAnswered
                ? 'var(--accent)'
                : 'var(--accent-soft)',
            }}
          />
        )
      })}
    </View>
  )
}

function RewindResponseList({
  responses,
}: {
  responses: RewindGuidedResponse[]
}): ReactElement | null {
  if (!responses.length) {
    return null
  }

  return (
    <View className="mt-4 gap-3">
      {responses.slice(0, 3).map((response) => (
        <View key={response.questionId} className="gap-1">
          <Text
            className="font-bbh text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: colors['card-lighter-3'] }}
          >
            {RESPONSE_LABELS[response.questionId]}
          </Text>
          <Text
            className="font-bbh text-sm leading-6"
            style={{ color: colors.neutral[100] }}
          >
            {response.shortSummary}
          </Text>
        </View>
      ))}
    </View>
  )
}

function RewindSessionRow({
  index,
  session,
}: {
  index: number
  session: RewindSession
}): ReactElement {
  const persona = getRewindPersona(session.personaId)
  const responses = getGuidedResponses(session)
  const answeredCount = responses.length
  const latestResponse = responses[responses.length - 1]
  const { accent, accentSoft } = getSessionAccent(session.personaId)
  const accentStyle: RewindAccentStyle = {
    '--accent': accent,
    '--accent-soft': accentSoft,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.16), duration: 0.22 }}
      className="rounded-[24px] px-4 py-4"
      style={{
        ...accentStyle,
        backgroundColor: colors['card-light-50'],
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--accent-soft)' }}
        >
          <RiUserVoiceLine size={20} style={{ color: accent }} />
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text
                className="font-bbh text-sm font-bold"
                style={{ color: colors.white }}
              >
                {persona.name} Rewind
              </Text>
              <View className="mt-1 flex-row flex-wrap gap-2">
                <View className="flex-row items-center gap-1.5">
                  <RiCalendar2Line
                    size={12}
                    style={{ color: colors['card-lighter-3'] }}
                  />
                  <Text
                    className="font-bbh text-[11px]"
                    style={{ color: colors['card-lighter-2'] }}
                  >
                    {formatSessionDate(session.createdAt)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <RiTimeLine
                    size={12}
                    style={{ color: colors['card-lighter-3'] }}
                  />
                  <Text
                    className="font-bbh text-[11px]"
                    style={{ color: colors['card-lighter-2'] }}
                  >
                    {formatSessionTime(session.createdAt)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="items-end gap-1">
              <View
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{
                  backgroundColor: session.completed
                    ? 'var(--accent-soft)'
                    : colors['card-light'],
                }}
              >
                <RiCheckLine
                  size={16}
                  style={{
                    color: session.completed
                      ? accent
                      : colors['card-lighter-3'],
                  }}
                />
              </View>
              <Text
                className="font-bbh text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{
                  color: session.completed ? accent : colors['card-lighter-3'],
                }}
              >
                {session.completed ? 'Complete' : 'Open'}
              </Text>
            </View>
          </View>

          <View className="mt-4 gap-2">
            <Text
              className="font-bbh text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: colors['card-lighter-3'] }}
            >
              Latest reflection
            </Text>
            <Text
              className="font-bbh text-sm leading-6"
              style={{ color: colors.neutral[100] }}
            >
              {latestResponse?.shortSummary ??
                'This session has not captured a reflection yet.'}
            </Text>
          </View>

          <RewindProgress accent={accent} answeredCount={answeredCount} />

          <View className="mt-2 flex-row items-center justify-between">
            <Text
              className="font-bbh text-xs"
              style={{ color: colors['card-lighter-2'] }}
            >
              {answeredCount}/{REWIND_PROMPT_COUNT} prompts answered
            </Text>
            <Text
              className="font-bbh text-xs"
              style={{ color: colors['card-lighter-2'] }}
            >
              {session.sessionDateKey ?? 'No date key'}
            </Text>
          </View>

          <RewindResponseList responses={responses} />
        </View>
      </View>
    </motion.div>
  )
}

export default function RewindHistoryScreen(): ReactElement {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = usePaginatedRewindSessions()

  const sessions = normalizePages<RewindSession>(data?.pages)
  const firstPage = data?.pages[0]
  const totalSessions = firstPage?.pagination.totalCount ?? sessions.length
  const completedSessions = sessions.filter(
    (session) => session.completed,
  ).length
  const latestSession = sessions[0]
  const latestLabel = latestSession
    ? formatSessionDate(latestSession.createdAt)
    : 'No sessions'

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cardd }}>
      <NoiseComponent>
        <TabHeader title="Rewind History" />

        <View className="flex-1 overflow-y-auto px-mg pb-[120px] pt-1">
          <View className="mx-auto w-full max-w-3xl">
            <View className="gap-4">
              <View className="gap-1 px-1">
                <Text
                  className="font-bbh text-lg font-bold"
                  style={{ color: colors.white }}
                >
                  Saved rewinds
                </Text>
                <Text
                  className="font-bbh text-sm leading-6"
                  style={{ color: colors['card-lighter-2'] }}
                >
                  Review what you captured, what was completed, and the last
                  thread worth revisiting.
                </Text>
              </View>

              <View className="grid grid-cols-3 gap-2">
                <RewindSummaryMetric label="Sessions" value={totalSessions} />
                <RewindSummaryMetric
                  label="Completed"
                  value={completedSessions}
                />
                <RewindSummaryMetric label="Latest" value={latestLabel} />
              </View>

              <View
                className="gap-3 rounded-[24px]  py-4"
               
              >
                <View className="flex-row items-center justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <Text
                      className="font-bbh text-sm font-bold"
                      style={{ color: colors.white }}
                    >
                      Archive
                    </Text>
                    <Text
                      className="mt-1 font-bbh text-xs uppercase tracking-[0.16em]"
                      style={{ color: colors['card-lighter-3'] }}
                    >
                      Ordered by most recent
                    </Text>
                  </View>

                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors['card-light'] }}
                  >
                    <RiSparklingLine
                      size={18}
                      style={{ color: colors['card-lighter-2'] }}
                    />
                  </View>
                </View>

                {isLoading ? (
                  <View className="gap-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <RewindSkeletonRow key={index} />
                    ))}
                  </View>
                ) : isError ? (
                  <RewindErrorState
                    onRetry={() => {
                      void refetch()
                    }}
                  />
                ) : sessions.length ? (
                  <View className="gap-2">
                    {sessions.map((session, index) => (
                      <RewindSessionRow
                        key={session.id}
                        index={index}
                        session={session}
                      />
                    ))}

                    {hasNextPage && (
                      <Button
                        label={
                          isFetchingNextPage
                            ? 'Loading...'
                            : 'Load more rewinds'
                        }
                        variant="secondary"
                        fullWidth
                        className="mt-2"
                        disabled={isFetchingNextPage}
                        rightIcon={
                          <RiArrowDownSLine size={20} className="text-white" />
                        }
                        onClick={() => {
                          void fetchNextPage()
                        }}
                      />
                    )}
                  </View>
                ) : (
                  <RewindEmptyState />
                )}
              </View>

              {error instanceof Error && (
                <Text
                  className="px-1 font-bbh text-xs"
                  style={{ color: colors['card-lighter-3'] }}
                >
                  {error.message}
                </Text>
              )}
            </View>
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
