import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useBottomSheet } from '@/hooks/use-bottom-sheet.hook'
import { useHomeActionPreferences } from '@/hooks/use-home-actions.hook'
import { useAuth } from '@/providers/auth.provider'
import { featureFlags } from '@/shared/config/feature-flags.config'
import { adjustColor, cn, seededColor } from '@/shared/utils/helpers.util'
import { saveHomeActionPreferences } from '@/shared/home/home-action-preferences'
import type { HomeActionId } from '@/shared/home/home-action-preferences'
import { useCallback, useRef } from 'react'
import type { CSSProperties } from 'react'
import {
  RiArrowRightUpLine,
  RiCheckDoubleLine,
  RiEmotionLaughLine,
  RiHeart2Line,
  RiRewindLine,
  RiTempColdLine,
  RiEqualizerLine,
  type RemixiconComponentType,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { HomeRewindTimer } from './home-rewind-timer.component'
import { HomeActionsSheet } from './home-actions-sheet.component'

export type HomeAction = {
  id: HomeActionId
  name: string
  description: string
  icon: RemixiconComponentType
  enabled?: boolean
  onAction: () => void
}
type HomeDestination =
  | '/app/actions/flexx'
  | '/app/goal'
  | '/app/rewind'
  | '/app/rewind-history'
  | '/chill'

export function homeActions(
  navigate?: (destination: { to: HomeDestination }) => unknown,
  handleCreateGoal?: () => void,
  rewindPersona?: string,
): HomeAction[] {
  const actions: HomeAction[] = [
    {
      id: 'flexx',
      name: ' Flexx',
      description: 'Share stats to flexx on socials',
      icon: RiEmotionLaughLine,
      onAction() {
        navigate?.({
          to: '/app/actions/flexx',
        })
      },
    },
    {
      id: 'tasks',
      name: 'My Tasks',
      description: 'Commit to a new cause',
      icon: RiCheckDoubleLine,
      onAction() {
        handleCreateGoal?.()
      },
    },
    {
      id: 'rewind',
      name: `Rewind w/ ${rewindPersona || 'partner'}`,
      description: 'Chat with your Rewind partner',
      icon: RiRewindLine,
      onAction() {
        navigate?.({
          to: '/app/rewind',
        })
      },
    },

    {
      id: 'wellbeing',
      name: 'Wellbeing',
      description: 'See your progress patterns',
      icon: RiHeart2Line,
      //enabled: featureFlags.insights,
      onAction() {
        navigate?.({
          to: '/app/rewind-history',
        })
      },
    },
    // {
    //   name: 'Journal',
    //   description: 'Reflect on your day and track your thoughts',
    //   icon: RiFileMarkedLine,
    //   enabled: featureFlags.journal,
    //   onAction() {
    //     // Navigate directly to today's journal entry
    //     const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    //     navigate({
    //       to: `/journal/${today}`,
    //     })
    //   },
    // },
    {
      id: 'chill',
      name: 'Chill',
      description: 'Calm down and regulate your emotions',
      icon: RiTempColdLine,
      enabled: featureFlags.chill,
      onAction() {
        navigate?.({
          to: '/chill',
        })
      },
    },
  ]
  return actions.filter((action) => action.enabled !== false)
}

function HomeActionCard({
  id,
  name,
  description,
  icon,
  onAction = () => {},
  filled = false,
  testID,
}: {
  id: HomeActionId
  name: string
  description: string
  icon: RemixiconComponentType
  onAction?: () => void
  filled?: boolean
  testID: string
}) {
  const { user } = useAuth()
  const Icon = icon
  const colorSeed = name === 'New Task' ? 'New Goal' : name
  const color = seededColor(
    JSON.stringify(colorSeed),
    user?.username || user?.email || 'default',
  )
  const darkColor = adjustColor(color, { lightness: -5 })

  const roundedness = 'rounded-full'
  const actionStyle: CSSProperties & {
    '--color': string
    '--darkColor': string
  } = {
    '--color': color,
    '--darkColor': darkColor,
  }

  return (
    <View
      style={actionStyle}
      className={cn(
        ' text-center snap-center  shrink-0 rounded-[40px] overflow-hidden',
        filled ? 'col-span-2' : 'col-span-1',
      )}
    >
      <Pressable
        type="button"
        testID={testID}
        onPress={onAction}
        className={cn(
          !filled && ' ',
          'min-h-12 w-full overflow-hidden flex-row relative items-center justify-center bg-cardx p-mg py-[10px] active:!scale-[0.97] motion-reduce:!transform-none ' +
            roundedness,
        )}
      >
        <View
          aria-hidden="true"
          className={`pointer-events-none border-2 size-full absolute z-[99] border-[var(--color)] ${roundedness}`}
          style={{
            maskImage:
              'linear-gradient(to left, transparent 0%, transparent 10%, black 130%)',
          }}
        />
        <View
          aria-hidden="true"
          style={{
            background: 'radial-gradient( transparent 30%, var(--color))',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, transparent 50%, black 130%)',
          }}
          className={`pointer-events-none bg-[var(--color)] w-full h-full absolute bottom-0 rounded-[40px] ${roundedness}`}
        />
        <Icon
          color={darkColor}
          size={20}
          className="text-white z-10 -translate-x-2"
        />
        <View className="mt-1 flex-col items-center justify-center z-10">
          <Text className="font-bold capitalize text-card-lighter-3">
            {name}
          </Text>
          {id === 'rewind' ? <HomeRewindTimer /> : null}
          <Text className="text-sm hidden leading-tight text-card-lighter-3">
            {description}
          </Text>
        </View>
        <RiArrowRightUpLine
          color={darkColor}
          size={20}
          className="text-white z-10 ml-auto translate-x-1"
        />
      </Pressable>
    </View>
  )
}

export function HomeActions() {
  const navigate = useNavigate()
  const handleCreateGoal = () => {
    navigate({ to: '/app/goal' })
  }
  const { user } = useAuth()
  const bottomSheet = useBottomSheet()
  const preferences = useHomeActionPreferences(user?.id)
  const customizeRef = useRef<HTMLButtonElement>(null)
  const restoreFocus = useCallback(() => {
    customizeRef.current?.focus()
  }, [])

  const available = homeActions(
    navigate,
    handleCreateGoal,
    user?.rewindPersona ?? undefined,
  )
  const actions = preferences.order.flatMap((id) =>
    available.filter(
      (action) => action.id === id && !preferences.hidden.includes(id),
    ),
  )

  return (
    <View className="px-mg py-mg mt-2 gap-2">
      <View className="flex-row justify-end">
        <Pressable
          ref={customizeRef}
          type="button"
          accessibilityLabel="Customize Home shortcuts"
          onPress={() =>
            bottomSheet.present(
              <HomeActionsSheet
                actions={available}
                initial={preferences}
                onClosed={restoreFocus}
                onSave={(next) => {
                  if (!user?.id)
                    throw new Error('Sign in before saving shortcuts')
                  saveHomeActionPreferences(user.id, next)
                  bottomSheet.dismiss()
                }}
              />,
              { title: 'Home shortcuts' },
            )
          }
          className="min-h-11 flex-row items-center justify-center gap-2 px-2 text-xs font-semibold text-card-lighter-3 active:!scale-95 motion-reduce:!transform-none"
        >
          <RiEqualizerLine size={16} />
          Customize
        </Pressable>
      </View>
      <View className="flex-row snap-x snap-mandatory gap-4 w-full flex-wrap">
        {actions.map((item, index) => {
          return (
            <HomeActionCard
              key={item.id}
              id={item.id}
              name={item.name}
              description={item.description}
              onAction={item?.onAction}
              icon={item.icon}
              filled={actions.length % 2 !== 0 && index === actions.length - 1}
              testID={
                item.id === 'tasks'
                  ? 'home-action-my-tasks'
                  : `home-action-${item.id}`
              }
            />
          )
        })}
      </View>
    </View>
  )
}
