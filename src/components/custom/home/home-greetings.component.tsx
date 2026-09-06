import { Icon } from '@iconify/react'
import { RiChatSmile3Line } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useBottomSheet } from '@/hooks/use-bottom-sheet.hook'
import { useRewindChats, useRewindHomeGreeting } from '@/hooks/use-rewind.hook'
import { Moti } from '@/shared/constants.shared'
import {
  randomGreetings,
  randomRewindGreetings,
  resolveRewindHomePersona,
} from '@/shared/home/home.util.shared'
import {
  getRewindPersona,
  type RewindPersona,
  type RewindPersonaId,
} from '@/shared/rewind/rewind-personas'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'

function HomeGreetingSheet({
  greetingMessage,
  greetingTitle,
  onOpenChat,
  persona,
}: {
  greetingMessage: string
  greetingTitle: string
  onOpenChat: () => void
  persona: RewindPersona
}): ReactElement {
  return (
    <View className="gap-5 pb-2 pt-3">
      <View className="flex-row hidden items-center gap-3">
        <img
          alt={`${persona.name} avatar`}
          className="size-10 rounded-full object-cover"
          src={persona.avatar}
        />
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="font-mona-sans-x text-xs font-bold text-card-lighter-3">
            @{persona.name}
          </Text>
          {greetingTitle && (
            <Text className="font-mona-sans-x text-base font-bold text-white">
              {greetingTitle}
            </Text>
          )}
        </View>
      </View>

      <View className="rounded-[24px] bg-cardx  py-4 ">
        <Text className="font-mona-sans-x text-base text-card-lighter-2 font-bold leading-6 text-card-lighter-1">
          {greetingMessage}
        </Text>
      </View>

      <Pressable
        accessibilityLabel={`Open chat with ${persona.name}`}
        className="min-h-12 flex-row items-center justify-center gap-2 rounded-full bg-white px-5"
        onPress={onOpenChat}
      >
        <RiChatSmile3Line className="text-cardd" size={18} />
        <Text className="font-bbh text-sm font-bold text-cardd">Open chat</Text>
      </Pressable>
    </View>
  )
}

export function HomeGreetings({
  rewindPersona = 'ella',
  userName,
}: {
  rewindPersona?: RewindPersonaId | null
  userName: string
}): ReactElement {
  const navigate = useNavigate()
  const bottomSheet = useBottomSheet()
  const chatsQuery = useRewindChats()
  const contextualGreetingQuery = useRewindHomeGreeting(rewindPersona)
  const firstName = userName.trim().split(/\s+/)[0] ?? 'friend'
  const genericGreetings = randomGreetings(firstName)
  const contextualGreeting = contextualGreetingQuery.data
  const activePersonaId = resolveRewindHomePersona(
    rewindPersona,
    contextualGreeting?.personaId,
  )
  const persona = getRewindPersona(activePersonaId)
  const partnerGreetings = randomRewindGreetings(activePersonaId, firstName)
  const greetings =
    rewindPersona || contextualGreeting?.personaId
      ? partnerGreetings
      : genericGreetings
  const emoji = greetings[2]
  const contextualMessage =
    contextualGreeting?.personaId === activePersonaId
      ? contextualGreeting.message
      : null
  const greetingTitle = contextualMessage
    ? contextualGreeting.title
    : greetings[0]
  const greetingMessage = contextualMessage ?? greetings[1]
  const partnerChat = chatsQuery.data?.find(
    (chat) => chat.type === 'PARTNER' && chat.personaId === activePersonaId,
  )
  const chatId =
    contextualGreeting?.personaId === activePersonaId
      ? contextualGreeting.chatId
      : partnerChat?.id

  const openPartnerChat = (): void => {
    if (!chatId) {
      void navigate({ to: '/app/rewind-chats' })
      return
    }
    void navigate({
      params: { chatId },
      to: '/app/rewind-chat/$chatId',
    })
  }

  const openPartnerChatFromSheet = (): void => {
    bottomSheet.dismiss()
    openPartnerChat()
  }

  const expandGreeting = (): void => {
    bottomSheet.present(
      <HomeGreetingSheet
        greetingMessage={greetingMessage}
        greetingTitle={greetingTitle}
        onOpenChat={openPartnerChatFromSheet}
        persona={persona}
      />,
      { title: `@${persona.name} Says.` },
    )
  }

  return (
    <View className="[&_*]:!break-words px-mg text-left py-5 relative ">
      <View className="flex-row-reverse gap-3 items-center">
        <Pressable
          className="size-10 border-[0.5px] border-white/20  scale-[1.3] translate-y-10 z-10 rotate-12 -translate-x-2 relative overflow-hidden rounded-full "
          accessibilityLabel={`Open Rewind with ${persona.name}`}
          onPress={expandGreeting}
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
            contextualMessage
              ? `${greetingMessage}. Open chat with ${persona.name}`
              : `${greetingTitle}. ${greetingMessage}. Open chat with ${persona.name}`
          }
          className="relative z-10 max-w-[80%]  h-full my-auto flex-col items-start bg-cardx p-2 px-4 rounded-3xl justify-center"
          onPress={openPartnerChat}
        >
          {contextualMessage ? (
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
