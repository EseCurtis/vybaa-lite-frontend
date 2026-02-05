import { hapticFeedback } from '@/shared/haptic.util'
import { RiArrowLeftLine } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Pressable } from '../layout/pressables.component'
import { Text } from '../layout/text.component'
import { View } from '../layout/view.component'
import { TopNotch } from './notch.component'

export function TabHeader({
  title,
  onBack,
  children
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
          >
            <RiArrowLeftLine className="text-white" size={32} />
          </Pressable>
          <Text className="text-white text-2xl font-bold">{title}</Text>
        </View>

        <View className="">{children}</View>
      </View>
    </View>
  )
}
