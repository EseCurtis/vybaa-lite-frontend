import {
  RiArchiveLine,
  RiArrowRightSLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiLoader4Line,
  RiMessage3Line,
  RiTimeLine,
} from '@remixicon/react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { RewindSession } from '@/shared/api/rewind.api'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'
import type { User } from '@/shared/types/auth.types'
import { adjustColor } from '@/shared/utils/helpers.util'

import {
  formatSessionDate,
  formatSessionTime,
  getDayKey,
  getRewindSessionStatusPresentation,
} from './rewind-history.utils'
import { RewindSessionAvatars } from './rewind-session-avatars.component'

const STATUS_ICONS = {
  COMPLETED: RiCheckboxCircleLine,
  FINALIZING: RiLoader4Line,
  IN_PROGRESS: RiMessage3Line,
  LEGACY: RiArchiveLine,
  MISSED: RiTimeLine,
  SCHEDULED: RiCalendarLine,
} satisfies Record<RewindSession['status'], typeof RiTimeLine>

export function RewindSessionRow({
  index,
  onPress,
  session,
  user,
}: {
  index: number
  onPress: () => void
  session: RewindSession
  user?: User
}): ReactElement {
  const persona = getRewindPersona(session.personaId)
  const status = getRewindSessionStatusPresentation(session)
  const reduceMotion = useReducedMotion()
  const isSaved = session.completed || session.status === 'COMPLETED'
  const StatusIcon = isSaved
    ? RiCheckboxCircleLine
    : STATUS_ICONS[session.status]
  const summary = session.summary.trim()
  const hasPreview =
    Boolean(summary) &&
    summary !== 'This scheduled Rewind has not started yet.' &&
    summary !==
      `This Rewind with ${persona.name} was started, but no reflection was captured yet.`
  const time = formatSessionTime(session.createdAt)
  const day = formatSessionDate(getDayKey(session))

  return (
    <Pressable
      onPress={onPress}
      className="min-h-11 w-full rounded-2xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      accessibilityLabel={`Open reflection with ${persona.name}. ${status.label}, ${day} at ${time}${hasPreview ? '. ' + summary : ''}`}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: reduceMotion ? 0 : Math.min(index * 0.035, 0.16),
          duration: reduceMotion ? 0 : 0.22,
        }}
        className="flex w-full items-start gap-3 px-1 py-3 sm:gap-4"
      >
        <RewindSessionAvatars persona={persona} user={user} />
        <View className="min-w-0 flex-1 gap-1.5">
          <Text className="font-bbh text-sm font-semibold leading-5 text-white">
            Rewind Sesh w/{' '}
            <span
              className="whitespace-nowrap"
              style={{ color: adjustColor(persona.color, { lightness: 18 }) }}
            >
              @{persona.id}
            </span>
          </Text>
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <View
              className="flex-row items-center gap-1.5"
              style={{ color: status.color }}
              title={status.label}
            >
              <StatusIcon size={16} aria-hidden="true" />
              <Text className="font-bbh text-xs font-medium">
                {status.label}
              </Text>
            </View>
            <Text aria-hidden="true" className="text-xs text-card-lighter-3">
              ·
            </Text>

            <time
              dateTime={session.createdAt}
              className="font-bbh text-xs tabular-nums text-card-lighter-3"
            >
              {time}
            </time>
          </View>
          {hasPreview ? (
            <Text className="mt-1 line-clamp-2 font-bbh text-sm leading-6 text-white">
              {summary}
            </Text>
          ) : null}
        </View>
        <View className="shrink-0 mr-mg self-center items-center justify-center">
          <Text className="p-0.5 bg-white rounded-full">
            <RiArrowRightSLine
              size={17}
              aria-hidden="true"
              className=" shrink-0 text-black"
            />
          </Text>
        </View>
      </motion.div>
    </Pressable>
  )
}
