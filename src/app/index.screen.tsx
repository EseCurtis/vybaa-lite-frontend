import { TopNotch } from '@/components/common/notch.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import ENV from '@/env'
import { useAuth } from '@/providers/auth.provider'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

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
  const { isAuthenticated, isLoading, loginWithGoogle, error } = useAuth()
  const [loginError, setLoginError] = useState<string | null>(null)

  // Navigate to home when authentication succeeds
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate({ to: '/app/home' })
    }
  }, [isAuthenticated, isLoading, navigate])

  const handleGoogleLogin = async () => {
    try {
      setLoginError(null)
      await loginWithGoogle()
      // Navigation will happen automatically via useEffect when isAuthenticated becomes true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google'
      setLoginError(errorMessage)
      console.error('Google login error:', err)
    }
  }

  return (
    <View className="flex-1 bg-black p-4">
      <TopNotch />

      <View className="flex-1 max-w-3xl mx-auto flex flex-col gap-8 justify-between py-8">
        <View className="space-y-4">
          <Text className="text-white text-sm font-outfit tracking-wide uppercase opacity-70">
            Starter template
          </Text>
          <Text className="text-white text-4xl md:text-5xl font-bold font-bbh leading-tight">
            Build your {ENV.GOOGLE_IOS_CLIENT_ID} next product
            <Text className="text-accent-400"> faster</Text>.
          </Text>
          <Text className="text-white/70 text-base md:text-lg font-outfit max-w-xl">
            This starter gives you a responsive layout, routing, and a mobile-ready shell.
            Replace this copy and the example screens with your own features.
          </Text>
        </View>

        <View className="flex flex-col gap-3">
          <TouchableOpacity
            className="rounded-full text-center w-full bg-accent-400 border border-accent-300 px-8 py-4 flex-row justify-center items-center"
            onPress={() => navigate({ to: '/app/home' })}
          >
            <Text className="text-black text-md font-outfit font-semibold">
              Open example app shell
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-full text-center w-full bg-white px-8 py-3 flex-row justify-center items-center"
            disabled={isLoading}
            onPress={handleGoogleLogin}
          >
            <Text className="text-black text-md font-outfit font-semibold">
              {isLoading ? 'Signing in with Google…' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {(loginError || error) && (
            <Text className="text-red-400 text-sm font-outfit text-center mt-2">
              {loginError || error}
            </Text>
          )}

          <TouchableOpacity
            className="rounded-full text-center w-full bg-card-600 px-8 py-4 flex-row justify-center items-center"
            onPress={() => navigate({ to: '/app/settings' })}
          >
            <Text className="text-white text-md font-outfit font-semibold">
              View example settings
            </Text>
          </TouchableOpacity>

          <Text className="text-card-100/70 font-outfit text-xs mt-2">
            Tip: Start by editing <Text className="underline">src/app/(app)/home.screen.tsx</Text> and{' '}
            <Text className="underline">src/app/(app)/settings.screen.tsx</Text> to match your product.
          </Text>
        </View>
      </View>
    </View>
  )
}
