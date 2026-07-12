import { RiCalendar2Line, RiTimeLine, RiUserVoiceLine } from '@remixicon/react'
import type { ReactElement } from 'react'

import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { RewindSession } from '@/shared/api/rewind.api'
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
          className="font-bbh text-sm leading-7"
          style={{ color: colors.neutral[100] }}
        >
          {block}
        </Text>
      ))}
    </View>
  )
}

export function RewindSessionDetail({
  session,
}: {
  session: RewindSession
}): ReactElement {
  const persona = getRewindPersona(session.personaId)
  const { accent, accentSoft } = getSessionAccent(session.personaId)

  return (
    <View className="gap-5 pb-4" style={createAccentStyle(accent, accentSoft)}>
      <View
        className="gap-4 rounded-[24px] px-4 py-4"
        style={{ backgroundColor: colors['card-light-50'] }}
      >
        <View className="flex-row items-start gap-3">
          <View
            className="h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: accentSoft }}
          >
            <RiUserVoiceLine size={20} style={{ color: accent }} />
          </View>
          <View className="min-w-0 flex-1 gap-2">
            <View className="flex-row items-center gap-2">
              <Text
                className="font-bbh text-base font-bold"
                style={{ color: colors.white }}
              >
                {persona.name}
              </Text>
              <View
                className="rounded-full px-2.5 py-1"
                style={{
                  backgroundColor: session.completed
                    ? accentSoft
                    : colors.card[500],
                }}
              >
                <Text
                  className="font-bbh text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{
                    color: session.completed
                      ? accent
                      : colors['card-lighter-3'],
                  }}
                >
                  {session.completed ? 'Complete' : 'In progress'}
                </Text>
              </View>
            </View>
            <View className="flex-row flex-wrap items-center gap-3">
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
        </View>

        <View className="gap-2">
          <Text
            className="font-bbh text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: colors['card-lighter-3'] }}
          >
            {persona.name}&apos;s perspective
          </Text>
          <Text
            className="font-bbh text-sm leading-6"
            style={{ color: colors['card-lighter-2'] }}
          >
            {persona.perspective}
          </Text>
        </View>

        <View
          className="h-px w-full"
          style={{ backgroundColor: colors.card[300] }}
        />

        <View className="gap-2">
          <Text
            className="font-bbh text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: colors['card-lighter-3'] }}
          >
            Session Summary
          </Text>
          <DetailText value={session.summary} />
        </View>

        {session.emotionalInsight ? (
          <View className="gap-2">
            <Text
              className="font-bbh text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: colors['card-lighter-3'] }}
            >
              Emotional insight
            </Text>
            <DetailText value={session.emotionalInsight} />
          </View>
        ) : null}

        {session.nextStepNote ? (
          <View className="gap-2">
            <Text
              className="font-bbh text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: colors['card-lighter-3'] }}
            >
              Check-in note
            </Text>
            <Text
              className="font-bbh text-sm leading-7"
              style={{ color: colors['card-lighter-2'] }}
            >
              {session.nextStepNote}
            </Text>
          </View>
        ) : null}

        {session.emotionalTags.length ? (
          <View className="flex-row flex-wrap gap-2">
            {session.emotionalTags.map((tag) => (
              <View
                key={tag}
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: accentSoft }}
              >
                <Text
                  className="font-bbh text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: accent }}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  )
}

export const RewindSessionDetailSheet = RewindSessionDetail
