import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiCloseLine,
  RiRefreshLine,
  RiSparklingLine,
} from '@remixicon/react'
import type { ReactElement } from 'react'
import { useState } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useDismissRewindObservation,
  useRewindObservations,
} from '@/hooks/use-rewind.hook'
import type {
  RewindActivitySource,
  RewindObservation,
} from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'

import { RewindIntelligenceTabs } from './rewind-intelligence-tabs.component'

const SOURCE_LABELS: Record<RewindActivitySource, string> = {
  ACHIEVEMENT: 'Achievements',
  FLEXX: 'Flexx',
  GOAL: 'Goals',
  JOURNAL: 'Journal',
  REWARD: 'Rewards',
  REWIND_CHAT: 'Chat',
  REWIND_ROUTINE: 'Routine',
  REWIND_VOICE: 'Rewind',
}

function formatObservationDate(localDateKey: string): string {
  const date = new Date(`${localDateKey}T12:00:00`)
  if (Number.isNaN(date.getTime())) return localDateKey
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(date)
}

function formatEvidenceTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function ObservationCard({
  observation,
  onDismiss,
}: {
  observation: RewindObservation
  onDismiss: (observationId: string) => void
}): ReactElement {
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false)
  const persona = observation.personaId
    ? getRewindPersona(observation.personaId)
    : null

  return (
    <View className="gap-5 rounded-2xl bg-cardx px-5 py-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-bbh text-xs font-semibold uppercase tracking-wider text-card-lighter-3">
            {formatObservationDate(observation.localDateKey)}
          </Text>
          {persona ? (
            <View className="mt-1 flex-row items-center gap-2">
              <img
                alt={`${persona.name} avatar`}
                className="size-7 rounded-full object-cover"
                src={persona.avatar}
              />
              <Text className="font-bbh text-xs font-bold text-card-lighter-2">
                {persona.name} noticed
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel="Dismiss this observation"
          className="size-11 shrink-0 items-center justify-center rounded-full bg-card-light"
          onPress={() => onDismiss(observation.id)}
        >
          <RiCloseLine size={18} style={{ color: colors['card-lighter-2'] }} />
        </Pressable>
      </View>

      <View className="gap-3">
        <Text className="font-bbh text-base font-semibold leading-6 text-white">
          {observation.description}
        </Text>
        {observation.observations.map((item) => (
          <View className="flex-row items-start gap-3" key={item}>
            <RiSparklingLine
              className="mt-0.5 shrink-0"
              size={16}
              style={{ color: colors.accent[500] }}
            />
            <Text className="min-w-0 flex-1 font-bbh text-sm leading-6 text-card-lighter-2">
              {item}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap gap-2">
        {observation.sourceTypes.map((sourceType) => (
          <View
            className="rounded-full bg-card-light px-3 py-1.5"
            key={sourceType}
          >
            <Text className="font-bbh text-[11px] font-semibold text-card-lighter-2">
              {SOURCE_LABELS[sourceType]}
            </Text>
          </View>
        ))}
      </View>

      {observation.evidence.length ? (
        <View className="gap-3">
          <Pressable
            accessibilityLabel={`${isEvidenceOpen ? 'Hide' : 'Show'} observation evidence`}
            aria-expanded={isEvidenceOpen}
            className="min-h-11 flex-row items-center justify-between rounded-xl bg-card-light px-4"
            onPress={() => setIsEvidenceOpen((open) => !open)}
          >
            <Text className="font-bbh text-xs font-bold text-card-lighter-2">
              Why this came up
            </Text>
            {isEvidenceOpen ? (
              <RiArrowUpSLine
                size={18}
                style={{ color: colors['card-lighter-2'] }}
              />
            ) : (
              <RiArrowDownSLine
                size={18}
                style={{ color: colors['card-lighter-2'] }}
              />
            )}
          </Pressable>

          {isEvidenceOpen ? (
            <View className="gap-4 px-1 pb-1">
              {observation.evidence.map((evidence) => (
                <View className="flex-row items-start gap-3" key={evidence.id}>
                  <Text className="w-16 shrink-0 font-bbh text-[11px] text-card-lighter-3">
                    {formatEvidenceTime(evidence.happenedAt)}
                  </Text>
                  <View className="min-w-0 flex-1 gap-1">
                    <Text className="font-bbh text-[11px] font-bold text-card-lighter-3">
                      {SOURCE_LABELS[evidence.sourceType]}
                    </Text>
                    <Text className="font-bbh text-xs leading-5 text-card-lighter-2">
                      {evidence.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

function ObservationSkeleton(): ReactElement {
  return (
    <View className="gap-4 rounded-2xl bg-cardx px-5 py-5">
      <Skeleton className="h-3 w-40" rounded="sm" />
      <Skeleton className="h-5 w-full" rounded="sm" />
      <Skeleton className="h-5 w-4/5" rounded="sm" />
      <View className="flex-row gap-2">
        <Skeleton className="h-7 w-20" rounded="full" />
        <Skeleton className="h-7 w-24" rounded="full" />
      </View>
    </View>
  )
}

export default function RewindObservationsScreen(): ReactElement {
  const observationsQuery = useRewindObservations()
  const dismissMutation = useDismissRewindObservation()
  const observations: RewindObservation[] = []
  for (const page of observationsQuery.data?.pages ?? []) {
    observations.push(...page.items)
  }

  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TabHeader title="Rewind insights" />
        <View className="flex-1 overflow-y-auto px-mg pb-[120px] pt-2">
          <View className="mx-auto w-full max-w-3xl gap-6">
            <RewindIntelligenceTabs selected="observations" />
            <View className="gap-2 px-1">
              <Text className="font-bbh text-2xl font-bold text-white">
                What your days may be saying
              </Text>
              <Text className="max-w-xl font-bbh text-sm leading-6 text-card-lighter-2">
                Gentle patterns grounded in what you did and shared across
                Vybaa.
              </Text>
            </View>

            {observationsQuery.isLoading ? (
              <View className="gap-4">
                <ObservationSkeleton />
                <ObservationSkeleton />
              </View>
            ) : observationsQuery.isError ? (
              <View className="items-start gap-4 py-10">
                <Text className="font-bbh text-base font-bold text-white">
                  Observations are unavailable right now
                </Text>
                <Text className="font-bbh text-sm leading-6 text-card-lighter-2">
                  Your activity is safe. Try loading this view again.
                </Text>
                <Pressable
                  accessibilityLabel="Retry loading observations"
                  className="min-h-11 flex-row items-center gap-2 rounded-full bg-white px-4"
                  onPress={() => {
                    void observationsQuery.refetch()
                  }}
                >
                  <RiRefreshLine size={17} className="text-cardd" />
                  <Text className="font-bbh text-sm font-bold text-cardd">
                    Try again
                  </Text>
                </Pressable>
              </View>
            ) : observations.length ? (
              <View className="gap-4">
                {observations.map((observation) => (
                  <ObservationCard
                    key={observation.id}
                    observation={observation}
                    onDismiss={(observationId) => {
                      dismissMutation.mutate(observationId)
                    }}
                  />
                ))}
                {observationsQuery.hasNextPage ? (
                  <Pressable
                    accessibilityLabel="Load older observations"
                    className="min-h-12 items-center justify-center rounded-full bg-white px-5"
                    disabled={observationsQuery.isFetchingNextPage}
                    onPress={() => {
                      void observationsQuery.fetchNextPage()
                    }}
                  >
                    <Text className="font-bbh text-sm font-bold text-cardd">
                      {observationsQuery.isFetchingNextPage
                        ? 'Loading…'
                        : 'Load earlier days'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View className="items-center gap-4 rounded-2xl bg-cardx px-6 py-12 text-center">
                <View className="size-14 items-center justify-center rounded-full bg-card-light">
                  <RiSparklingLine
                    size={24}
                    style={{ color: colors['card-lighter-2'] }}
                  />
                </View>
                <View className="items-center gap-2">
                  <Text className="font-bbh text-base font-bold text-white">
                    Nothing to force today
                  </Text>
                  <Text className="max-w-sm text-center font-bbh text-sm leading-6 text-card-lighter-2">
                    When goals, journals, or Rewinds reveal a grounded pattern,
                    it will appear here.
                  </Text>
                </View>
              </View>
            )}

            <Text className="px-2 text-center font-bbh text-[11px] leading-5 text-card-lighter-3">
              Observations are supportive reflections, not diagnoses or medical
              advice.
            </Text>
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
