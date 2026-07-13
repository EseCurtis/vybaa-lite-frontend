import { hapticFeedback } from '@/shared/haptic.util'
import { cn } from '@/shared/utils/helpers.util'
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
  canGoBack = true,
  className,
}: {
  title?: ReactNode
  onBack?: () => void
  children?: ReactNode
  canGoBack?: boolean
  className?: string
}) {
  const router = useRouter()

  return (
    <View className={cn(className, 'px-mg py-mg')}>
      <TopNotch />

      <View className="flex-row justify-between  items-center">
        {canGoBack && (
          <View className="">
            <Pressable
              onPress={() => {
                onBack ? onBack() : router.history.back()
                hapticFeedback.light()
              }}
              className="w-12 h-12 rounded-full bg-card-light/40 flex items-center justify-center"
            >
              <RiArrowLeftSLine size={24} className="text-white" />
            </Pressable>{' '}
          </View>
        )}

        <View
          className={cn(
            canGoBack ? 'text-center  items-center mx-auto' : 'text-left',
            ' col-span-1 ',
          )}
        >
          <Text className="text-white text-xl whitespace-nowrap font-bold">
            {title}
          </Text>
        </View>

        <View className="col-span-1 items-end  min-w-12 ">
          <View className="">{children || ''}</View>
        </View>
      </View>
    </View>
  )
}
