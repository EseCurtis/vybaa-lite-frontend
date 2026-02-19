import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { userAPI } from '@/shared/api/user.api'
import { RiCheckLine, RiCloseLine, RiLoader4Line, RiTimeLine } from '@remixicon/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

// Custom debounce hook
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

interface UsernameEditProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function UsernameEdit({ onSuccess, onCancel }: UsernameEditProps) {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [username, setUsername] = useState(user?.username || '')
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  
  // Debounce username for API calls (500ms)
  const debouncedUsername = useDebounce(username, 500)

  // Check username change availability
  const { data: availability, isLoading: checkingAvailability } = useQuery({
    queryKey: ['username-availability'],
    queryFn: async () => {
      const response = await userAPI.checkUsernameAvailability()
      return response.data
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (newUsername: string) => {
      const response = await fetch('/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ username: newUsername }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to update username')
      }

      return data
    },
    onSuccess: (data) => {
      updateUser(data.data)
      queryClient.invalidateQueries({ queryKey: ['username-availability'] })
      toast.success('Username updated successfully!')
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username)
    }
  }, [user?.username])

  const validateUsername = (value: string) => {
    if (value.length < 3) {
      return 'Username must be at least 3 characters'
    }
    if (value.length > 20) {
      return 'Username must be 20 characters or less'
    }
    if (!/^[a-z0-9_]+$/.test(value)) {
      return 'Only lowercase letters, numbers, and underscores'
    }
    if (value.startsWith('_') || value.endsWith('_')) {
      return 'Cannot start or end with underscore'
    }
    return null
  }

  // Check username availability when debounced value changes
  useEffect(() => {
    const checkAvailability = async () => {
      // Skip if empty or same as current username
      if (!debouncedUsername || debouncedUsername === user?.username) {
        setIsAvailable(null)
        setIsChecking(false)
        return
      }

      // Validate format first
      const validationError = validateUsername(debouncedUsername)
      if (validationError) {
        setIsAvailable(false)
        setIsChecking(false)
        return
      }

      // Check availability via API
      setIsChecking(true)
      try {
        const response = await userAPI.checkUsernameExists(debouncedUsername)
        setIsAvailable(response.data.available)
        
        if (!response.data.available) {
          if (response.data.isCurrentUsername) {
            setError('This is your current username')
          } else if (response.data.reason) {
            setError(response.data.reason)
          } else {
            setError('Username is already taken')
          }
        } else {
          setError(null)
        }
      } catch (error) {
        console.error('Failed to check username:', error)
        setIsAvailable(null)
      } finally {
        setIsChecking(false)
      }
    }

    checkAvailability()
  }, [debouncedUsername, user?.username])

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase()
    setUsername(cleaned)
    
    // Reset states while typing
    setIsAvailable(null)
    setIsChecking(true)
    
    // Validate format immediately
    const validationError = validateUsername(cleaned)
    setError(validationError)
  }

  const handleSave = () => {
    const validationError = validateUsername(username)
    if (validationError) {
      setError(validationError)
      return
    }

    if (username === user?.username) {
      toast.info('Username unchanged')
      return
    }

    updateProfileMutation.mutate(username)
  }

  const canChange = availability?.canChange ?? true
  const daysRemaining = availability?.daysRemaining ?? 0

  return (
    <View className="space-y-4 pb-4">
      {/* Current Username */}
      <View className="space-y-2">
        <Text className="text-white/70 text-sm font-bbh">Current Username</Text>
        <View className="bg-card-light rounded-xl p-4">
          <Text className="text-white text-lg font-bbh font-semibold">
            @{user?.username || 'Not set'}
          </Text>
        </View>
      </View>

      {/* Cooldown Warning */}
      {!canChange && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning-yellow/10 border border-warning-yellow/30 rounded-xl p-4"
        >
          <View className="flex-row items-start gap-3">
            <RiTimeLine size={20} className="text-warning-yellow mt-0.5" />
            <View className="flex-1">
              <Text className="text-warning-yellow text-sm font-bbh font-semibold mb-1">
                Username Change Cooldown
              </Text>
              <Text className="text-warning-yellow/80 text-xs font-bbh">
                You can change your username again in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}.
                This helps prevent abuse and maintains community trust.
              </Text>
            </View>
          </View>
        </motion.div>
      )}

      {/* New Username Input */}
      {canChange && (
        <View className="space-y-2">
          <Text className="text-white/70 text-sm font-bbh">New Username</Text>
          <input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="Enter new username"
            disabled={!canChange || updateProfileMutation.isPending}
            style={{ textTransform: 'lowercase' }}
            className={`w-full bg-card-light border rounded-xl px-4 py-3 text-white font-bbh text-base focus:outline-none focus:ring-2 transition-all lowercase ${
              error
                ? 'border-danger-500 focus:ring-danger-500/50'
                : 'border-white/10 focus:ring-primary-500/50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          />

          {/* Checking Indicator */}
          {isChecking && username && username !== user?.username && (
            <View className="flex-row items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RiLoader4Line size={16} className="text-primary-500" />
              </motion.div>
              <Text className="text-primary-500 text-xs font-bbh">
                Checking availability...
              </Text>
            </View>
          )}

          {/* Validation Error */}
          {error && !isChecking && (
            <View className="flex-row items-center gap-2">
              <RiCloseLine size={16} className="text-danger-500" />
              <Text className="text-danger-500 text-xs font-bbh">{error}</Text>
            </View>
          )}

          {/* Available Indicator */}
          {!error && !isChecking && isAvailable === true && username !== user?.username && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-row items-center gap-2"
            >
              <RiCheckLine size={16} className="text-success-green" />
              <Text className="text-success-green text-xs font-bbh font-semibold">
                @{username} is available!
              </Text>
            </motion.div>
          )}

          {/* Taken Indicator */}
          {!error && !isChecking && isAvailable === false && username !== user?.username && (
            <View className="flex-row items-center gap-2">
              <RiCloseLine size={16} className="text-danger-500" />
              <Text className="text-danger-500 text-xs font-bbh">
                @{username} is already taken
              </Text>
            </View>
          )}

          {/* Rules */}
          <View className="bg-card-light/40 rounded-xl p-3 space-y-1">
            <Text className="text-white/50 text-xs font-bbh mb-1">Username rules:</Text>
            <Text className="text-white/40 text-xs font-bbh">• 3-20 characters</Text>
            <Text className="text-white/40 text-xs font-bbh">• Lowercase letters, numbers, underscores only</Text>
            <Text className="text-white/40 text-xs font-bbh">• Cannot start/end with underscore</Text>
            <Text className="text-white/40 text-xs font-bbh">• Can change once every 7 days</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row gap-3 pt-2">
        <Button
          label="Cancel"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={updateProfileMutation.isPending}
        />
        <Button
          label={updateProfileMutation.isPending ? 'Saving...' : 'Save Username'}
          onClick={handleSave}
          className="flex-1"
          disabled={
            !canChange ||
            !username ||
            username === user?.username ||
            !!error ||
            isChecking ||
            isAvailable !== true ||
            updateProfileMutation.isPending
          }
        />
      </View>
    </View>
  )
}
