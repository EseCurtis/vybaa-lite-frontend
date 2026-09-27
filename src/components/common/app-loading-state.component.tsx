import { LineWobble } from 'ldrs/react'
import 'ldrs/react/LineWobble.css'

import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { cn } from '@/shared/utils/helpers.util'

import { BottomNotch, TopNotch } from './notch.component'
import { OnboardingBackground } from './onboarding-background.component'

interface AppLoadingStateProps {
  detail?: string
  message: string
  mode?: 'dock' | 'screen'
}

function LoadingPanel({
  detail,
  message,
}: Pick<AppLoadingStateProps, 'detail' | 'message'>) {
  return (
    <View
      aria-busy="true"
      aria-live="polite"
      className="w-full max-w-md items-center gap-4 rounded-[26px] px-6 py-7"
      role="status"
    >
      <View className="size-14 overflow-hidden rounded-2xl bg-cardx p-1">
        <img
          alt=""
          className="size-full rounded-xl object-cover"
          src="/assets/glass-icon.png"
        />
      </View>
      <LineWobble
        bgOpacity="0.15"
        color="white"
        size="64"
        speed="1.6"
        stroke="10"
      />
      <View className="items-center gap-1 hidden">
        <Text className="text-center font-bbh text-sm font-bold text-white">
          {message}
        </Text>
        {detail ? (
          <Text className="max-w-[280px] text-center text-xs leading-5 text-card-lighter-2">
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

export function AppLoadingState({
  detail,
  message,
  mode = 'screen',
}: AppLoadingStateProps) {
  if (mode === 'dock') {
    return (
      <View className="pointer-events-none fixed inset-x-0 bottom-0 z-50 items-center px-4 pb-[calc(var(--safe-area-inset-bottom)+16px)]">
        <LoadingPanel detail={detail} message={message} />
        <BottomNotch />
      </View>
    )
  }

  return (
    <View
      className={cn(
        'relative min-h-dvh flex-1 overflow-hidden bg-black px-4',
        'items-center justify-end pb-[calc(var(--safe-area-inset-bottom)+24px)]',
      )}
    >
      <OnboardingBackground backgroundSize="cover" />
      <TopNotch />
      <View className="relative z-10 w-full items-center">
        <LoadingPanel detail={detail} message={message} />
      </View>
      <BottomNotch />
    </View>
  )
}
