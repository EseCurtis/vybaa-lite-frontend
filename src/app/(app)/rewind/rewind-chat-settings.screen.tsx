import { RiDeleteBinLine, RiPencilLine } from '@remixicon/react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { useState } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { ChatAppearance } from '@/components/custom/rewind/chat-appearance.component'
import { ChatNameSheet } from '@/components/custom/rewind/chat-name-sheet.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { Avatar } from '@/components/user/avatar.component'
import { useBottomSheet } from '@/hooks/use-bottom-sheet.hook'
import type {
  ConversationMood,
  RewindChatSettings,
} from '@/hooks/use-rewind-chat-settings.hook'
import {
  useRewindChatSettings,
  useUpdateRewindChatSettings,
} from '@/hooks/use-rewind-chat-settings.hook'
import { useClearRewindChat } from '@/hooks/use-rewind.hook'
import { useToast } from '@/providers/toast.provider'
import type { RewindChatAccentId } from '@/shared/rewind/rewind-chat-accent'
import { DEFAULT_REWIND_CHAT_ACCENT } from '@/shared/rewind/rewind-chat-accent'
import { REWIND_PERSONAS } from '@/shared/rewind/rewind-personas'
import { navigateBackWithinApp } from '@/shared/utils/app-navigation.util'

const MOOD_CONTROLS: ReadonlyArray<{
  key: keyof ConversationMood
  title: string
  low: string
  high: string
  description: string
}> = [
  {
    key: 'energy',
    title: 'Energy',
    low: 'Quiet',
    high: 'Lively',
    description: 'A slower chat or a more animated back-and-forth.',
  },
  {
    key: 'playfulness',
    title: 'Playfulness',
    low: 'Serious',
    high: 'Playful',
    description: 'Room for jokes, teasing and lighter replies.',
  },
  {
    key: 'directness',
    title: 'Directness',
    low: 'Gentle',
    high: 'Frank',
    description: 'How plainly partners put their opinions across.',
  },
]

function toneLabel(value: number, low: string, high: string): string {
  if (value === 50) return 'Balanced'
  return value < 50 ? low : high
}

function SettingsForm({
  settings,
}: {
  settings: RewindChatSettings
}): ReactElement {
  const [mood, setMood] = useState(settings.conversationMood)
  const [accentColor, setAccentColor] = useState<RewindChatAccentId>(
    settings.accentColor ?? DEFAULT_REWIND_CHAT_ACCENT,
  )
  const { present, dismiss } = useBottomSheet()
  const save = useUpdateRewindChatSettings(settings.id)
  const clear = useClearRewindChat(settings.id)
  const toast = useToast()
  const navigate = useNavigate()
  const busy = save.isPending || clear.isPending
  const persona = REWIND_PERSONAS.find(
    (partner) => partner.id === settings.personaId,
  )
  const changed =
    accentColor !== settings.accentColor ||
    MOOD_CONTROLS.some(
      ({ key }) => mood[key] !== settings.conversationMood[key],
    )

  async function savePreferences(): Promise<void> {
    try {
      await save.mutateAsync({ accentColor, conversationMood: mood })
      toast.success('Chat preferences saved')
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save. Try again.',
      )
    }
  }

  async function clearConversation(): Promise<void> {
    if (
      !window.confirm(
        'Delete every message in this chat? This cannot be undone.',
      )
    )
      return
    try {
      await clear.mutateAsync()
      toast.success('Chat cleared')
      await navigate({
        to: '/app/rewind-chat/$chatId',
        params: { chatId: settings.id },
        replace: true,
      })
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Chat could not be cleared',
      )
    }
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-mg pb-8">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-8 pt-2">
          <div className="flex items-center gap-4 pb-1">
            <Avatar
              user={{
                id: settings.id,
                firstName: settings.title,
                avatarUrl: persona?.avatar,
              }}
              size={56}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="min-w-0 break-words font-bbh text-xl font-bold leading-tight text-white">
                  {settings.title}
                </h1>
                {settings.type === 'GROUP' ? (
                  <Pressable
                    type="button"
                    accessibilityLabel="Edit group name"
                    disabled={busy}
                    className="size-11 shrink-0 items-center justify-center rounded-full bg-carsd-light text-card-lighter-1"
                    onPress={() =>
                      present(
                        <ChatNameSheet
                          chatId={settings.id}
                          initialTitle={settings.title}
                          onSaved={dismiss}
                        />,
                        { title: 'Group name' },
                      )
                    }
                  >
                    <RiPencilLine size={18} aria-hidden="true" />
                  </Pressable>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-card-lighter-2">
                {settings.type === 'GROUP'
                  ? 'Your group conversation'
                  : 'Just this conversation'}
              </p>
            </div>
          </div>
          <ChatAppearance
            value={accentColor}
            disabled={busy}
            onChange={setAccentColor}
          />
          <section
            aria-labelledby="conversation-tone-title"
            className="space-y-4"
          >
            <div>
              <h2
                id="conversation-tone-title"
                className="font-bbh text-base font-bold text-white"
              >
                Conversation tone
              </h2>
              <p className="mt-1 text-sm leading-5 text-card-lighter-2">
                Their personality. Your pace.
              </p>
            </div>
            <div className="space-y-5 rounded-3xl bg-card-light-50 p-5">
              {MOOD_CONTROLS.map((control) => (
                <div key={control.key}>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`mood-${control.key}`}
                      className="text-sm font-bold text-white"
                    >
                      {control.title}
                    </label>
                    <output
                      htmlFor={`mood-${control.key}`}
                      className="text-sm tabular-nums text-card-lighter-2"
                    >
                      {toneLabel(mood[control.key], control.low, control.high)}
                    </output>
                  </div>
                  <input
                    id={`mood-${control.key}`}
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={mood[control.key]}
                    disabled={busy}
                    onChange={(event) =>
                      setMood((current) => ({
                        ...current,
                        [control.key]: Number(event.target.value),
                      }))
                    }
                    aria-describedby={`mood-${control.key}-hint`}
                    aria-valuetext={`${mood[control.key]} percent, ${control.low} to ${control.high}`}
                    className="my-1 h-11 w-full cursor-pointer accent-white"
                  />
                  <div className="flex justify-between text-xs text-card-lighter-3">
                    <span>{control.low}</span>
                    <span>{control.high}</span>
                  </div>
                  <p id={`mood-${control.key}-hint`} className="sr-only">
                    {control.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-2">
            <Pressable
              accessibilityLabel="Clear every chat message"
              disabled={busy}
              onPress={() => void clearConversation()}
              className="min-h-14 w-full flex-row items-center gap-3 rounded-2xl bg-danger-400/10 px-4"
            >
              <RiDeleteBinLine className="text-danger-400" size={18} />
              <Text className="text-sm text-danger-400">
                {clear.isPending ? 'Clearing…' : 'Clear chat'}
              </Text>
            </Pressable>
            <p className="px-1 text-xs leading-5 text-card-lighter-2">
              Permanently deletes messages and stops replies in progress.
            </p>
          </section>
        </div>
      </div>
      <div className="bg-cardd px-mg pt-3 pb-[calc(var(--safe-area-inset-bottom,0px)+16px)]">
        {changed ? (
          <div className="mx-auto mb-2 flex max-w-lg items-center justify-between gap-3">
            <span className="text-xs text-card-lighter-2">Unsaved changes</span>
            <Pressable
              type="button"
              accessibilityLabel="Discard preference changes"
              disabled={busy}
              className="min-h-11 items-center justify-center px-3 text-sm text-card-lighter-1"
              onPress={() => {
                setMood(settings.conversationMood)
                setAccentColor(settings.accentColor)
              }}
            >
              Reset
            </Pressable>
          </div>
        ) : null}
        {save.isError ? (
          <p role="alert" className="mb-2 text-sm text-danger-400">
            Couldn’t save these changes. Your edits are still here.
          </p>
        ) : null}
        <Pressable
          accessibilityLabel="Save changes"
          disabled={busy || !changed}
          onPress={() => void savePreferences()}
          className="mx-auto min-h-12 w-full max-w-lg flex-row items-center justify-center gap-2 rounded-full bg-white px-5 disabled:bg-card-light disabled:text-card-lighter-3"
        >
          <Text
            className={
              busy || !changed
                ? 'font-bold text-card-lighter-3'
                : 'font-bold text-black'
            }
          >
            {save.isPending ? 'Saving…' : 'Save changes'}
          </Text>
        </Pressable>
      </div>
    </>
  )
}

export default function RewindChatSettingsScreen({
  chatId,
}: {
  chatId: string
}): ReactElement {
  const query = useRewindChatSettings(chatId)
  const router = useRouter()
  return (
    <View className="min-h-0 flex-1 overflow-hidden bg-cardd">
      <NoiseComponent>
        <View className="h-full min-h-0">
          <TabHeader
            title="Chat settings"
            onBack={() => {
              void navigateBackWithinApp(
                router,
                `/app/rewind-chat/${chatId}/settings`,
                `/app/rewind-chat/${chatId}`,
              )
            }}
          />
          {query.data ? (
            <SettingsForm key={chatId} settings={query.data} />
          ) : (
            <View className="min-h-0 flex-1 items-center gap-3 overflow-y-auto px-mg py-5">
              {query.isError ? (
                <>
                  <Text className="text-card-lighter-2">
                    Couldn’t load chat settings.
                  </Text>
                  <Pressable
                    onPress={() => void query.refetch()}
                    className="min-h-11 justify-center rounded-full bg-card-light px-6"
                  >
                    <Text className="text-white">Try again</Text>
                  </Pressable>
                </>
              ) : (
                <div
                  role="status"
                  aria-label="Loading conversation settings"
                  className="w-full max-w-lg space-y-8 self-start"
                >
                  <span className="sr-only">Loading conversation settings</span>
                  <div className="flex items-center gap-4">
                    <Skeleton width={56} height={56} rounded="full" />
                    <Skeleton width="55%" height={24} />
                  </div>
                  <Skeleton width="100%" height={150} rounded="xl" />
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2, 3, 4, 5].map((item) => (
                      <Skeleton key={item} height={56} />
                    ))}
                  </div>
                  <Skeleton width="100%" height={260} rounded="xl" />
                </div>
              )}
            </View>
          )}
        </View>
      </NoiseComponent>
    </View>
  )
}
