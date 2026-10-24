import {
  RiBookOpenLine,
  RiCalendar2Line,
  RiCheckLine,
  RiLoader4Line,
  RiSearchEyeLine,
  RiSparklingLine,
  RiTimeLine,
  RiHeartLine,
  RiPulseLine,
  RiChat3Line,
} from '@remixicon/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useReducedMotion } from 'framer-motion'
import { useRef, useState, type ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import {
  MissedRewindStatus,
  ReflectionProcessingStatus,
} from '@/components/custom/rewind/reflection-status.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useToast } from '@/providers/toast.provider'
import {
  rewindAPI,
  type RewindObservation,
  type RewindRecommendation,
  type RewindSession,
} from '@/shared/api/rewind.api'
import { rewindQueryKeys } from '@/shared/api/rewind.query-keys'
import { colors } from '@/shared/colors.shared'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'
import {
  availableReflectionSections,
  hasReflectionSummary,
} from '@/shared/rewind/reflection-sections'
import type { ReflectionDetailSection } from '@/shared/rewind/reflection-sections'
import { cn } from '@/shared/utils/helpers.util'

import { NoiseComponent } from '@/components/common/noise.component'
import {
  createAccentStyle,
  formatSessionDate,
  formatSessionTime,
  getCenteredTabScrollLeft,
  getSessionAccent,
} from './rewind-history.utils'

type DetailSection = ReflectionDetailSection

const DETAIL_SECTIONS: Array<{ label: string; value: DetailSection }> = [
  { label: 'Conversation', value: 'conversation' },
  { label: 'Reflection', value: 'reflection' },
  { label: 'Observation', value: 'observation' },
  { label: 'Journal', value: 'journal' },
]

const SECTION_ICONS = {
  conversation: { Icon: RiChat3Line, tone: 'text-accent-300' },
  reflection: { Icon: RiSparklingLine, tone: 'text-success-400' },
  observation: { Icon: RiSearchEyeLine, tone: 'text-accent-300' },
  journal: { Icon: RiBookOpenLine, tone: 'text-warning-400' },
} satisfies Record<DetailSection, { Icon: typeof RiChat3Line; tone: string }>

function scrollDetailTabIntoView(
  container: HTMLDivElement | null,
  tab: HTMLButtonElement | null,
  reduceMotion: boolean,
): void {
  if (!container || !tab) return

  container.scrollTo({
    behavior: reduceMotion ? 'auto' : 'smooth',
    left: getCenteredTabScrollLeft({
      containerWidth: container.clientWidth,
      scrollWidth: container.scrollWidth,
      tabOffsetLeft: tab.offsetLeft,
      tabWidth: tab.offsetWidth,
    }),
  })
}

function getTextBlocks(value: string): string[] {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function DetailText({ value }: { value: string }): ReactElement {
  return (
    <View className="gap-2">
      {getTextBlocks(value).map((block, index) => (
        <Text
          key={`${index}-${block.slice(0, 16)}`}
          className="muted font-bbh text-sm leading-6"
        >
          {block}
        </Text>
      ))}
    </View>
  )
}

function getJournalActionLabel(
  isJournalSaved: boolean,
  isPending: boolean,
): string {
  if (isPending) return 'Adding to Journal...'
  if (isJournalSaved) return 'Added to Journal'
  return 'Add to Journal'
}

function TranscriptTurn({
  content,
  isPartner,
  partnerName,
}: {
  content: string
  isPartner: boolean
  partnerName: string
}): ReactElement {
  return (
    <View className={isPartner ? 'items-start gap-1' : 'items-end gap-1'}>
      <Text className="muted font-bbh text-[10px] font-bold uppercase tracking-[0.1em]">
        {isPartner ? partnerName : 'You'}
      </Text>
      <View
        className="max-w-[88%] rounded-2xl px-4 py-3"
        style={{
          backgroundColor: isPartner ? colors.cardx : colors['card-light'],
        }}
      >
        <Text className="font-bbh text-sm leading-6 text-white">{content}</Text>
      </View>
    </View>
  )
}

function DetailSectionTabs({
  activeSection,
  sections,
  hasJournal,
  onChange,
}: {
  activeSection: DetailSection
  sections: DetailSection[]
  hasJournal: boolean
  onChange: (section: DetailSection) => void
}): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<Record<DetailSection, HTMLButtonElement | null>>({
    conversation: null,
    journal: null,
    observation: null,
    reflection: null,
  })
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      className="no-scrollbar flex flex-row overflow-x-auto rounded-xl p-1"
      ref={containerRef}
      style={{ backgroundColor: colors.cardx }}
    >
      {DETAIL_SECTIONS.filter((section) =>
        sections.includes(section.value),
      ).map((section) => {
        const selected = section.value === activeSection
        const { Icon, tone } = SECTION_ICONS[section.value]
        return (
          <Pressable
            key={section.value}
            aria-pressed={selected}
            accessibilityLabel={`${section.label}${selected ? ', selected' : ''}`}
            className={cn(
              'min-h-11 flex-1 shrink-0 flex-row items-center justify-center gap-1.5 rounded-lg px-4',
              selected ? 'bg-white' : '',
            )}
            onPress={() => {
              onChange(section.value)
              scrollDetailTabIntoView(
                containerRef.current,
                tabRefs.current[section.value],
                Boolean(shouldReduceMotion),
              )
            }}
            ref={(element) => {
              tabRefs.current[section.value] = element
            }}
          >
            <Icon
              size={15}
              aria-hidden="true"
              className={selected ? 'text-cardd' : tone}
            />
            <Text
              className={cn(
                'font-bbh text-[11px] font-bold',
                selected ? 'text-cardd' : 'muted',
              )}
            >
              {section.label}
            </Text>
            {section.value === 'journal' && hasJournal ? (
              <View
                className={cn(
                  'size-1.5 rounded-full',
                  selected ? 'bg-success-green' : 'bg-warning-yellow',
                )}
              />
            ) : null}
          </Pressable>
        )
      })}
    </div>
  )
}

function ReflectionSection({
  session,
}: {
  session: RewindSession
}): ReactElement {
  if (session.status === 'FINALIZING') {
    return <ReflectionProcessingStatus partnerId={session.personaId} />
  }

  return (
    <View className="gap-4">
      {hasReflectionSummary(session) ? (
        <View
          className="gap-3 rounded-2xl px-4 py-5"
          style={{ backgroundColor: colors.cardx }}
        >
          <View className="flex-row items-center gap-2">
            <RiSparklingLine
              size={17}
              className="text-accent-300"
              aria-hidden="true"
            />
            <Text className="font-bbh text-sm font-bold text-white">
              Summary
            </Text>
          </View>
          <DetailText value={session.summary} />
        </View>
      ) : null}

      {session.emotionalInsight ? (
        <View
          className="gap-2 rounded-2xl px-4 py-5"
          style={{ backgroundColor: colors.cardx }}
        >
          <View className="flex-row items-center gap-2">
            <RiHeartLine
              size={17}
              className="text-accent-300"
              aria-hidden="true"
            />
            <Text className="font-bbh text-xs font-bold text-white">
              Emotional insight
            </Text>
          </View>
          <DetailText value={session.emotionalInsight} />
        </View>
      ) : null}

      {session.comparisonInsight ? (
        <View
          className="gap-2 rounded-2xl px-4 py-5"
          style={{ backgroundColor: colors.cardx }}
        >
          <View className="flex-row items-center gap-2">
            <RiPulseLine
              size={17}
              className="text-success-400"
              aria-hidden="true"
            />
            <Text className="font-bbh text-xs font-bold text-white">
              In context
            </Text>
          </View>
          <DetailText value={session.comparisonInsight} />
        </View>
      ) : null}
    </View>
  )
}

function DailyObservationSection({
  localDateKey,
  observation,
}: {
  localDateKey: string | null
  observation: RewindObservation | null | undefined
}): ReactElement {
  if (!observation) {
    return (
      <View
        className="gap-2 rounded-2xl px-4 py-5"
        style={{ backgroundColor: colors.cardx }}
      >
        <View className="flex-row items-center gap-2">
          <RiSearchEyeLine size={17} className="text-card-lighter-2" />
          <Text className="font-bbh text-sm font-bold text-white">
            No daily observation yet
          </Text>
        </View>
        <Text className="muted font-bbh text-sm leading-6">
          When there is enough activity to notice a grounded pattern, it will
          appear here and be shared by every Reflection from this day.
        </Text>
      </View>
    )
  }

  const attributedPartner = observation.personaId
    ? getRewindPersona(observation.personaId).name
    : null
  const observationDay = localDateKey
    ? formatSessionDate(`${localDateKey}T12:00:00`)
    : 'this day'

  return (
    <View className="gap-4">
      <View
        className="gap-3 rounded-2xl px-4 py-5"
        style={{ backgroundColor: colors.cardx }}
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              <RiSearchEyeLine size={17} className="text-accent-400" />
              <Text className="font-bbh text-sm font-bold text-white">
                Daily observation
              </Text>
            </View>
            <Text className="muted font-bbh text-[11px] leading-5">
              Shared across every Reflection from {observationDay}
              {attributedPartner ? ` · noticed with ${attributedPartner}` : ''}
            </Text>
          </View>
        </View>

        <DetailText value={observation.description} />

        {observation.observations.length ? (
          <View className="gap-2 pt-1">
            {observation.observations.map((item) => (
              <View className="flex-row items-start gap-2" key={item}>
                <View className="mt-2 size-1.5 shrink-0 rounded-full bg-card-lighter-2" />
                <Text className="muted min-w-0 flex-1 font-bbh text-sm leading-6">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {observation.reflection ? (
        <View className="gap-2 rounded-2xl bg-teal-950 px-4 py-5 [&_*]:text-teal-200">
          <Text className="font-bbh text-xs font-bold text-teal-400">
            What the day may be saying
          </Text>
          <DetailText value={observation.reflection} />
        </View>
      ) : null}
    </View>
  )
}

function RecommendationCard({
  isPending,
  onAccept,
  onDismiss,
  recommendation,
}: {
  isPending: boolean
  onAccept: (recommendation: RewindRecommendation) => void
  onDismiss: (recommendation: RewindRecommendation) => void
  recommendation: RewindRecommendation
}): ReactElement {
  const available = recommendation.status === 'PENDING'
  const actionLabel =
    recommendation.type === 'GOAL_PROGRESS'
      ? 'Confirm progress'
      : recommendation.type === 'NEW_GOAL'
        ? 'Review goal'
        : 'Open Flexx'
  return (
    <View className="gap-3 rounded-2xl bg-cardx px-4 py-4">
      <View className="flex-row items-start gap-3">
        <View className="size-9 items-center justify-center rounded-full bg-card-light-100">
          <RiSparklingLine size={17} className="text-accent-400" />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-bbh text-sm font-bold text-white">
            {recommendation.title}
          </Text>
          <Text className="muted font-bbh text-xs leading-5">
            {recommendation.rationale}
          </Text>
          {!available ? (
            <Text className="font-bbh text-[10px] font-bold uppercase text-card-lighter-3">
              {recommendation.status.toLowerCase()}
            </Text>
          ) : null}
        </View>
      </View>
      {available ? (
        <View className="flex-row gap-2">
          <Pressable
            accessibilityLabel={actionLabel}
            className="min-h-11 flex-1 items-center justify-center rounded-full bg-white px-3"
            disabled={isPending}
            onPress={() => onAccept(recommendation)}
          >
            <Text className="font-bbh text-xs font-bold text-cardd">
              {actionLabel}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Dismiss ${recommendation.title}`}
            className="min-h-11 items-center justify-center rounded-full bg-card-light px-4"
            disabled={isPending}
            onPress={() => onDismiss(recommendation)}
          >
            <Text className="font-bbh text-xs text-card-lighter-3">
              Dismiss
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

export function RewindSessionDetail({
  session,
}: {
  session: RewindSession
}): ReactElement {
  const [activeSection, setActiveSection] =
    useState<DetailSection>('conversation')
  const persona = getRewindPersona(session.personaId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { accent, accentSoft } = getSessionAccent(session.personaId)
  const addToJournalMutation = useMutation({
    mutationFn: () => rewindAPI.addSessionToJournal(session.id),
    onError: (error: Error) => {
      toast.error(error.message || 'Could not add this Rewind to your Journal')
    },
    onSuccess: async () => {
      toast.success('Rewind added to your Journal')
      await queryClient.invalidateQueries({ queryKey: rewindQueryKeys.all })
    },
  })
  const recommendationMutation = useMutation({
    mutationFn: async (recommendation: RewindRecommendation) => {
      if (recommendation.type === 'NEW_GOAL') {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(
            'rewind:goal-recommendation',
            JSON.stringify({
              ...recommendation.payload,
              sourceRecommendationId: recommendation.id,
            }),
          )
        }
        void navigate({ to: '/app/goal/create' })
        return recommendation
      }
      const response = await rewindAPI.acceptRecommendation(
        session.id,
        recommendation.id,
      )
      if (recommendation.type === 'FLEXX') {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(
            'rewind:flexx-recommendation',
            JSON.stringify(recommendation.payload),
          )
        }
        void navigate({ to: '/app/actions/flexx' })
      }
      return response.data
    },
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rewindQueryKeys.all })
    },
  })
  const dismissRecommendationMutation = useMutation({
    mutationFn: (recommendation: RewindRecommendation) =>
      rewindAPI.dismissRecommendation(session.id, recommendation.id),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rewindQueryKeys.all })
    },
  })
  const turns = session.turns ?? []
  const sections = availableReflectionSections(session)
  const selectedSection = sections.includes(activeSection)
    ? activeSection
    : (sections[0] ?? null)
  const canAddToJournal = Boolean(session.completed && session.journalDraft)
  const isJournalSaved = Boolean(session.journalId || session.journalSavedAt)
  const journalActionLabel = getJournalActionLabel(
    isJournalSaved,
    addToJournalMutation.isPending,
  )
  if (session.status === 'MISSED')
    return <MissedRewindStatus partnerId={session.personaId} />
  if (session.status === 'FINALIZING')
    return <ReflectionProcessingStatus partnerId={session.personaId} />

  return (
    <View className="gap-5 pb-4" style={createAccentStyle(accent, accentSoft)}>
      <View className="flex-row items-start gap-3 px-1 pt-1">
        <View
          className="h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: accentSoft }}
        >
          <img
            src={persona.avatar}
            alt=""
            className="size-full rounded-full object-cover"
          />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-bbh text-base font-bold text-white">
            Rewind with {persona.name}
          </Text>
          <View className="flex-row flex-wrap items-center gap-3">
            <View className="flex-row items-center gap-1.5">
              <RiCalendar2Line
                size={12}
                style={{ color: colors.warning[400] }}
              />
              <Text className="muted font-bbh text-[11px]">
                {formatSessionDate(session.createdAt)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <RiTimeLine size={12} style={{ color: colors.accent[300] }} />
              <Text className="muted font-bbh text-[11px]">
                {formatSessionTime(session.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {sections.length > 1 && selectedSection ? (
        <View className="py-2 sticky top-0 z-20 bg-cardd">
          <NoiseComponent>
            <DetailSectionTabs
              activeSection={selectedSection}
              sections={sections}
              hasJournal={Boolean(session.journalDraft)}
              onChange={setActiveSection}
            />
          </NoiseComponent>
        </View>
      ) : null}

      {selectedSection === 'conversation' ? (
        <View className="gap-4">
          {turns.length ? (
            turns.map((turn) => (
              <TranscriptTurn
                key={turn.id}
                content={turn.content}
                isPartner={turn.role === 'PARTNER'}
                partnerName={persona.name}
              />
            ))
          ) : (
            <View
              className="rounded-2xl px-4 py-5"
              style={{ backgroundColor: colors.cardx }}
            >
              <Text className="muted font-bbh text-sm leading-6">
                A transcript was not captured for this earlier Rewind. Its
                reflection is still available in the next tab.
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {selectedSection === 'reflection' ? (
        <ReflectionSection session={session} />
      ) : null}

      {selectedSection === 'observation' ? (
        <DailyObservationSection
          localDateKey={session.sessionDateKey}
          observation={session.dailyObservation}
        />
      ) : null}

      {selectedSection === 'journal' ? (
        <View className="gap-4">
          <View
            className="gap-3 rounded-2xl px-4 py-5"
            style={{ backgroundColor: colors.cardx }}
          >
            <View className="flex-row items-center gap-2">
              <RiBookOpenLine size={17} className="text-warning-yellow" />
              <Text className="font-bbh text-sm font-bold text-white">
                Journal note
              </Text>
            </View>
            {session.journalDraft ? (
              <DetailText value={session.journalDraft} />
            ) : (
              <Text className="muted font-bbh text-sm leading-6">
                This Rewind does not have a Journal note yet.
              </Text>
            )}
          </View>

          {canAddToJournal ? (
            <Pressable
              accessibilityLabel={
                isJournalSaved
                  ? 'Rewind already added to Journal'
                  : 'Add Rewind to Journal'
              }
              disabled={isJournalSaved || addToJournalMutation.isPending}
              className="min-h-12 flex-row items-center justify-center gap-2 rounded-full bg-white px-4 disabled:opacity-50"
              onPress={() => {
                addToJournalMutation.mutate()
              }}
            >
              {addToJournalMutation.isPending ? (
                <RiLoader4Line size={18} className="animate-spin text-cardd" />
              ) : isJournalSaved ? (
                <RiCheckLine size={18} className="text-cardd" />
              ) : (
                <RiBookOpenLine size={18} className="text-cardd" />
              )}
              <Text className="font-bbh text-sm font-bold text-cardd">
                {journalActionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {!sections.length ? (
        <Text className="py-4 font-bbh text-sm text-card-lighter-2">
          No reflection content was saved for this session.
        </Text>
      ) : null}

      {session.recommendations?.length ? (
        <View className="gap-3">
          <View className="gap-1 px-1">
            <Text className="font-bbh text-sm font-bold text-white">
              Ideas from this Rewind
            </Text>
            <Text className="muted font-bbh text-xs">
              Nothing changes until you choose an action.
            </Text>
          </View>
          {session.recommendations.map((recommendation) => (
            <RecommendationCard
              isPending={
                recommendationMutation.isPending ||
                dismissRecommendationMutation.isPending
              }
              key={recommendation.id}
              onAccept={(selected) => recommendationMutation.mutate(selected)}
              onDismiss={(selected) =>
                dismissRecommendationMutation.mutate(selected)
              }
              recommendation={recommendation}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}

export const RewindSessionDetailSheet = RewindSessionDetail
