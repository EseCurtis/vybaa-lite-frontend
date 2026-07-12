import { Input } from '@/components/common/input.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { userAPI } from '@/shared/api/user.api'
import {
  adjustColor,
  cn,
  seededColor,
} from '@/shared/utils/helpers.util'
import {
  RiCheckLine,
  RiCloseLine,
  RiEmotionLine,
  RiLoader4Line,
} from '@remixicon/react'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react'
import type { ProfileFormData, ProfileUser } from './profile.types'

interface UsernameValidationState {
  error: string | null
  isChecking: boolean
  isValid: boolean
}

interface ProfileInfoSectionProps {
  formData: ProfileFormData
  formError: string | null
  isEditing: boolean
  onFieldChange: (
    field: keyof Pick<ProfileFormData, 'firstName' | 'lastName' | 'username'>,
    value: string,
  ) => void
  onUsernameValidationChange?: (
    state: UsernameValidationState,
  ) => void
  user: ProfileUser
}

interface ProfileFieldCardProps {
  label: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  value: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [delay, value])

  return debouncedValue
}

function validateUsername(value: string): string | null {
  if (!value) {
    return 'Username is required'
  }

  if (value.length < 3) {
    return 'Username must be at least 3 characters'
  }

  if (value.length > 20) {
    return 'Username must be 20 characters or less'
  }

  if (!/^[a-z0-9_]+$/.test(value)) {
    return 'Use lowercase letters, numbers, and underscores'
  }

  if (value.startsWith('_') || value.endsWith('_')) {
    return 'Username can’t start or end with underscore'
  }

  return null
}

export function ProfileInfoSection({
  formData,
  formError,
  isEditing,
  onFieldChange,
  onUsernameValidationChange,
  user,
}: ProfileInfoSectionProps) {
  const color = seededColor(user?.currentMood!)
  const darkColor = adjustColor(color, { lightness: -40 })
  const darkerColor = adjustColor(color, { lightness: -50 })

  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<
    boolean | null
  >(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const validationCallbackRef = useRef(onUsernameValidationChange)

  useEffect(() => {
    validationCallbackRef.current = onUsernameValidationChange
  }, [onUsernameValidationChange])

  const debouncedUsername = useDebounce(formData.username, 450)

  const currentUsername = user?.username?.trim().toLowerCase() ?? ''

  useEffect(() => {
    if (!isEditing) {
      setIsCheckingUsername(false)
      setIsUsernameAvailable(null)
      setUsernameError(null)
      return
    }

    const cleanedUsername = debouncedUsername.trim().toLowerCase()

    if (!cleanedUsername) {
      setUsernameError('Username is required')
      setIsUsernameAvailable(null)
      setIsCheckingUsername(false)
      return
    }

    const formatError = validateUsername(cleanedUsername)

    if (formatError) {
      setUsernameError(formatError)
      setIsUsernameAvailable(false)
      setIsCheckingUsername(false)
      return
    }

    // The user should be allowed to retain their existing username.
    if (cleanedUsername === currentUsername) {
      setUsernameError(null)
      setIsUsernameAvailable(true)
      setIsCheckingUsername(false)
      return
    }

    let cancelled = false

    setIsCheckingUsername(true)
    setIsUsernameAvailable(null)
    setUsernameError(null)

    const checkUsernameAvailability = async () => {
      try {
        const response =
          await userAPI.checkUsernameExists(cleanedUsername)

        if (cancelled) {
          return
        }

        const isAvailable = response.data.available

        setIsUsernameAvailable(isAvailable)
        setUsernameError(
          isAvailable
            ? null
            : response.data.reason || 'Username is already taken',
        )
      } catch {
        if (cancelled) {
          return
        }

        setIsUsernameAvailable(null)
        setUsernameError('Unable to verify username right now')
      } finally {
        if (!cancelled) {
          setIsCheckingUsername(false)
        }
      }
    }

    void checkUsernameAvailability()

    return () => {
      cancelled = true
    }
  }, [currentUsername, debouncedUsername, isEditing])

  const isUsernameValid =
    isUsernameAvailable === true &&
    !usernameError &&
    !isCheckingUsername

  useEffect(() => {
    validationCallbackRef.current?.({
      error: usernameError,
      isChecking: isCheckingUsername,
      isValid: isUsernameValid,
    })
  }, [isCheckingUsername, isUsernameValid, usernameError])

  const handleUsernameChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const nextUsername = event.target.value.toLowerCase()

    onFieldChange('username', nextUsername)

    // Clear the previous backend result while waiting for the
    // debounced value to be checked.
    setIsUsernameAvailable(null)
    setUsernameError(
      validateUsername(nextUsername.trim().toLowerCase()),
    )
  }

  const usernameHelperText =
    !usernameError && isUsernameAvailable
      ? formData.username.trim().toLowerCase() === currentUsername
        ? 'This is your current username'
        : 'Nice — that username is available'
      : 'Lowercase letters, numbers, underscores (3–20)'

  return (
    <View
      className="space-y-3"
      style={
        {
          '--bg-color': darkColor,
          '--bg-color-2': darkerColor,
          '--bg-color-light': color,
        } as CSSProperties
      }
    >
      {!isEditing ? (
        <View className="space-y-3 mt-3">
          <View className="grid grid-cols-2 gap-3">
            <View className="col-span-2">
              <View className="bg-gradient-to-tr from-cardx via-cardx border border-[var(--bg-color-2)] to-[var(--bg-color-2)] rounded-[30px] p-4 flex-row items-start gap-4">
                <View className="w-10 h-10 rounded-xl bg-[var(--bg-color)] flex items-center justify-center shrink-0">
                  <RiEmotionLine
                    size={20}
                    className="text-[var(--bg-color-light)]"
                  />
                </View>

                <View className="flex-1 min-w-0">
                  <Text className="text-white/50 text-xs font-bbh leading-tight tracking-wide mb-1">
                    Mood
                  </Text>

                  <Text
                    className={
                      user?.currentMood
                        ? 'text-white text-base font-bbh font-semibold'
                        : 'text-white/40 text-base font-bbh'
                    }
                  >
                    {user?.currentMood || 'Not set'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View className="space-y-3 mb-3">
          <View className="rounded-2xl">
            <Text className="text-white/60 text-xs font-bbh mb-2 pl-2 tracking-wide">
              Username
            </Text>

            <Input
              type="text"
              placeholder="vybee"
              value={formData.username}
              onChange={handleUsernameChange}
              className="bg-cardx border-white/10 text-white"
              leftIcon={
                <Text
                  className={cn(
                    'text-lg font-bbh font-bold',
                    isCheckingUsername
                      ? 'text-white/70 animate-pulse'
                      : isUsernameAvailable === true
                        ? 'text-green-400'
                        : isUsernameAvailable === false ||
                            usernameError
                          ? 'text-rose-500'
                          : 'text-white',
                  )}
                >
                  @
                </Text>
              }
              error={usernameError || undefined}
              helperText={usernameHelperText}
              rightIcon={
                isCheckingUsername ? (
                  <RiLoader4Line
                    className="text-white/70 animate-spin"
                    size={18}
                  />
                ) : isUsernameAvailable === true ? (
                  <RiCheckLine
                    className="text-green-400"
                    size={18}
                  />
                ) : isUsernameAvailable === false ? (
                  <RiCloseLine
                    className="text-danger-500"
                    size={18}
                  />
                ) : null
              }
            />
          </View>

          <ProfileFieldCard
            label="First Name"
            placeholder="First name"
            value={formData.firstName}
            onChange={(event) => {
              onFieldChange('firstName', event.target.value)
            }}
          />

          <ProfileFieldCard
            label="Last Name"
            placeholder="Last name"
            value={formData.lastName}
            onChange={(event) => {
              onFieldChange('lastName', event.target.value)
            }}
          />

          {formError ? (
            <View className="bg-danger-500/20 rounded-xl p-4">
              <Text className="text-danger-500 text-sm font-bbh">
                {formError}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  )
}

function ProfileFieldCard({
  label,
  onChange,
  placeholder,
  value,
}: ProfileFieldCardProps) {
  return (
    <View className="rounded-2xl">
      <Text className="text-white/60 text-xs font-bbh mb-2 pl-2 tracking-wide">
        {label}
      </Text>

      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="bg-cardx border-white/10 text-white"
      />
    </View>
  )
}