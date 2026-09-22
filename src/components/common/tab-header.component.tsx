import { hapticFeedback } from '@/shared/haptic.util'
import { navigateBackWithinApp } from '@/shared/utils/app-navigation.util'
import { cn } from '@/shared/utils/helpers.util'
import { RiArrowLeftSLine } from '@remixicon/react'
import { useLocation, useRouter } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'
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
}): ReactElement {
  const router = useRouter()
  const location = useLocation()

  return (
    <View className={cn(className, 'px-mg py-mg')}>
      <TopNotch />

      <View className="flex-row justify-between  items-center">
        {canGoBack && (
          <View className="">
            <Pressable
              accessibilityLabel="Go back"
              onPress={() => {
                if (onBack) {
                  onBack()
                } else {
                  void navigateBackWithinApp(router, location.pathname).then(
                    (handled) => {
                      if (!handled) router.history.back()
                    },
                  )
                }
                void hapticFeedback.light()
              }}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
              testID="tab-header-back"
            >
              <RiArrowLeftSLine size={24} className="text-cardx" />
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
