import {
  RiBookOpenLine,
  RiCalendar2Line,
  RiCheckLine,
  RiTimeLine,
  RiUserVoiceLine,
} from '@remixicon/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useToast } from '@/providers/toast.provider'
import { rewindAPI, type RewindSession } from '@/shared/api/rewind.api'
import { rewindQueryKeys } from '@/shared/api/rewind.query-keys'
import { colors } from '@/shared/colors.shared'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'

import {
  createAccentStyle,
  formatSessionDate,
  formatSessionTime,
  getSessionAccent,
} from './rewind-history.utils'

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
          className="muted font-bbh text-sm leading-7"
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
  if (isPending) return 'Adding to Journal…'
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
        className="max-w-[88%] rounded-lg px-3 py-3"
        style={{
          backgroundColor: isPartner ? colors['card-light-50'] : colors.card[500],
        }}
      >
        <Text className="font-bbh text-sm leading-6 text-white">{content}</Text>
      </View>
    </View>
  )
}

export function RewindSessionDetail({
  session,
}: {
  session: RewindSession
}): ReactElement {
  const persona = getRewindPersona(session.personaId)
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
  const turns = session.turns ?? []
  const canAddToJournal = Boolean(session.completed && session.journalDraft)
  const isJournalSaved = Boolean(session.journalId || session.journalSavedAt)
  const journalActionLabel = getJournalActionLabel(
    isJournalSaved,
    addToJournalMutation.isPending,
  )

  return (
    <View className="gap-7 pb-4" style={createAccentStyle(accent, accentSoft)}>
      <View className="flex-row items-start gap-3 px-1">
        <View
          className="h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: accentSoft }}
        >
          <RiUserVoiceLine size={19} style={{ color: accent }} />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-bbh text-base font-bold text-white">
            Rewind with {persona.name}
          </Text>
          <View className="flex-row flex-wrap items-center gap-3">
            <View className="flex-row items-center gap-1.5">
              <RiCalendar2Line size={12} style={{ color: colors['card-lighter-3'] }} />
              <Text className="muted font-bbh text-[11px]">
                {formatSessionDate(session.createdAt)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <RiTimeLine size={12} style={{ color: colors['card-lighter-3'] }} />
              <Text className="muted font-bbh text-[11px]">
                {formatSessionTime(session.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="gap-3">
        <Text className="font-bbh text-base font-bold text-white">Conversation</Text>
        {turns.length ? (
          <View className="gap-4">
            {turns.map((turn) => (
              <TranscriptTurn
                key={turn.id}
                content={turn.content}
                isPartner={turn.role === 'PARTNER'}
                partnerName={persona.name}
              />
            ))}
          </View>
        ) : (
          <View
            className="rounded-lg px-4 py-4"
            style={{ backgroundColor: colors['card-light-50'] }}
          >
            <Text className="muted font-bbh text-sm leading-6">
              A transcript was not captured for this earlier Rewind. Its saved reflection remains below.
            </Text>
          </View>
        )}
      </View>

      <View className="gap-3 border-t border-white/10 pt-6">
        <Text className="font-bbh text-base font-bold text-white">Summary</Text>
        <DetailText value={session.summary} />
      </View>

      {session.emotionalInsight ? (
        <View className="gap-2">
          <Text className="font-bbh text-[10px] font-bold uppercase tracking-[0.12em] text-white">
            Emotional insight
          </Text>
          <DetailText value={session.emotionalInsight} />
        </View>
      ) : null}

      {session.comparisonInsight ? (
        <View className="gap-2">
          <Text className="font-bbh text-[10px] font-bold uppercase tracking-[0.12em] text-white">
            In context
          </Text>
          <DetailText value={session.comparisonInsight} />
        </View>
      ) : null}

      {session.journalDraft ? (
        <View
          className="gap-2 rounded-lg px-4 py-4"
          style={{ backgroundColor: colors['card-light-50'] }}
        >
          <Text className="font-bbh text-[10px] font-bold uppercase tracking-[0.12em] text-white">
            Journal note
          </Text>
          <DetailText value={session.journalDraft} />
        </View>
      ) : null}

      {canAddToJournal ? (
        <Pressable
          accessibilityLabel={
            isJournalSaved ? 'Rewind already added to Journal' : 'Add Rewind to Journal'
          }
          disabled={isJournalSaved || addToJournalMutation.isPending}
          className="min-h-12 flex-row items-center justify-center gap-2 rounded-lg bg-white px-4"
          onPress={() => {
            addToJournalMutation.mutate()
          }}
        >
          {isJournalSaved ? (
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
  )
}

export const RewindSessionDetailSheet = RewindSessionDetail
