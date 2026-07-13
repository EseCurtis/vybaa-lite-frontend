import { AuthScreenLayout } from '@/components/common/auth-screen-layout.component'
import { Input } from '@/components/common/input.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { authAPI } from '@/shared/api/auth.api'
import { userAPI } from '@/shared/api/user.api'
import { cn } from '@/shared/utils/helpers.util'
import { RiCheckLine, RiCloseLine, RiLoader4Line } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

type SignupAction = 'creating-account' | 'sending-code' | null

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function SignupScreen() {
  const { registerWithEmail } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [error, setError] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<SignupAction>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<
    boolean | null
  >(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const validateUsername = (value: string): string | null => {
    if (!value) return 'Username is required'
    if (value.length < 3) return 'Username must be at least 3 characters'
    if (value.length > 20) return 'Username must be 20 characters or less'
    if (!/^[a-z0-9_]+$/.test(value))
      return 'Use lowercase letters, numbers, and underscores'
    if (value.startsWith('_') || value.endsWith('_'))
      return 'Username can’t start or end with underscore'
    return null
  }

  const debouncedUsername = useDebounce(username, 450)

  useEffect(() => {
    const cleaned = debouncedUsername.trim().toLowerCase()
    if (!cleaned) {
      setUsernameError('Username is required')
      setIsUsernameAvailable(null)
      setIsCheckingUsername(false)
      return
    }

    const formatError = validateUsername(cleaned)
    setUsernameError(formatError)
    if (formatError) {
      setIsUsernameAvailable(false)
      setIsCheckingUsername(false)
      return
    }

    let cancelled = false
    setIsCheckingUsername(true)
    setIsUsernameAvailable(null)
    ;(async () => {
      try {
        const res = await userAPI.checkUsernameExists(cleaned)
        if (cancelled) return
        setIsUsernameAvailable(res.data.available)
        setUsernameError(
          res.data.available
            ? null
            : res.data.reason || 'Username is already taken',
        )
      } catch {
        if (cancelled) return
        setIsUsernameAvailable(null)
        setUsernameError('Unable to verify username right now')
      } finally {
        if (!cancelled) setIsCheckingUsername(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [debouncedUsername])

  const canContinue = useMemo(() => {
    if (step !== 1) return true
    if (!firstName || !lastName || !email) return false
    if (isCheckingUsername) return false
    return isUsernameAvailable === true && !usernameError
  }, [
    email,
    firstName,
    isCheckingUsername,
    isUsernameAvailable,
    lastName,
    step,
    usernameError,
  ])

  const isSubmitting = activeAction !== null
  const loadingText =
    activeAction === 'creating-account'
      ? 'Creating your account...'
      : activeAction === 'sending-code'
        ? 'Sending your confirmation code...'
        : isCheckingUsername
          ? 'Checking username availability...'
          : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (step === 1) {
      if (!firstName || !lastName || !email) {
        setError('Please fill in your name and email to continue.')
        toast.error('Fill in all fields to continue')
        return
      }

      if (isCheckingUsername) {
        toast.loading('Checking username…')
        return
      }

      if (validateUsername(username.trim().toLowerCase())) {
        const msg = validateUsername(username.trim().toLowerCase())!
        setError(msg)
        toast.error(msg)
        return
      }

      if (isUsernameAvailable !== true) {
        const msg = usernameError || 'Please choose an available username'
        setError(msg)
        toast.error(msg)
        return
      }
      setStep(2)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      toast.error('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      toast.error('Passwords do not match.')
      return
    }

    try {
      setActiveAction('creating-account')
      const res = await registerWithEmail({
        email,
        password,
        firstName,
        lastName,
        username: username.trim().toLowerCase(),
      })

      if ('data' in res && (res as any).data?.confirmationRequired) {
        // Trigger confirmation code email and go to confirmation screen
        setActiveAction('sending-code')
        await authAPI.requestConfirmation(email)
        toast.success('We sent you a confirmation code')
        navigate({
          to: '/auth/confirm',
          search: { email },
        })
        return
      }

      // Fallback: if backend ever returns an auth response directly
      navigate({
        to: '/auth/confirm',
        search: { email },
      })
      toast.success('Account created. Enter your confirmation code')
    } catch (err: any) {
      setError(err?.msg || err?.message || 'Sign up failed')
      toast.error(err?.msg || err?.message || 'Sign up failed')
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <AuthScreenLayout
      headerTitle="Create your account"
      onBack={() => {
        if (step === 2) {
          setStep(1)
          return
        }
        navigate({ to: '/' })
      }}
      rootClassName="pt-28"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        {step === 1 ? (
          <>
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              disabled={isSubmitting}
              placeholder="vybee"
              leftIcon={<Text className={cn("text-white text-lg font-bbh font-bold", isCheckingUsername ? "text-white/70  animate-pulse":(isUsernameAvailable ? " text-green-400": "text-rose-500"))}>@</Text>}
              error={usernameError || undefined}
              helperText={
                !usernameError && isUsernameAvailable
                  ? 'Nice — that username is available'
                  : 'Lowercase letters, numbers, underscores (3–20)'
              }
              rightIcon={
                isCheckingUsername ? (
                  <RiLoader4Line
                    className="text-white/70 animate-spin"
                    size={18}
                  />
                ) : isUsernameAvailable === true ? (
                  <RiCheckLine className="text-green-400" size={18} />
                ) : isUsernameAvailable === false ? (
                  <RiCloseLine className="text-danger-500" size={18} />
                ) : null
              }
            />
            <View className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmitting}
                placeholder="Jane"
              />
              <Input
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSubmitting}
                placeholder="Doe"
              />
            </View>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              placeholder="you@example.com"
            />
          </>
        ) : (
          <>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              placeholder="••••••••"
            />
            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              placeholder="••••••••"
            />
          </>
        )}

        {error && (
          <Text className="text-danger-500 text-sm font-bbh">{error}</Text>
        )}
        {loadingText && (
          <Text className="text-card-lighter-2 text-xs font-bbh">
            {loadingText}
          </Text>
        )}
        {/* {message && (
            <Text className="text-green-400 text-sm font-bbh">{message}</Text>
          )} */}

        <Button
          type="submit"
          label={
            activeAction === 'creating-account'
              ? 'Creating account...'
              : activeAction === 'sending-code'
                ? 'Sending code...'
                : step === 1
                  ? 'Continue'
                  : 'Sign up'
          }
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting || (step === 1 && !canContinue)}
          className={cn('mt-4', step === 1 && !canContinue && 'opacity-70')}
        />
      </form>

      <View className="mt-auto">
        <Button
          variant="ghost"
          fullWidth
          label="Already have an account? Log in"
          disabled={isSubmitting}
          onClick={() => navigate({ to: '/auth/login' })}
        />
      </View>
    </AuthScreenLayout>
  )
}
