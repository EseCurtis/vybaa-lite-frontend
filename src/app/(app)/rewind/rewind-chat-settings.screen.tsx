import { RiDeleteBinLine, RiLoader4Line } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { ReactElement } from 'react'

import { Input } from '@/components/common/input.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useRewindChatSettings,
  useUpdateRewindChatSettings,
} from '@/hooks/use-rewind-chat-settings.hook'
import type {
  ConversationMood,
  RewindChatSettings,
} from '@/hooks/use-rewind-chat-settings.hook'
import {
  useClearRewindChat,
  useRenameRewindChat,
} from '@/hooks/use-rewind.hook'
import { useToast } from '@/providers/toast.provider'
import { shouldAnimate } from '@/shared/utils/animation.util'

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

function SettingsForm({
  settings,
}: {
  settings: RewindChatSettings
}): ReactElement {
  const [mood, setMood] = useState(settings.conversationMood)
  const [muted, setMuted] = useState(settings.proactiveMuted)
  const [title, setTitle] = useState(settings.title)
  const save = useUpdateRewindChatSettings(settings.id)
  const rename = useRenameRewindChat(settings.id)
  const clear = useClearRewindChat(settings.id)
  const toast = useToast()
  const navigate = useNavigate()
  const busy = save.isPending || rename.isPending || clear.isPending
  const changed =
    muted !== settings.proactiveMuted ||
    MOOD_CONTROLS.some(
      ({ key }) => mood[key] !== settings.conversationMood[key],
    )

  async function savePreferences(): Promise<void> {
    try {
      await save.mutateAsync({ conversationMood: mood, proactiveMuted: muted })
      toast.success('Chat preferences saved')
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save. Try again.',
      )
    }
  }

  async function saveName(): Promise<void> {
    try {
      await rename.mutateAsync(title.trim())
      toast.success('Group name updated')
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not update the group name',
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
        <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
          <section className="space-y-5">
            <div>
              <h2 className="font-bbh text-lg font-bold text-white">
                Conversation mood
              </h2>
              <p className="mt-1 text-sm leading-5 text-card-lighter-2">
                Set the tone. Everyone keeps their own personality.
              </p>
            </div>
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
                    {mood[control.key]}%
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
                <p
                  id={`mood-${control.key}-hint`}
                  className="mt-2 text-xs leading-5 text-card-lighter-2"
                >
                  {control.description}
                </p>
              </div>
            ))}
          </section>
          <section className="rounded-2xl bg-card-light p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Partners can start a chat
                </h2>
                <p className="mt-1 text-xs leading-5 text-card-lighter-2">
                  An occasional thought or message, even when you haven’t sent
                  one.
                </p>
              </div>
              <Pressable
                accessibilityRole="switch"
                aria-checked={!muted}
                accessibilityLabel="Partners can start a chat"
                disabled={busy}
                onPress={() => setMuted((current) => !current)}
                className="min-h-11 min-w-14 items-center justify-center"
              >
                <span
                  className={`flex h-7 w-12 items-center rounded-full p-1 ${muted ? 'bg-card-lighter' : 'bg-white'}`}
                >
                  <span
                    className={`size-5 rounded-full bg-cardd ${muted ? '' : 'ml-auto'}`}
                  />
                </span>
              </Pressable>
            </div>
          </section>
          {settings.type === 'GROUP' ? (
            <section className="space-y-3">
              <label
                htmlFor="chat-group-name"
                className="text-sm font-bold text-white"
              >
                Group name
              </label>
              <Input
                id="chat-group-name"
                maxLength={60}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={busy}
                className="bg-card-light"
              />
              <Pressable
                accessibilityLabel="Save group name"
                disabled={
                  busy || !title.trim() || title.trim() === settings.title
                }
                onPress={() => void saveName()}
                className="min-h-11 justify-center rounded-full bg-card-light px-4"
              >
                <Text className="text-sm text-white">
                  {rename.isPending ? 'Saving…' : 'Save name'}
                </Text>
              </Pressable>
            </section>
          ) : null}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-danger-400">
              Clear conversation
            </h2>
            <p className="text-xs leading-5 text-card-lighter-2">
              Deletes messages and stops replies in progress. This can’t be
              undone.
            </p>
            <Pressable
              accessibilityLabel="Clear every chat message"
              disabled={busy}
              onPress={() => void clearConversation()}
              className="min-h-11 flex-row items-center gap-2 rounded-full bg-card-light px-4"
            >
              <RiDeleteBinLine className="text-danger-400" size={18} />
              <Text className="text-sm text-danger-400">
                {clear.isPending ? 'Clearing…' : 'Clear chat'}
              </Text>
            </Pressable>
          </section>
        </div>
      </div>
      <div className="bg-cardd px-mg pt-3 pb-[calc(var(--safe-area-inset-bottom,0px)+16px)]">
        {save.isError ? (
          <p role="alert" className="mb-2 text-sm text-danger-400">
            Couldn’t save your preferences. Your changes are still here.
          </p>
        ) : null}
        <Pressable
          accessibilityLabel="Save chat preferences"
          disabled={busy || !changed}
          onPress={() => void savePreferences()}
          className="mx-auto min-h-12 w-full max-w-lg flex-row items-center justify-center gap-2 rounded-full bg-white px-5"
        >
          <Text className="font-bold text-black">
            {save.isPending ? 'Saving…' : 'Save preferences'}
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
  const navigate = useNavigate()
  return (
    <View className="min-h-0 flex-1 overflow-hidden bg-cardd">
      <NoiseComponent>
        <View className="h-full min-h-0">
          <TabHeader
            title="Chat settings"
            onBack={() =>
              void navigate({
                to: '/app/rewind-chat/$chatId',
                params: { chatId },
                replace: true,
              })
            }
          />
          {query.data ? (
            <SettingsForm settings={query.data} />
          ) : (
            <View className="flex-1 items-center justify-center gap-3 px-mg">
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
                <>
                  <RiLoader4Line
                    aria-hidden
                    className={
                      shouldAnimate
                        ? 'animate-spin motion-reduce:animate-none text-card-lighter-2'
                        : 'text-card-lighter-2'
                    }
                    size={24}
                  />
                  <Text role="status" className="text-card-lighter-2">
                    Loading settings…
                  </Text>
                </>
              )}
            </View>
          )}
        </View>
      </NoiseComponent>
    </View>
  )
}
