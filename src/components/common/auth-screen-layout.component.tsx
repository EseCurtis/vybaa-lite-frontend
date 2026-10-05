import { RiArrowLeftLine } from '@remixicon/react'
import type { ReactNode } from 'react'

import { cn } from '@/shared/utils/helpers.util'

import { hapticFeedback } from '@/shared/haptic.util'
import { KeyboardAvoidingView } from '../layout/keyboard-avoiding-view.component'
import { TouchableOpacity } from '../layout/pressables.component'
import { Text } from '../layout/text.component'
import { View } from '../layout/view.component'
import { TopNotch } from './notch.component'
import { OnboardingBackground } from './onboarding-background.component'

interface AuthBackHeaderProps {
  onBack: () => void
  title: string
}

interface AuthScreenLayoutProps {
  children: ReactNode
  contentClassName?: string
  headerTitle: string
  onBack: () => void
  rootClassName?: string
  footer?: ReactNode
}

export function AuthBackHeader({ onBack, title }: AuthBackHeaderProps) {
  const onBackAction = () => {
    onBack()
    hapticFeedback.light()
  }
  return (
    <View className="absolute top-0 left-0 w-full z-10 mt-mg px-mg">
      <TopNotch />
      <View className="flex-row items-center gap-3 mb-2">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
          onPress={onBackAction}
        >
          <RiArrowLeftLine className="text-cardd" size={18} />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold font-bbh">{title}</Text>
      </View>
    </View>
  )
}

export function AuthScreenLayout({
  children,
  contentClassName,
  headerTitle,
  onBack,
  rootClassName,
  footer,
}: AuthScreenLayoutProps) {
  return (
    <View className="flex-1">
      <KeyboardAvoidingView
        behavior="height"
        enableOnWeb
        keyboardVerticalOffset={24}
        className={cn(
          'flex-1 min-h-0 h-full bg-black pt-32 relative',
          rootClassName,
        )}
      >
        <OnboardingBackground backgroundSize="cover" />
        <AuthBackHeader title={headerTitle} onBack={onBack} />
        <View
          className={cn(
            'max-w-md mx-auto  min-h-0 flex-1 flex flex-col gap-6 overflow-y-auto overscroll-contain px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] relative z-10',
            contentClassName,
          )}
        >
          {children}
        </View>
      </KeyboardAvoidingView>
      <View className="px-4">{footer}</View>
    </View>
  )
}
