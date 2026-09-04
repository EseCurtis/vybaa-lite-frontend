import { Icon } from '@iconify/react'
import { useNavigate } from '@tanstack/react-router'

import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useRewindHomeGreeting } from '@/hooks/use-rewind.hook'
import { Moti } from '@/shared/constants.shared'
import { randomGreetings } from '@/shared/home/home.util.shared'
import {
  getRewindPersona,
  type RewindPersonaId,
} from '@/shared/rewind/rewind-personas'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'

export function HomeGreetings({
  rewindPersona = 'ella',
  userName,
}: {
  rewindPersona?: RewindPersonaId | null
  userName: string
}) {
  const navigate = useNavigate()
  const contextualGreetingQuery = useRewindHomeGreeting()
  const greetings = randomGreetings(userName.split(' ')[0])
  const emoji = greetings[2]
  const contextualGreeting = contextualGreetingQuery.data
  const activePersonaId =
    contextualGreeting?.personaId ?? rewindPersona ?? 'ella'
  const persona = getRewindPersona(activePersonaId)
  const greetingTitle = contextualGreeting?.title ?? greetings[0]
  const greetingMessage = contextualGreeting?.message ?? greetings[1]

  const openRewind = (): void => {
    void navigate({ to: '/app/rewind' })
  }

  return (
    <View className="[&_*]:!break-words px-mg text-left py-5 relative ">
      <View className="flex-row-reverse gap-3 items-center">
        <Pressable
          className="size-12 border-[0.5px] border-white/20  scale-[1.3] translate-y-10 z-10 rotate-12 -translate-x-2 relative overflow-hidden rounded-[19px] "
          accessibilityLabel={`Open Rewind with ${persona.name}`}
          onPress={openRewind}
        >
          <img
            src={persona.avatar}
            alt={`${persona.name} avatar`}
            className="size-full  object-cover"
          />
          <Moti.div
            initial={{
              backgroundPosition: '-200% 0%',
            }}
            animate={{
              backgroundPosition: ['-200% 0%', '200% 0%'],
            }}
            transition={{
              duration: 3,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 3.1,
            }}
            className="
    pointer-events-none
    absolute
    inset-0
    bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.65)_50%,transparent_65%)]
    bg-[length:250%_100%]
    bg-no-repeat
  "
          ></Moti.div>
        </Pressable>
        <Pressable
          accessibilityLabel={
            contextualGreeting
              ? `${greetingMessage}. Open Rewind`
              : `${greetingTitle}. ${greetingMessage}. Open Rewind`
          }
          className="relative z-10 max-w-[80%]  h-full my-auto flex-col items-start bg-cardx p-2 px-4 rounded-3xl justify-center"
          onPress={openRewind}
        >
          {contextualGreeting ? (
            <Text
              lines={4}
              className="text-contrast-outline min-w-0 font-mona-sans-x text-sm font-bold leading-tight text-card-lighter-2"
            >
              {greetingMessage}
            </Text>
          ) : (
            <>
              <Text
                lines={1}
                className="text-contrast-outline block truncate text-wrap break-words font-mona-sans-x text-sm font-bold text-card-lighter-2"
              >
                {greetingTitle}
              </Text>
              <View className="min-w-0 flex-row items-center justify-start gap-2">
                <Text
                  lines={1}
                  className="text-contrast-outline min-w-0 font-mona-sans-x text-sm font-bold leading-tight text-card-lighter-2"
                >
                  {greetingMessage}
                </Text>
              </View>
            </>
          )}
          <View className="bg-cardx p-3 rounded-full absolute top-3 -right-3"></View>
          <View className="bg-cardx p-1.5 rounded-full absolute top-8 -right-5"></View>
        </Pressable>
      </View>

      {emoji && (
        <View className="absolute -bottom-[20px] hidden opacity-90 right-mg ">
          <Icon
            aria-hidden="true"
            className="shrink-0"
            height={70}
            icon={getEmojiIcon(emoji)}
          />
        </View>
      )}
    </View>
  )
}
