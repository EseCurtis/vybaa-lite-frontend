import {
  RiBookOpenLine,
  RiCalendar2Line,
  RiCheckLine,
  RiLoader4Line,
  RiSparklingLine,
  RiTimeLine,
} from '@remixicon/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState, type ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useToast } from '@/providers/toast.provider'
import {
  rewindAPI,
  type RewindRecommendation,
  type RewindSession,
} from '@/shared/api/rewind.api'
import { rewindQueryKeys } from '@/shared/api/rewind.query-keys'
import { colors } from '@/shared/colors.shared'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'
import { cn } from '@/shared/utils/helpers.util'

import {
  createAccentStyle,
  formatSessionDate,
  formatSessionTime,
  getSessionAccent,
} from './rewind-history.utils'

type DetailSection = 'conversation' | 'journal' | 'reflection'

const DETAIL_SECTIONS: Array<{ label: string; value: DetailSection }> = [
  { label: 'Conversation', value: 'conversation' },
  { label: 'Reflection', value: 'reflection' },
  { label: 'Journal', value: 'journal' },
]

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
  hasJournal,
  onChange,
}: {
  activeSection: DetailSection
  hasJournal: boolean
  onChange: (section: DetailSection) => void
}): ReactElement {
  return (
    <View
      className="flex-row rounded-xl p-1"
      style={{ backgroundColor: colors.cardx }}
    >
      {DETAIL_SECTIONS.map((section) => {
        const selected = section.value === activeSection
        return (
          <Pressable
            key={section.value}
            accessibilityLabel={`${section.label}${selected ? ', selected' : ''}`}
            className={cn(
              'min-h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg px-2',
              selected ? 'bg-white' : '',
            )}
            onPress={() => onChange(section.value)}
          >
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
    </View>
  )
}

function ReflectionSection({
  session,
}: {
  session: RewindSession
}): ReactElement {
  if (session.status === 'FINALIZING') {
    return (
      <View
        className="items-center gap-3 rounded-2xl px-5 py-10"
        style={{ backgroundColor: colors.cardx }}
      >
        <RiLoader4Line size={22} className="animate-spin text-success-green" />
        <Text className="font-bbh text-sm font-bold text-white">
          Building your reflection
        </Text>
        <Text className="muted max-w-[280px] text-center font-bbh text-xs leading-5">
          Saving the conversation and noticing the patterns that matter.
        </Text>
      </View>
    )
  }

  return (
    <View className="gap-4">
      <View
        className="gap-3 rounded-2xl px-4 py-5"
        style={{ backgroundColor: colors.cardx }}
      >
        <Text className="font-bbh text-sm font-bold text-white">Summary</Text>
        <DetailText value={session.summary} />
      </View>

      {session.emotionalInsight ? (
        <View
          className="gap-2 rounded-2xl px-4 py-5"
          style={{ backgroundColor: colors.cardx }}
        >
          <View className="flex-row items-center gap-2">
            <View className="h-1.5 w-5 rounded-full bg-accent-700" />
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
            <View className="h-1.5 w-5 rounded-full bg-success-green" />
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
        <View className="size-9 items-center justify-center rounded-full bg-accent-700/20">
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
            <Text className="font-bbh text-[10px] font-bold uppercase text-white/40">
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
            className="min-h-11 items-center justify-center rounded-full bg-white/10 px-4"
            disabled={isPending}
            onPress={() => onDismiss(recommendation)}
          >
            <Text className="font-bbh text-xs text-white/70">Dismiss</Text>
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
  const canAddToJournal = Boolean(session.completed && session.journalDraft)
  const isJournalSaved = Boolean(session.journalId || session.journalSavedAt)
  const journalActionLabel = getJournalActionLabel(
    isJournalSaved,
    addToJournalMutation.isPending,
  )

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
                style={{ color: colors['card-lighter-3'] }}
              />
              <Text className="muted font-bbh text-[11px]">
                {formatSessionDate(session.createdAt)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <RiTimeLine
                size={12}
                style={{ color: colors['card-lighter-3'] }}
              />
              <Text className="muted font-bbh text-[11px]">
                {formatSessionTime(session.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="sticky top-0 z-20 bg-cardd py-2">
        <DetailSectionTabs
          activeSection={activeSection}
          hasJournal={Boolean(session.journalDraft)}
          onChange={setActiveSection}
        />
      </View>

      {activeSection === 'conversation' ? (
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

      {activeSection === 'reflection' ? (
        <ReflectionSection session={session} />
      ) : null}

      {activeSection === 'journal' ? (
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
