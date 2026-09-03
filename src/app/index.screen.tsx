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

import { homeActions } from '@/components/custom/home/home-actions.component'
import { Moti } from '@/shared/constants.shared'
import { adjustColor, seededColor } from '@/shared/utils/helpers.util'
import { LineWobble } from 'ldrs/react'
import 'ldrs/react/LineWobble.css'

/**
 * Public entry point for Vybaa's goal-first experience.
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

  // The root route is an auth boundary. Never mount onboarding while a
  // session is being resolved or after authentication has been confirmed.
  if (stale || isLoading || isAuthenticated) {
    return null
  }

  return (
    <View className="flex-1 [&_*]:!text-center bg-black p-4 relative overflow-hidden">
      <OnboardingBackground />
      <TopNotch />

      <View className="flex-1 z-[100] max-w-3xl mx-auto flex flex-col gap-8 justify-between pt-8 pb-2">
        <View className="space-y-4 my-auto">
          <View className="items-center transit justify-end gap-1">
            <div className="size-[120px]">
              <img
                src={'./assets/glass-icon.png'}
                loading="eager"
                className="size-full bg-burnt-coffee-900 rounded-[32px] rotate-[5deg] object-cover"
              />
            </div>
            <Text className="!text-center whitespace-nowrap mt-3 leading-tight text-center text-[27px] font-black text-white">
              You, Reflect. Reset. <br /> Move forward.
            </Text>
            <Text className="!text-center !text-card-lighter-3 text-[15px] leading-[28px] text-white opacity-70">
              Journal your days. Rewind your thoughts. Reach your goals.
            </Text>
          </View>
        </View>

        <View className="relative">
          {homeActions().map((action, index) => {
            const size = 80
            const gap = -10
            const roundness = 16

            const Icon = action.icon

            const color = seededColor(
              JSON.stringify(index),
              String(Math.random()),
            )
            const darkColor = adjustColor(color, { lightness: -5 })

            return (
              <Moti.div
                initial={{
                  y: 50,
                  opacity: 0,
                }}
                animate={{
                  y: 0,
                  opacity: 1,
                }}
                transition={{
                  delay: index / 10,
                }}
                key={index + 'sdssss'}
                className="relative"
              >
                <View
                  style={
                    {
                      '--size': `${size}px`,
                      '--offset-x': `${index * (size + gap)}px`,
                      '--color': color,
                      '--darkColor': darkColor,
                      '--roundness': `${roundness}px`,
                    } as any
                  }
                  className="size-[var(--size)] flex-col flex items-center justify-center bg-cardx right-7 top-0 absolute  rounded-2xl rotate-12 -translate-y-[70%] -translate-x-[var(--offset-x)]"
                >
                  <View className="size-full flex-col  flex items-center justify-center">
                    <View
                      className="border-2 size-full absolute z-[99] rounded-[var(--roundness)] border-[var(--color)]"
                      style={{
                        maskImage: `linear-gradient(to bottom, transparent 0%, transparent 10%, black 130%)`,
                      }}
                    ></View>
                    <View
                      style={{
                        background:
                          'radial-gradient( transparent 30%, var(--color))',
                        maskImage: `linear-gradient(to top, transparent 0%, transparent 50%, black 130%)`,
                      }}
                      className="bg-[var(--color)]  w-full h-full absolute bottom-0 rounded-[var(--roundness)]  "
                    />

                    <Icon
                      color={darkColor}
                      size={20}
                      className="text-white z-10"
                    />
                    <View className="mt-1 flex-col items-center justify-center z-10">
                      <Text className="font-bold  text-[7px] text-card-lighter-3">
                        {action.name}
                      </Text>
                      <Text className="text-sm hidden leading-tight text-card-lighter-3/60">
                        {action.description}
                      </Text>
                    </View>
                  </View>
                </View>
              </Moti.div>
            )
          })}
          <View className="flex relative overflow-hidden z-10 flex-col gap-3 text-center bg-[#05090f] rounded-[27px] pt-7 pb-10 shadow-[0px_0px_30px_#000] shadow-black border-2 border-cardx/20">
            {(loginError || error) && (
              <Text className="text-pink-700 bg-pink-500/10 mx-auto px-3 py-1 rounded-full text-sm font-bbh text-center mt-2">
                {loginError || error}
              </Text>
            )}
            <View className="z-10 gap-3">
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
              <View className="flex-row z-[300000] relative p-1 gap-2 mx-auto bg-blue-300/10 rounded-full">
                <TouchableOpacity
                  className="rounded-full text-center  bg-white px-8 py-4 flex-row justify-center items-center"
                  disabled={isLoading}
                  onPress={handleGetStarted}
                >
                  <Text className="text-black text-sm  font-semibold">
                    Get started
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

              <Text className="text-card-lighter-3/50 text-xs mt-2">
                By Proceeding you agree to comply to our <br />
                <Text className="underline">Terms of Service</Text> and{' '}
                <Text className="underline">Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
