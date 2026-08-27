import { TopNotch } from '@/components/common/notch.component'
import { OnboardingBackground } from '@/components/common/onboarding-background.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import ENV from '@/env'
import { useAuth } from '@/providers/auth.provider'
import { isGoogleLoginAvailable } from '@/shared/utils/auth-platform.util'
import { navigateAfterAuth } from '@/shared/utils/auth-redirect.util'
import { getGoogleAuthStatusText } from '@/shared/utils/auth-status.util'
import { RiGoogleFill, RiLoader4Line } from '@remixicon/react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { LineWobble } from 'ldrs/react'
import 'ldrs/react/LineWobble.css'

/**
 * Generic landing screen for the starter template.
 *
 * This screen intentionally has:
 * - no authentication logic
 * - no product-specific copy or flows
 *
 * It simply demonstrates navigation into the main app shell.
 */
export default function AppScreen() {
  const navigate = useNavigate()
  const router = useRouter()
  const {
    googleAuthStatus,
    isAuthenticated,
    isLoading,
    error,
    stale,
    loginWithGoogle,
  } = useAuth()
  const [loginError, setLoginError] = useState<string | null>(null)
  const canUseGoogleLogin = isGoogleLoginAvailable(ENV.PLATFORM)
  const isGoogleLoading = googleAuthStatus !== 'idle'
  const loadingText =
    getGoogleAuthStatusText(googleAuthStatus) ??
    (isLoading ? 'Checking your session...' : null)

  // Navigate to home when authentication succeeds
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      void navigateAfterAuth(router)
    }
  }, [isAuthenticated, isLoading, router])

  const handleGetStarted = () => {
    setLoginError(null)
    navigate({ to: '/auth/login' })
  }

  const handleGoogle = async () => {
    try {
      setLoginError(null)
      await loginWithGoogle()
      await navigateAfterAuth(router)
    } catch (err: any) {
      const msg =
        err instanceof Error ? err.message : 'Failed to sign in with Google'
      setLoginError(msg)
    }
  }

  if (stale) {
    return null
  }

  return (
    <View className="flex-1 bg-black p-4 relative overflow-hidden">
      <OnboardingBackground />
      <TopNotch />

      <View className="flex-1 z-[100] max-w-3xl mx-auto flex flex-col gap-8 justify-between py-8">
        <View className="space-y-4 my-auto">
          <View className="items-center transit justify-end gap-1">
            <div className="size-[120px]">
              <img
                src={'./assets/glass-icon.png'}
                loading="eager"
                className="size-full bg-burnt-coffee-900 rounded-[32px] rotate-[5deg] object-cover"
              />
            </div>
            <Text className="whitespace-nowrap mt-3 leading-tight text-center text-[30px] font-black text-white">
              Catch the Vybe. 🔥 <br /> Lock In. Streak Up.
            </Text>
            <Text className="text-center text-card-lighter-3 text-[15px] leading-[28px] text-white opacity-70">
              Streaking with epic rewards?{'\n'} Totally worth starting!
            </Text>
          </View>
        </View>

        <View className="flex flex-col gap-3 text-center">
          {isLoading && (
            <View className="items-center gap-2">
              <LineWobble
                size="50"
                stroke="12"
                bgOpacity="0.1"
                speed="1.8"
                color="white"
              />
              {loadingText && (
                <Text className="text-card-lighter-2 text-xs font-bbh text-center">
                  {loadingText}
                </Text>
              )}
            </View>
          )}
          <View className="flex-row z-[300000] relative p-1 gap-2 mx-auto bg-card-light/50 rounded-full">
            <TouchableOpacity
              className="rounded-full text-center  bg-white px-8 py-4 flex-row justify-center items-center"
              disabled={isLoading}
              onPress={handleGetStarted}
            >
              <Text className="text-black text-md  font-semibold">
                Get Started
              </Text>
            </TouchableOpacity>
            {canUseGoogleLogin && (
              <TouchableOpacity
                className="rounded-full bg-card-light-50 p-4 flex items-center justify-center aspect-square"
                disabled={isLoading || isGoogleLoading}
                onPress={handleGoogle}
              >
                {isGoogleLoading ? (
                  <RiLoader4Line className="text-white animate-spin" />
                ) : (
                  <RiGoogleFill className="text-white" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {(loginError || error) && (
            <Text className="text-red-400 text-sm font-bbh text-center mt-2">
              {loginError || error}
            </Text>
          )}

          <Text className="text-card-lighter-3/50 text-sm mt-2">
            By Proceeding you agree to comply to our <br />
            <Text className="underline">Terms of Service</Text> and{' '}
            <Text className="underline">Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </View>
  )
}
