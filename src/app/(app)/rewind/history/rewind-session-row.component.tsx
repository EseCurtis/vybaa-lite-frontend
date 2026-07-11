import {
  RiArrowRightSLine,
  RiTimeLine,
  RiUserVoiceLine,
} from '@remixicon/react'
import { motion } from 'framer-motion'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
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

export function RewindSessionRow({
  index,
  onPress,
  session,
}: {
  index: number
  onPress: () => void
  session: RewindSession
}): ReactElement {
  const persona = getRewindPersona(session.personaId)
  const { accent, accentSoft } = getSessionAccent(session.personaId)

  return (
    <Pressable
      onPress={onPress}
      className="w-full text-left "
      accessibilityLabel={`Open rewind session with ${persona.name}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.035, 0.16), duration: 0.22 }}
        className="rounded-[24px] px-4 py-4 w-full"
        style={{
          ...createAccentStyle(accent, accentSoft),
          backgroundColor: colors['card-light-50'],
        }}
      >
        <View className="flex-row items-start gap-3">
          <View
            className="h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: accentSoft }}
          >
            <RiUserVoiceLine size={20} style={{ color: accent }} />
          </View>

          <View className="min-w-0 flex-1 gap-2">
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1 gap-1">
                <View className="flex-row items-center gap-2">
                  <Text
                    className="font-bbh text-sm font-bold"
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
                      {session.completed ? 'Complete' : 'Open'}
                    </Text>
                  </View>
                </View>
                <Text
                   className="line-clamp-2 font-bbh text-[13px] leading-5"
                   style={{ color: colors.neutral[100] }}
                >
                  {session.summary ?? 'No summary yet.'}
                </Text>
              </View>

              <RiArrowRightSLine
                size={20}
                style={{ color: colors['card-lighter-3'] }}
              />
            </View>

            <View className="flex-row flex-wrap items-center gap-3">
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
              <Text
                className="font-bbh text-[11px]"
                style={{ color: colors['card-lighter-2'] }}
              >
                {formatSessionDate(session.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </motion.div>
    </Pressable>
  )
}
