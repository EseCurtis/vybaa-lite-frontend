import {
  RiArrowRightSLine,
  RiChat3Fill,
  RiChat3Line,
  RiCloseLine,
  RiEmotionHappyLine,
  RiFlashlightLine,
  RiLock2Fill,
  RiMoonClearLine,
  RiPulseLine,
  RiSettings3Fill,
  RiWaterFlashLine,
} from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { CSSProperties, ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { AppLoadingState } from '@/components/common/app-loading-state.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { BottomNotch } from '@/components/common/notch.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { ProFeatureGateSheet } from '@/components/custom/subscription/pro-feature-gate.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { UserCheckmark } from '@/components/user/checkmark.component'
import {
  getQuestionnaireError,
  useRewindQuestionnaire,
} from '@/hooks/use-rewind-questionnaire.hook'
import { useRewindSchedule } from '@/hooks/use-rewind-schedule.hook'
import {
  useRewindChats,
  useRewindRoutine,
  useRewindSession,
} from '@/hooks/use-rewind.hook'
import { useAuth } from '@/providers/auth.provider'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { useSubscription } from '@/providers/subscription.provider'
import { useToast } from '@/providers/toast.provider'
import { authAPI } from '@/shared/api/auth.api'
import { canChangeRewindPartner } from '@/shared/rewind/rewind-partner-switch.util'
import type {
  RewindPersona,
  RewindPersonaIcon,
  RewindPersonaId,
} from '@/shared/rewind/rewind-personas'
import {
  getRewindPersona,
  isFreeRewindPersona,
  REWIND_PERSONAS,
} from '@/shared/rewind/rewind-personas'
import { adjustColor, cn } from '@/shared/utils/helpers.util'
import { RewindQuestionnaireContent } from './rewind/questionnaire/rewind-questionnaire.component'

const REWIND_PERSONA_ICONS: Record<
  RewindPersonaIcon,
  typeof RiEmotionHappyLine
> = {
  emotion: RiEmotionHappyLine,
  flashlight: RiFlashlightLine,
  chat: RiChat3Line,
  moon: RiMoonClearLine,
  pulse: RiPulseLine,
  water: RiWaterFlashLine,
}

export function PersonaThumbnail({
  persona,
  onSelect,
  selected,
  disabled,
  locked = false,
}: {
  persona: RewindPersona
  onSelect: (id: RewindPersonaId) => void
  selected: boolean
  disabled?: boolean
  locked?: boolean
}): ReactElement {
  const $color = persona.color
  const color = adjustColor($color, { lightness: -10, saturation: 0 })
  const PersonaIcon = REWIND_PERSONA_ICONS[persona.icon]

  return (
    <Pressable
      style={
        {
          '--tw-themecolor': color,
        } as CSSProperties
      }
      disabled={disabled}
      onPress={() => onSelect(persona.id)}
      accessibilityLabel={`${locked ? 'Unlock' : 'Choose'} ${persona.name}. ${persona.perspective}`}
      className={cn(
        'relative  shrink-0 items-center justify-center mt-2 aspect-square overflow-hidden rounded-xl bg-cardx',
        selected &&
          'ring-2 ring-[var(--tw-themecolor)] ring-offset-2 ring-offset-cardd',
      )}
    >
      <img
        src={persona.avatar}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <View className="absolute inset-0 opacity-70 bg-[var(--tw-themecolor)]" />
      <View className="z-10 items-center justify-center mb-3 opacity-40">
        <PersonaIcon size={34} color="white" />
      </View>
      <Text className="absolute bottom-1.5 z-10 font-bbh text-[10px] font-bold text-white">
        {persona.name}
      </Text>
      {locked ? (
        <View className="absolute right-1.5 top-1.5 z-20 size-6 items-center justify-center rounded-full bg-cardd">
          <RiLock2Fill className="text-white" size={12} />
        </View>
      ) : null}
    </Pressable>
  )
}

function RewindChatUnreadBadge({
  count,
}: {
  count: number
}): ReactElement | null {
  if (count <= 0) return null

  return (
    <View className="absolute -right-1 -top-1 min-w-4 items-center justify-center rounded-full bg-accent-600 px-1 py-0.5">
      <Text className="font-bbh text-[10px] font-bold leading-3 text-white">
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  )
}

export function PersonaArtwork({
  actionLabel,
  persona,
  onChoose,
  disabled,
  showAction = true,
}: {
  actionLabel?: string
  persona: RewindPersona
  onChoose: () => void
  disabled?: boolean
  showAction?: boolean
}): ReactElement {
  const color = adjustColor(persona.color, {
    lightness: -10,
    saturation: -20,
  })
  const darkColor = adjustColor(color, { lightness: -25, saturation: -20 })

  return (
    <View
      style={
        {
          '--persona-color': color,
          '--persona-dark-color': darkColor,
        } as CSSProperties
      }
      className="relative w-full overflow-hidden rounded-3xl bg-cardx"
    >
      <View
        className="absolute opacity-30 top-10 inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 15%, var(--persona-color), transparent 68%)',
          maskImage:
            'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)',
        }}
      />
      <View
        className="absolute inset-2 rounded-3xl border-2 border-[var(--persona-color)] opacity-70"
        style={{
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 45%, transparent 100%)',
        }}
      />
      <View className="relative min-h-[290px] items-center justify-center px-6 py-8">
        <View className="mb-5 size-44 overflow-hidden rounded-full border-4 border-[var(--persona-color)] shadow-lg">
          <img
            src={persona.avatar}
            alt={`${persona.name} avatar`}
            className="size-full object-cover"
          />
        </View>
        <Text className="font-display relative z-10 text-2xl font-extrabold text-white">
          {persona.name}
        </Text>
        <Text className="mt-2 !text-center relative z-10 max-w-[70%] text-center font-bbh text-sm leading-5 text-card-lighter-3">
          {persona.name} {persona.perspective.toLowerCase()}
        </Text>
        {showAction ? (
          <Pressable
            onPress={onChoose}
            disabled={disabled}
            accessibilityLabel={`Choose ${persona.name} as your Rewind partner`}
            className="mt-6 min-h-11 min-w-[190px] items-center justify-center rounded-full bg-white px-6"
          >
            <Text className="font-bbh font-bold text-cardd">
              {disabled
                ? 'Saving...'
                : (actionLabel ?? `Choose ${persona.name}`)}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

export default function RewindScreen(): ReactElement {
  const {
    user,
    refreshSession,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth()
  const routineQuery = useRewindRoutine()
  const latestReflection = useRewindSession(
    routineQuery.data?.latestSession?.status === 'COMPLETED'
      ? routineQuery.data.latestSession.id
      : '',
  )
  const { isPro } = useSubscription()
  const chatsQuery = useRewindChats(isPro)
  const questionnaire = useRewindQuestionnaire(user?.id)
  const bottomSheet = useBottomSheetController()
  const toast = useToast()
  const navigate = useNavigate()
  const [isPartnerPickerOpen, setIsPartnerPickerOpen] = useState(false)
  const [previewPersonaId, setPreviewPersonaId] =
    useState<RewindPersonaId>('ella')
  const persona =
    REWIND_PERSONAS.find((entry) => entry.id === user?.rewindPersona) ?? null
  const schedule = useRewindSchedule(
    routineQuery.data,
    persona?.id ?? 'ella',
    user?.id ?? '',
    routineQuery.refetch,
  )
  const previewPersona = getRewindPersona(previewPersonaId)
  const unreadChatCount = useMemo(() => {
    let count = 0
    for (const chat of chatsQuery.data ?? []) count += chat.unreadCount ?? 0
    return count
  }, [chatsQuery.data])

  const persistPersonaMutation = useMutation({
    mutationFn: (nextPersona: RewindPersonaId) =>
      authAPI.updateProfile({ rewindPersona: nextPersona }),
    onSuccess: async () => {
      await refreshSession()
    },
    onError: (error: unknown) => toast.error(getQuestionnaireError(error)),
  })

  useEffect(() => {
    if (persona) setPreviewPersonaId(persona.id)
  }, [persona?.id])

  function canSwitchPartnerToday(): boolean {
    if (user?.rewindPersonaCanChange !== false) return true
    return Boolean(
      user.rewindPersonaNextChangeAt &&
      canChangeRewindPartner(user.rewindPersonaNextChangeAt),
    )
  }

  function selectPersona(nextPersona: RewindPersonaId): void {
    if (nextPersona === persona?.id) {
      setIsPartnerPickerOpen(false)
      return
    }
    if (persona && !canSwitchPartnerToday()) {
      toast.info('You can switch your Rewind partner again tomorrow')
      return
    }
    persistPersonaMutation.mutate(nextPersona, {
      onSuccess: () => {
        setIsPartnerPickerOpen(false)
        if (persona)
          toast.success(
            `${getRewindPersona(nextPersona).name} is now your Rewind partner`,
          )
      },
    })
  }

  function openRoutineSettings(): void {
    void navigate({ search: { from: 'rewind' }, to: '/app/rewind-routine' })
  }

  function openRewindChats(): void {
    if (isPro) {
      void navigate({ to: '/app/rewind-chats' })
      return
    }
    bottomSheet.present(
      <ProFeatureGateSheet
        feature="rewind-chats"
        onUnlocked={() => void navigate({ to: '/app/rewind-chats' })}
      />,
      { size: 'semi-full', title: 'Anytime chats' },
    )
  }

  const overview = routineQuery.data

  if (isAuthLoading) return <AppLoadingState message="Loading your Rewind..." />
  if (!isAuthenticated || !user)
    return <AppLoadingState message="Opening sign in..." />

  if (!persona || isPartnerPickerOpen) {
    return (
      <View className="flex-1 overflow-y-auto bg-cardd no-scrollbar">
        <NoiseComponent>
          <TabHeader
            canGoBack={!persona}
            title={persona ? 'Switch partner' : 'Rewind'}
            children={
              <Pressable
                accessibilityLabel={
                  persona ? 'Close partner picker' : 'Open Rewind text chats'
                }
                className="relative size-11 items-center justify-center rounded-full bg-card-light-50"
                onPress={() => {
                  if (persona) setIsPartnerPickerOpen(false)
                  else openRewindChats()
                }}
              >
                {persona ? (
                  <RiCloseLine size={20} className="text-card-lighter-2" />
                ) : (
                  <RiChat3Line size={19} className="text-card-lighter-2" />
                )}
                {!persona ? (
                  <RewindChatUnreadBadge count={unreadChatCount} />
                ) : null}
              </Pressable>
            }
          />
          <View className="flex-1 px-mg pb-xl">
            <Text className="mb-6 mt-7 text-center font-bbh text-base text-card-lighter-2">
              {persona
                ? 'Choose carefully. You can switch your Rewind partner once each day.'
                : 'Choose the partner who will help you reflect on your day.'}
            </Text>
            <PersonaArtwork
              actionLabel={
                persona?.id === previewPersona.id
                  ? `Keep ${previewPersona.name}`
                  : undefined
              }
              persona={previewPersona}
              onChoose={() => selectPersona(previewPersona.id)}
              disabled={persistPersonaMutation.isPending}
            />
            <View className="mt-5 grid grid-cols-4 gap-2 px-1 pb-2">
              {REWIND_PERSONAS.map((entry) => (
                <PersonaThumbnail
                  key={entry.id}
                  persona={entry}
                  selected={previewPersonaId === entry.id}
                  onSelect={(nextPersonaId) => {
                    if (isPro || isFreeRewindPersona(nextPersonaId)) {
                      setPreviewPersonaId(nextPersonaId)
                      return
                    }
                    bottomSheet.present(
                      <ProFeatureGateSheet
                        feature="rewind-partners"
                        onUnlocked={() => setPreviewPersonaId(nextPersonaId)}
                      />,
                      { size: 'semi-full', title: 'More Rewind partners' },
                    )
                  }}
                  disabled={persistPersonaMutation.isPending}
                  locked={!isPro && !isFreeRewindPersona(entry.id)}
                />
              ))}
            </View>
          </View>
        </NoiseComponent>
      </View>
    )
  }

  const activeDeck = questionnaire.deck
  const deckPersona =
    REWIND_PERSONAS.find((entry) => entry.id === activeDeck?.personaId) ??
    persona
  const displayPersona = activeDeck ? deckPersona : persona
  const canStart = schedule.available || !overview?.routine
  let startLabel = 'Begin my Rewind'
  if (!overview?.routine) startLabel = 'Set my routine'
  else if (overview.currentSession?.status === 'IN_PROGRESS')
    startLabel = 'Continue my Rewind'

  return (
    <View className="relative flex-1 overflow-hidden bg-cardd">
      <NoiseComponent>
        <TabHeader
          title=""
          children={
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={openRewindChats}
                accessibilityLabel="Open Rewind text chats"
                className="relative size-11 items-center justify-center rounded-full"
              >
                <RiChat3Fill size={27} className="text-white" />
                <RewindChatUnreadBadge count={unreadChatCount} />
              </Pressable>
              <Pressable
                disabled={
                  persistPersonaMutation.isPending || Boolean(activeDeck)
                }
                accessibilityLabel={`Change Rewind partner. Current partner ${displayPersona.name}`}
                onPress={() => {
                  if (!canSwitchPartnerToday()) {
                    toast.info(
                      'You can switch your Rewind partner again tomorrow',
                    )
                    return
                  }
                  setPreviewPersonaId(persona.id)
                  setIsPartnerPickerOpen(true)
                }}
                className="min-h-11 flex-row items-center gap-2 rounded-full bg-card-light-50 py-1.5 pl-3 pr-1.5"
              >
                <Text className="font-bbh text-sm font-bold text-white">
                  {displayPersona.name}
                </Text>
                <img
                  alt=""
                  className="size-8 rounded-full object-cover"
                  src={displayPersona.avatar}
                />
              </Pressable>
              <Pressable
                onPress={openRoutineSettings}
                accessibilityLabel="Open Rewind routine settings"
                className="size-11 items-center justify-center rounded-full bg-card-light-50"
              >
                <RiSettings3Fill size={18} className="text-white" />
              </Pressable>
            </View>
          }
        />
        <View className="min-h-0 flex-1 overflow-y-auto px-mg pb-xl no-scrollbar">
          <View className="items-center pt-4">
            <View className="flex-row items-center justify-center gap-1">
              <Text className="font-display text-xl font-extrabold text-white">
                <span className="text-accent-400">@</span>
                {user.username}
              </Text>
              <UserCheckmark />
            </View>
            <Text className="mt-1 text-center font-display text-xl font-extrabold text-white">
              <span className="text-card-lighter-3">You're Rewinding W/</span>{' '}
              <span style={{ color: displayPersona.color }}>@</span>
              {displayPersona.name}
            </Text>
            <Text className="mt-1 max-w-[320px] !text-center font-bbh text-xs text-card-lighter-2">
              {schedule.text}
            </Text>
            {routineQuery.isError ? (
              <Pressable
                onPress={() => void routineQuery.refetch()}
                className="mt-2 min-h-11 justify-center"
              >
                <Text className="font-bbh text-sm text-card-lighter-2">
                  Couldn't load your routine. Tap to retry.
                </Text>
              </Pressable>
            ) : null}
            <RewindQuestionnaireContent
              key={user.id}
              questionnaire={questionnaire}
              available={canStart && !routineQuery.isPending}
              startLabel={startLabel}
              onStart={() => {
                if (!overview?.routine) openRoutineSettings()
                else questionnaire.start.mutate()
              }}
              onCompleted={(sessionId) =>
                void navigate({
                  params: { sessionId },
                  search: { from: 'rewind' },
                  to: '/app/r/$sessionId',
                })
              }
            />
          </View>
          <Pressable
            accessibilityLabel="Open Rewind insights"
            onPress={() => void navigate({ to: '/app/rewind-history' })}
            className="mb-mg mt-auto min-h-20 w-full flex-row items-center gap-3 rounded-[32px] bg-card-light-50 px-4 py-3 pr-6 text-left"
          >
            <View className="size-11 shrink-0 items-center justify-center rounded-full bg-cardd">
              <RiPulseLine size={20} className="text-accent-500" />
            </View>
            <View className="min-w-0 flex-1 gap-1">
              <Text className="font-bbh text-sm font-bold text-white">
                Insights
              </Text>
              <Text className="line-clamp-2 font-bbh text-xs text-card-lighter-3">
                {latestReflection.data?.summary ||
                  'See the patterns your reflections are beginning to show'}
              </Text>
            </View>
            <View className="rounded-full bg-white p-0.5">
              <RiArrowRightSLine size={19} className="shrink-0 text-black" />
            </View>
          </Pressable>
        </View>
      </NoiseComponent>
      <BottomNotch />
    </View>
  )
}
