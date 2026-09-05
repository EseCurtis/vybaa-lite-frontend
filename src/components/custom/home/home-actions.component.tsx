import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { featureFlags } from '@/shared/config/feature-flags.config'
import { adjustColor, cn, seededColor } from '@/shared/utils/helpers.util'
import {
  RiEmotionLaughLine,
  RiFireLine,
  RiHeart2Line,
  RiRewindLine,
  RiTempColdLine,
  type RemixiconComponentType,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'

export const homeActions = (
  navigate?: (...params: any) => void,
  handleCreateGoal?: () => void,
) =>
  [
    {
      name: 'New Goal',
      description: 'Commit to a new cause',
      icon: RiFireLine,
      onAction() {
        handleCreateGoal?.()
      },
    },
    {
      name: 'Rewind',
      description: 'Chat with your Rewind partner',
      icon: RiRewindLine,
      onAction() {
        navigate?.({
          to: '/app/rewind',
        })
      },
    },
    {
      name: 'Flexx',
      description: 'Share stats to flexx on socials',
      icon: RiEmotionLaughLine,
      onAction() {
        navigate?.({
          to: '/app/actions/flexx',
        })
      },
    },
    {
      name: 'Wellbeing',
      description: 'See your progress patterns',
      icon: RiHeart2Line,
      //enabled: featureFlags.insights,
      onAction() {
        navigate?.({
          to: '/app/sub-profile/insights',
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
  ].filter((action) => action.enabled !== false) // Filter out disabled features

function HomeActionCard({
  name,
  description,
  icon,
  onAction = () => {},
  filled = false,
}: {
  name: string
  description: string
  icon: RemixiconComponentType
  onAction?: () => void
  filled?: boolean
}) {
  const { user } = useAuth()
  const Icon = icon
  const color = seededColor(
    JSON.stringify(name),
    user?.username || user?.email || 'default',
  )
  const darkColor = adjustColor(color, { lightness: -5 })

  return (
    <View
      style={
        {
          '--color': color,
          '--darkColor': darkColor,
        } as any
      }
      className={cn(
        ' text-center  rounded-[40px] overflow-hidden',
        filled ? 'col-span-2' : 'col-span-1',
      )}
    >
      <Pressable
        onPress={onAction}
        className={cn(
          !filled && 'aspect-square ',
          'w-full overflow-hidden flex-col  relative items-center justify-center h-[140%] bg-cardx rounded-[40px] p-mg',
        )}
      >
        <View
          className="border-2 size-full absolute z-[99] rounded-[42px]  border-[var(--color)]"
          style={{
            maskImage: `linear-gradient(to bottom, transparent 0%, transparent 10%, black 130%)`,
          }}
        ></View>
        <View
          style={{
            background: 'radial-gradient( transparent 30%, var(--color))',
            maskImage: `linear-gradient(to top, transparent 0%, transparent 50%, black 130%)`,
          }}
          className="bg-[var(--color)]  w-full h-full absolute bottom-0 rounded-[40px]  "
        />
        <Icon color={darkColor} size={70} className="text-white z-10" />
        <View className="mt-1 flex-col items-center justify-center z-10">
          <Text className="font-bold  text-card-lighter-3">{name}</Text>
          <Text className="text-sm hidden leading-tight text-card-lighter-3/60">
            {description}
          </Text>
        </View>
      </Pressable>
    </View>
  )
}

export function HomeActions() {
  const navigate = useNavigate()
  const handleCreateGoal = () => {
    navigate({ to: '/app/goal/create' })
  }

  const actions = homeActions(navigate, handleCreateGoal)

  return (
    <View className="grid grid-cols-2 px-mg py-mg mt-2 gap-4 ">
      {actions.map((item, index) => {
        return (
          <HomeActionCard
            key={index}
            name={item.name}
            description={item.description}
            onAction={item?.onAction}
            icon={item.icon}
            filled={actions.length % 2 !== 0 && index === actions.length - 1}
          />
        )
      })}
    </View>
  )
}
