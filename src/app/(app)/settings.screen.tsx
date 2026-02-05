import { ImagePicker } from '@/components/common/image-picker.component'
import { Input } from '@/components/common/input.component'
import { BottomNotchPadd, TopNotchPadd } from '@/components/common/notch.component'
import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { authAPI } from '@/shared/api/auth.api'
import { RiArrowLeftSLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function SettingsScreen() {
  const { user, refreshSession } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    currentMood: '',
    lifeGoal: '',
    profileImageId: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        currentMood: user.currentMood || '',
        lifeGoal: user.lifeGoal || '',
        profileImageId: user.avatarUrl || '',
      })
      setImagePreview(user.avatarUrl || null)
    }
  }, [user])

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const { profileImageId, ...rest } = data
      return authAPI.updateProfile({
        ...rest,
        profileImageId: profileImageId || undefined,
      })
    },
    onSuccess: async () => {
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      setFormError(null)
      await refreshSession()
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.msg || error.message || 'Failed to update profile'
      toast.error(errorMsg)
      setFormError(errorMsg)
    },
  })

  const handleImageSelect = (imageUrl: string) => {
    setImagePreview(imageUrl)
    setFormData({ ...formData, profileImageId: imageUrl })
  }

  const handleSave = () => {
    setFormError(null)

    if (formData.username && formData.username.length < 3) {
      const errorMsg = 'Username must be at least 3 characters'
      setFormError(errorMsg)
      toast.warning(errorMsg)
      return
    }

    if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      const errorMsg =
        'Username can only contain letters, numbers, and underscores'
      setFormError(errorMsg)
      toast.warning(errorMsg)
      return
    }

    updateProfileMutation.mutate(formData)
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        currentMood: user.currentMood || '',
        lifeGoal: user.lifeGoal || '',
        profileImageId: user.avatarUrl || '',
      })
      setImagePreview(user.avatarUrl || null)
    }
    setIsEditing(false)
    setFormError(null)
  }

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.username ||
      user.email
    : 'User'

  const initials = user
    ? [user.firstName?.[0], user.lastName?.[0]]
        .filter(Boolean)
        .join('')
        .toUpperCase() ||
      user.username?.[0]?.toUpperCase() ||
      user.email[0].toUpperCase()
    : 'U'

  return (
    <View className="flex-1 bg-cardd overflow-y-auto no-scrollbar">
      {/* Header */}
      <TopNotchPadd />
      <View className="flex-row items-center justify-between px-mg py-4">
        <Pressable
          onPress={() => navigate({ to: '/app/profile' })}
          className="w-12 h-12 rounded-full bg-card-light/40 flex items-center justify-center"
        >
          <RiArrowLeftSLine size={24} className="text-white" />
        </Pressable>
        <Text className="text-white text-xl font-bbh font-bold">Settings</Text>
        <View className="w-12" />
      </View>

      <View className="flex-1 px-mg pb-[120px] pt-4 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <View className="bg-card-light/40 rounded-2xl p-5 flex-row items-center gap-4">
            {isEditing ? (
              <ImagePicker
                currentImageUrl={imagePreview || undefined}
                onImageSelect={handleImageSelect}
                size="md"
                initials={initials}
              />
            ) : (
              <View className="rounded-full w-16 h-16 bg-card-light/60 flex items-center justify-center overflow-hidden shrink-0">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Text className="text-white text-xl font-bbh font-bold">
                    {initials}
                  </Text>
                )}
              </View>
            )}
            <View className="flex-1 min-w-0">
              <Text className="text-white text-lg font-bbh font-bold">
                {displayName}
              </Text>
              <Text className="text-white/50 text-sm font-bbh truncate">
                {user?.email}
              </Text>
              {user?.username && (
                <Text className="text-white/50 text-xs font-bbh mt-1">
                  @{user.username}
                </Text>
              )}
            </View>
          </View>
        </motion.div>

        {/* Edit/Cancel Buttons */}
        <View className="flex flex-row gap-3">
          {!isEditing ? (
            <Button
              label="Edit Profile"
              variant="default"
              fullWidth
              onClick={() => setIsEditing(true)}
              textClassName="text-sm"
            />
          ) : (
            <>
              <Button
                label="Cancel"
                variant="outline"
                fullWidth
                onClick={handleCancel}
                disabled={updateProfileMutation.isPending}
                textClassName="text-sm"
              />
              <Button
                label="Save"
                variant="default"
                fullWidth
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                loading={updateProfileMutation.isPending}
                textClassName="text-sm"
              />
            </>
          )}
        </View>

        {/* Profile Form */}
        <View className="space-y-3">
          <Text className="text-white/70 text-sm font-bbh font-semibold px-1">
            Personal Information
          </Text>

          <View className="bg-card-light/40 rounded-2xl p-5 space-y-5">
            {/* First Name */}
            <View>
              <Text className="text-white/60 text-xs font-bbh mb-2 uppercase tracking-wide">
                First Name
              </Text>
              {isEditing ? (
                <Input
                  type="text"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value })
                    setFormError(null)
                  }}
                  className="bg-card-light/40 border-white/10 text-white"
                />
              ) : (
                <Text
                  className={
                    user?.firstName
                      ? 'text-white font-bbh'
                      : 'text-white/40 font-bbh'
                  }
                >
                  {user?.firstName || 'Not set'}
                </Text>
              )}
            </View>

            {/* Last Name */}
            <View>
              <Text className="text-white/60 text-xs font-bbh mb-2 uppercase tracking-wide">
                Last Name
              </Text>
              {isEditing ? (
                <Input
                  type="text"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value })
                    setFormError(null)
                  }}
                  className="bg-card-light/40 border-white/10 text-white"
                />
              ) : (
                <Text
                  className={
                    user?.lastName
                      ? 'text-white font-bbh'
                      : 'text-white/40 font-bbh'
                  }
                >
                  {user?.lastName || 'Not set'}
                </Text>
              )}
            </View>

            {/* Username */}
            <View>
              <Text className="text-white/60 text-xs font-bbh mb-2 uppercase tracking-wide">
                Username
              </Text>
              {isEditing ? (
                <Input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value })
                    setFormError(null)
                  }}
                  className="bg-card-light/40 border-white/10 text-white"
                />
              ) : (
                <Text
                  className={
                    user?.username
                      ? 'text-white font-bbh'
                      : 'text-white/40 font-bbh'
                  }
                >
                  {user?.username || 'Not set'}
                </Text>
              )}
            </View>

            {/* Current Mood */}
            <View>
              <Text className="text-white/60 text-xs font-bbh mb-2 uppercase tracking-wide">
                Current Mood
              </Text>
              {isEditing ? (
                <Input
                  type="text"
                  placeholder="How are you feeling?"
                  value={formData.currentMood}
                  onChange={(e) => {
                    setFormData({ ...formData, currentMood: e.target.value })
                    setFormError(null)
                  }}
                  className="bg-card-light/40 border-white/10 text-white"
                  maxLength={200}
                />
              ) : (
                <Text
                  className={
                    user?.currentMood
                      ? 'text-white font-bbh'
                      : 'text-white/40 font-bbh'
                  }
                >
                  {user?.currentMood || 'Not set'}
                </Text>
              )}
            </View>

            {/* Life Goal */}
            <View>
              <Text className="text-white/60 text-xs font-bbh mb-2 uppercase tracking-wide">
                Life Goal
              </Text>
              {isEditing ? (
                <TextArea
                  placeholder="What is your life goal?"
                  value={formData.lifeGoal}
                  onChange={(e) => {
                    setFormData({ ...formData, lifeGoal: e.target.value })
                    setFormError(null)
                  }}
                  className="min-h-[100px] bg-card-light/40 border-white/10 text-white p-3"
                  maxLength={500}
                />
              ) : (
                <Text
                  className={
                    user?.lifeGoal
                      ? 'text-white font-bbh leading-relaxed'
                      : 'text-white/40 font-bbh leading-relaxed'
                  }
                >
                  {user?.lifeGoal || 'Not set'}
                </Text>
              )}
            </View>

            {/* Error Display */}
            {formError && (
              <View className="bg-danger-500/20 rounded-xl p-4">
                <Text className="text-danger-500 text-sm font-bbh">
                  {formError}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <BottomNotchPadd/>
      <BottomNotchPadd/>
      <BottomNotchPadd/>
    </View>
  )
}
