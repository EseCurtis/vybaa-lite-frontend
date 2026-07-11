import { AuthScreenLayout } from '@/components/common/auth-screen-layout.component'
import { Input } from '@/components/common/input.component'
import { Button } from '@/components/layout/button.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { IS_MOBILE } from '@/shared/constants.shared'
import { RiGoogleFill } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export default function LoginScreen() {
  const { loginWithEmail, loginWithGoogle, isLoading } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await loginWithEmail({ email, password })
      toast.success('Welcome back')
      navigate({ to: '/app/home' })
    } catch (err: any) {
      const msg = err?.msg || err?.message || 'Login failed'
      setError(msg)
      toast.error(msg)
    }
  }

  const handleGoogle = async () => {
    try {
      await loginWithGoogle()
    } catch (err: any) {
      const msg =
        err instanceof Error ? err.message : 'Failed to sign in with Google'
      toast.error(msg)
    }
  }

  return (
    <AuthScreenLayout headerTitle="Log in" onBack={() => navigate({ to: '/' })}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          // className="rounded-lg"
        />
        <View className="flex flex-col">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            // className="rounded-lg py-0 "
          />
          <TouchableOpacity
            onPress={() => navigate({ to: '/auth/forgot-password' })}
            className="mt-3"
          >
            <Text className="text-white font-bold text-xs">
              Forgot your password?
            </Text>
          </TouchableOpacity>
        </View>

        {error && (
          <Text className="text-danger-500 text-sm font-bbh">{error}</Text>
        )}

        <Button
          type="submit"
          label="Log in"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
          className="mt-4"
        />
      </form>

      <View className="flex-row items-center gap-3 mt-4">
        <View className="flex-1 flex items-center justify-center">
          <View className="w-full h-[1px] bg-card-lighter/50" />
        </View>
        <Text className="text-card-lighter text-[10px] font-bbh uppercase tracking-[0.2em]">
          or continue with
        </Text>
        <View className="flex-1 flex items-center justify-center">
          <View className="w-full h-[1px] bg-card-lighter/50" />
        </View>
      </View>

      <View className="flex-row gap-3 mt-2">
        {IS_MOBILE && (
          <TouchableOpacity
            className="flex-1 py-4 rounded-full bg-cardd flex items-center justify-between px-4"
            disabled={isLoading}
            onPress={handleGoogle}
          >
            <RiGoogleFill className="text-white" size={18} />
            <View className="flex-row items-center gap-2 mx-auto">
              <Text className="text-white text-sm font-bbh font-bold">
                Continue with Google
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View className="mt-auto">
        <Button
          variant="ghost"
          fullWidth
          label="Need an account? Sign up"
          onClick={() => navigate({ to: '/auth/signup' })}
        />
      </View>
    </AuthScreenLayout>
  )
}
