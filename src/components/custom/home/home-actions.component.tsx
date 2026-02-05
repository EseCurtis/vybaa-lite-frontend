import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { adjustColor, seededColor } from '@/shared/utils/helpers.util'
import {
  RiEmotionLaughLine,
  RiFileMarkedLine,
  RiFireLine,
  RiTempColdLine,
  type RemixiconComponentType,
} from '@remixicon/react'

const actions = [
  {
    name: 'New Goal',
    description: 'Commit to a new cause',
    icon: RiFireLine,
  },
  {
    name: 'Flexx',
    description: 'Share stats to flexx on socials',
    icon: RiEmotionLaughLine,
  },
  {
    name: 'Journal',
    description: 'Share stats to flexx on socials',
    icon: RiFileMarkedLine,
  },
  {
    name: 'Chill',
    description: 'Share stats to flexx on socials................',
    icon: RiTempColdLine,
  }
]

function HomeActionCard({
  name,
  description,
  icon,
}: {
  name: string
  description: string
  icon: RemixiconComponentType
}) {
  const Icon = icon
  const color = seededColor(name, description, icon.displayName!)
  const darkColor = adjustColor(color, { lightness: -5 })
  const darkerColor = adjustColor(color, { lightness: 10 })

  return (
    <View className="col-span-1 text-center ">
      <Pressable
        style={
          {
            //background: color,
          }
        }
        className="w-full flex-col items-center justify-center h-[140%] bg-card-light/20 rounded-3xl p-mg"
      >
        <Icon color={darkColor} size={70} className="text-white" />
        <View className="mt-3 flex-col items-center justify-center">
          <Text className="font-bold text-card-lighter-3">{name}</Text>
          <Text className="text-sm hidden leading-tight text-card-lighter-3/60">
            {description}
          </Text>
        </View>
      </Pressable>
    </View>
  )
}

export function HomeActions() {
  return (
    <View className="grid grid-cols-2 px-mg py-mg mt-2 gap-2 ">
      {actions.map((item, index) => {
        return (
          <HomeActionCard
            key={index}
            name={item.name}
            description={item.description}
            icon={item.icon}
          />
        )
      })}
    </View>
  )
}
