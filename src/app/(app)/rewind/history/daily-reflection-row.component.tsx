import {
  RiArrowRightSLine,
  RiCheckboxCircleLine,
  RiTimeLine,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { Avatar } from '@/components/user/avatar.component'
import type { DailyReflection } from '@/shared/api/reflections.api'
import { reflectionClusterPosition } from '@/shared/rewind/daily-reflection-cluster'
import { REWIND_PERSONAS } from '@/shared/rewind/rewind-personas'
import type { User } from '@/shared/types/auth.types'

import { DailyReflectionStory } from './daily-reflection-story.component'

const STATE_LABELS: Record<DailyReflection['state'], string> = {
  COLLECTING: 'Taking shape',
  EMPTY: 'Quiet day',
  PRIVATE: 'Personalization off',
  READY: 'Saved',
}

export function DailyReflectionAvatars({
  participantIds,
  user,
  seed,
}: {
  participantIds: string[]
  user?: User
  seed?: string
}): ReactElement {
  const partners = REWIND_PERSONAS.filter((persona) =>
    participantIds.includes(persona.id),
  )
  const clusterSeed =
    seed ??
    `${user?.id ?? 'user'}:${partners.map((partner) => partner.id).join(':')}`
  return (
    <div
      aria-hidden="true"
      className={`relative shrink-0 ${partners.length ? 'size-[88px]' : 'size-16'}`}
    >
      <div
        className={`absolute z-10 rounded-full bg-cardd p-[3px] ${partners.length ? 'left-[25px] top-[24px]' : 'left-[5px] top-[5px]'}`}
      >
        <Avatar user={user} size={28} />
      </div>
      {partners.map((persona, index) => {
        const position = reflectionClusterPosition(
          clusterSeed,
          index,
          partners.length,
        )
        return (
          <span
            key={persona.id}
            className="absolute z-20 rounded-full bg-cardd p-[2px]"
            style={{
              left: position.left,
              top: position.top,
              width: position.size,
              height: position.size,
              transform: `rotate(${position.rotation}deg)`,
            }}
          >
            <img
              src={persona.avatar}
              alt=""
              width={28}
              height={28}
              className="size-full rounded-full bg-card-light-100 object-cover"
            />
          </span>
        )
      })}
    </div>
  )
}

export function DailyReflectionContent({
  reflection,
  user,
}: {
  reflection: DailyReflection
  user?: User
}): ReactElement {
  return (
    <DailyReflectionStory
      reflection={reflection}
      firstName={user?.firstName}
      avatars={
        <DailyReflectionAvatars
          participantIds={reflection.participantIds}
          seed={reflection.id}
          user={user}
        />
      }
    />
  )
}

export function DailyReflectionRow({
  reflection,
  user,
}: {
  reflection: DailyReflection
  user?: User
}): ReactElement {
  const navigate = useNavigate()
  const StatusIcon =
    reflection.state === 'READY' ? RiCheckboxCircleLine : RiTimeLine
  return (
    <Pressable
      type="button"
      accessibilityLabel={`Open Reflections n’ summary for ${reflection.localDateKey}. ${STATE_LABELS[reflection.state]}`}
      className="min-h-11 w-full items-start gap-3 rounded-2xl px-1 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      onPress={() =>
        void navigate({
          to: '/app/reflections/$dayKey',
          params: { dayKey: reflection.localDateKey },
        })
      }
    >
      <DailyReflectionAvatars
        participantIds={reflection.participantIds}
        seed={reflection.id}
        user={user}
      />
      <div className="min-w-0 flex-1 font-bbh">
        <p className="text-sm font-semibold leading-5 text-white">
          Reflections n’ summary
        </p>

                <span className="mt-2 flex items-center gap-1.5 text-xs text-card-lighter-2">
            <StatusIcon
              size={15}
              aria-hidden="true"
              className={
                reflection.state === 'READY'
                  ? 'text-success-400'
                  : 'text-warning-400'
              }
            />
            {STATE_LABELS[reflection.state]}
          </span>{' '}

        <p className="mt-2 line-clamp-2 break-words text-xs text-card-lighter-2">
  
          {reflection.summary}
        </p>
      </div>
      <RiArrowRightSLine
        size={19}
        aria-hidden="true"
        className="mr-mg shrink-0 self-center text-card-lighter-2"
      />
    </Pressable>
  )
}
