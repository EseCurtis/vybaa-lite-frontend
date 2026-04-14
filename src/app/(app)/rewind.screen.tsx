import { NoiseComponent } from '@/components/common/noise.component'
import { BottomNotch } from '@/components/common/notch.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { authAPI } from '@/shared/api/auth.api'
import {
  REWIND_PERSONAS,
  type RewindPersona,
  type RewindPersonaId,
  getRewindPersona,
} from '@/shared/rewind/rewind-personas'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { adjustColor, cn, seededColor } from '@/shared/utils/helpers.util'
import { Icon } from '@iconify/react'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

const REWIND_PERSONA_STORAGE_KEY = 'vybaa.rewind.persona'

function readStoredPersonaId(): RewindPersonaId | null {
  const raw = localStorage.getItem(REWIND_PERSONA_STORAGE_KEY)
  if (!raw) return null
  if (raw === 'ella' || raw === 'lyra' || raw === 'jake' || raw === 'ariel') {
    return raw
  }
  return null
}

function PersonaCard({
  persona,
  onSelect,
  disabled,
}: {
  persona: RewindPersona
  onSelect: (id: RewindPersonaId) => void
  disabled?: boolean
}) {
  const $color = seededColor(persona.id)
  const color = adjustColor($color, { lightness: -10, saturation: -20 })
  const darkColor = adjustColor(color, { lightness: -30, saturation: -20 })

  return (
    <Pressable
      style={{
        //@ts-ignore
        '--tw-themecolor': color,
        '--tw-themecolor-dark': darkColor,
      }}
      disabled={disabled}
      onPress={() => onSelect(persona.id)}
      className={cn(
        'w-full flex flex-col rounded-[50px] relative overflow-hidden  aspect-square  items-end justify-end',
        //use the tw theme
        'bg-[var(--tw-themecolor)]',
      )}
    >
      <View className="w-20 rounded-full absolute scale-150 top-0 left-0 brightness-0  items-center justify-center">
        <Icon
          icon={getEmojiIcon(persona.emoji)}
          className="text-white opacity-20"
          style={{ fontSize: '94px' }}
        />
      </View>
      <Text className="mt-3 z-10 text-white  text-[var(--tw-themecolor-dark)] font-extrabold text-2xl p-5">
        {persona.name}
      </Text>
    </Pressable>
  )
}

function CaptionStack({ lines }: { lines: Array<string> }) {
  const visibleLines = lines.slice(-4)

  return (
    <View className="w-full items-center text-center justify-center px-xl">
      {visibleLines.map((line, index) => {
        const isLast = index === visibleLines.length - 1
        return (
          <Text
            key={`${index}-${line}`}
            className={cn(
              'text-white font-extrabold text-center font-bbh text-[30px] leading-tight',
              !isLast && 'opacity-20',
            )}
          >
            {line}
          </Text>
        )
      })}
    </View>
  )
}

export default function RewindScreen() {
  const { user, refreshSession } = useAuth()
  const toast = useToast()
  const [personaId, setPersonaId] = useState<RewindPersonaId | null>(() =>
    readStoredPersonaId(),
  )

  useEffect(() => {
    if (!personaId) return
    localStorage.setItem(REWIND_PERSONA_STORAGE_KEY, personaId)
  }, [personaId])

  const persistPersonaMutation = useMutation({
    mutationFn: async (nextPersona: RewindPersonaId | null) => {
      await authAPI.updateProfile({
        rewindPersona: nextPersona,
      })
    },
    onSuccess: async () => {
      await refreshSession()
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.msg ||
        error?.message ||
        'Failed to save rewind persona'
      toast.error(msg)
    },
  })

  // Backend is the source of truth across devices.
  useEffect(() => {
    const backendPersona = user?.rewindPersona as RewindPersonaId | undefined
    if (!backendPersona) return
    setPersonaId(backendPersona)
    localStorage.setItem(REWIND_PERSONA_STORAGE_KEY, backendPersona)
  }, [user?.rewindPersona])

  const selectPersona = async (nextPersona: RewindPersonaId) => {
    setPersonaId(nextPersona)
    localStorage.setItem(REWIND_PERSONA_STORAGE_KEY, nextPersona)
    await persistPersonaMutation.mutateAsync(nextPersona)
  }

  const clearPersona = async () => {
    localStorage.removeItem(REWIND_PERSONA_STORAGE_KEY)
    setPersonaId(null)
    await persistPersonaMutation.mutateAsync(null)
  }

  const persona = useMemo(() => {
    if (!personaId) return null
    return getRewindPersona(personaId)
  }, [personaId])

  const personaTheme = useMemo(() => {
    if (!persona) return null
    const $color = seededColor(persona.id)
    const color = adjustColor($color, { lightness: -10, saturation: -20 })
    const darkColor = adjustColor(color, { lightness: -30, saturation: -20 })
    return { color, darkColor }
  }, [persona])

  if (!persona) {
    return (
      <View className="flex-1 bg-cardd overflow-y-auto no-scrollbar">
        <NoiseComponent>
          <View className="flex-1">
            <TabHeader title="Rewind" />
            <View className="flex-1 px-mg pb-xl">
              <View className="mt-lg mb-xl items-center">
                <Text className="text-white font-bbh text-2xl font-bold text-center">
                  Choose your Rewind partner
                </Text>
                <Text className="mt-2 text-white/60 font-bbh text-base text-center">
                  Pick a custom-tuned persona to start your live rewind
                  conversations.
                </Text>
                {persistPersonaMutation.isPending && (
                  <Text className="mt-2 text-white/40 font-bbh text-sm text-center">
                    Saving...
                  </Text>
                )}
              </View>

              <View className="grid grid-cols-2 h-[calc(100%-40vh)] items-center [&>div]:shrink-0 overflow-y-auto gap-3 mt-mg">
                {REWIND_PERSONAS.map((p) => (
                  <PersonaCard
                    key={p.id}
                    persona={p}
                    onSelect={selectPersona}
                    disabled={persistPersonaMutation.isPending}
                  />
                ))}
              </View>
            </View>
          </View>
        </NoiseComponent>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-cardd">
      <TabHeader
        title="Rewind"
        children={
          <Pressable
            onPress={clearPersona}
            className="px-mg py-05-mg rounded-full bg-card-light/40"
          >
            <Text className="text-white/80 text-sm font-bold">
              {persistPersonaMutation.isPending ? 'Saving…' : 'Switch'}
            </Text>
          </Pressable>
        }
      />

      <View className="flex-1 px-mg pb-xl items-center">
        {/* Avatar */}
        <View
          className="mt-10 items-center"
          style={
            personaTheme
              ? {
                  //@ts-ignore
                  '--tw-themecolor': personaTheme.color,
                  '--tw-themecolor-dark': personaTheme.darkColor,
                }
              : undefined
          }
        >
          <View className="w-32 h-32 rounded-full relative overflow-hidden border border-white/10 items-center justify-center bg-[var(--tw-themecolor)]">
            <View className="w-20 rounded-full absolute scale-[1.75] -top-4 -left-4 brightness-0 items-center justify-center">
              <Icon
                icon={getEmojiIcon(persona.emoji)}
                className="text-white opacity-20"
                style={{ fontSize: '94px' }}
              />
            </View>

            <View className="z-10 items-center justify-center px-4">
              <Text className="text-[var(--tw-themecolor-dark)] font-bbh font-extrabold text-2xl text-center leading-none">
                {persona.name}
              </Text>
            </View>
          </View>
          <Text className="mt-1 text-white/50 font-bbh text-sm">
            Live rewind (coming soon)
          </Text>
        </View>

        {/* Caption */}
        <View className="flex-1 justify-end w-full pb-10">
          <CaptionStack
            lines={['hey jake ', 'heyya ', ' ', ' ', `Say hi to ${persona.name}.`]}
          />
        </View>
      </View>
      <BottomNotch />
      <BottomNotch />
    </View>
  )
}
