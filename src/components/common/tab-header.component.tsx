import { hapticFeedback } from '@/shared/haptic.util'
import { RiArrowLeftSLine } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Pressable } from '../layout/pressables.component'
import { Text } from '../layout/text.component'
import { View } from '../layout/view.component'
import { TopNotch } from './notch.component'

export function TabHeader({
  title,
  onBack,
  children,
}: {
  title?: ReactNode
  onBack?: () => void
  children?: ReactNode
}) {
  const router = useRouter()

  return (
    <View className="px-mg py-mg">
      <TopNotch />

      <View className="flex-row justify-between items-center">
        <View className="flex-row gap-7 items-center">
          <Pressable
            onPress={() => {
              onBack ? onBack() : router.history.back()
              hapticFeedback.light()
            }}
            className="w-12 h-12 rounded-full bg-card-light/40 flex items-center justify-center"
          >
            <RiArrowLeftSLine size={24} className="text-white" />
          </Pressable>
          
        </View>

        <Text className="text-white text-2xl font-bold">{title}</Text>

        <View className="">{children}</View>
      </View>
    </View>
  )
}
