import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useBottomSheet } from '@/hooks/use-bottom-sheet.hook'
import { featureFlags } from '@/shared/config/feature-flags.config'
import { adjustColor, cn, seededColor } from '@/shared/utils/helpers.util'
import {
  RiEmotionLaughLine,
  RiFileMarkedLine,
  RiFireLine,
  RiRewindLine,
  RiTempColdLine,
  type RemixiconComponentType,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { CreateGoalSheet } from '../goal/create-goal-sheet.component'

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
  onAction?: () => void,
  filled?: boolean
}) {
  const Icon = icon
  const color = seededColor(name, description, icon.displayName!)
  const darkColor = adjustColor(color, { lightness: -5 })

  return (
    <View className={cn(" text-center ", filled ? "col-span-2" : "col-span-1")}>
      <Pressable
        onPress={onAction}
        className="w-full flex-col items-center justify-center h-[140%] bg-cardx rounded-[30px] p-mg"
      >
        <Icon color={darkColor} size={70} className="text-white" />
        <View className="mt-1 flex-col items-center justify-center">
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
  const bottomSheet = useBottomSheet()
  const navigate = useNavigate()
  const handleCreateGoal = () => {
    bottomSheet.present(<CreateGoalSheet onSuccess={bottomSheet.dismiss} />, {
      title: 'New Goal',
      elevation: 999,
    })
  }

  const actions = [
    {
      name: 'New Goal',
      description: 'Commit to a new cause',
      icon: RiFireLine,
      onAction() {
        handleCreateGoal()
      },
    },
    {
      name: 'Flexx',
      description: 'Share stats to flexx on socials',
      icon: RiEmotionLaughLine,
      onAction() {
        navigate({
          to: '/app/actions/flexx',
        })
      },
    },
    {
      name: 'Rewind',
      description: 'Chat with your Rewind partner',
      icon: RiRewindLine,
      onAction() {
        navigate({
          to: '/app/rewind',
        })
      },
    },
    {
      name: 'Journal',
      description: 'Reflect on your day and track your thoughts',
      icon: RiFileMarkedLine,
      enabled: featureFlags.journal,
      onAction() {
        // Navigate directly to today's journal entry
        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        navigate({
          to: `/journal/${today}`,
        })
      },
    },
    {
      name: 'Chill',
      description: 'Calm down and regulate your emotions',
      icon: RiTempColdLine,
      enabled: featureFlags.chill,
      onAction() {
        navigate({
          to: '/chill',
        })
      },
    },
  ].filter((action) => action.enabled !== false) // Filter out disabled features
  return (
    <View className="grid grid-cols-2 px-mg py-mg mt-2 gap-2 ">
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
