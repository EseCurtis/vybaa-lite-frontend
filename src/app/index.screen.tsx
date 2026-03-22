import { TopNotch } from '@/components/common/notch.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { RiAppleFill, RiGoogleFill } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
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
  const { isAuthenticated, isLoading, error, stale, loginWithGoogle } =
    useAuth()
  const [loginError, setLoginError] = useState<string | null>(null)

  // Navigate to home when authentication succeeds
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate({ to: '/app/home' })
    }
  }, [isAuthenticated, isLoading, navigate])

  const handleGetStarted = () => {
    setLoginError(null)
    navigate({ to: '/auth/login' })
  }

  const handleGoogle = async () => {
    try {
      setLoginError(null)
      await loginWithGoogle()
      // navigation happens via isAuthenticated effect
    } catch (err: any) {
      const msg =
        err instanceof Error ? err.message : 'Failed to sign in with Google'
      setLoginError(msg)
      console.error('Google login error:', err)
    }
  }

  if (stale) {
    return null
  }

  return (
    <View
      className="flex-1 bg-black p-4"
      style={{
        background: 'url(./assets/onboarding-bg.png)',
        backgroundSize: 'cover',
      }}
    >
      <TopNotch />

      <View className="flex-1 max-w-3xl mx-auto flex flex-col gap-8 justify-between py-8">
        <View className="space-y-4 my-auto">
          <View className="items-center justify-end gap-1">
            <div className="size-[120px]">
              <img
                src={'./assets/glass-icon.png'}
                className="size-full rotate-[5deg] object-cover"
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
            <View className="items-center">
              <LineWobble
                size="50"
                stroke="12"
                bgOpacity="0.1"
                speed="1.8"
                color="white"
              />
            </View>
          )}
          <View className="flex-row p-1 gap-2 mx-auto bg-card-light/50 rounded-full">
            <TouchableOpacity
              className="rounded-full text-center  bg-white px-8 py-4 flex-row justify-center items-center"
              disabled={isLoading}
              onPress={handleGetStarted}
            >
              <Text className="text-black text-md  font-semibold">
                Get Started
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-full bg-card-light-50 p-4  flex items-center justify-center aspect-square"
              disabled={isLoading}
              onPress={handleGoogle}
            >
              <RiGoogleFill className="text-white" />
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-full bg-card-light-50 p-4  flex items-center justify-center aspect-square"
              disabled={isLoading}
            >
              <RiAppleFill className="text-white" />
            </TouchableOpacity>
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
