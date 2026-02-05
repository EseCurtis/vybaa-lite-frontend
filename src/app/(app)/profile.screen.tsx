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
import { RiArrowRightSLine, RiBarChartBoxLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export default function ProfileScreen() {
  const { user, logout, refreshSession } = useAuth()
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
      // Refresh session to get updated user data
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

    // Validation
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
      <TopNotchPadd/>

      <View className="flex-1 px-mg pb-[120px] pt-4 max-w-3xl mx-auto space-y-6">
        {/* Profile Header */}
        <View className="items-center space-y-3">
          {isEditing ? (
            <ImagePicker
              currentImageUrl={imagePreview || undefined}
              onImageSelect={handleImageSelect}
              size="lg"
              initials={initials}
            />
          ) : (
            <View className="rounded-full w-20 h-20 bg-card-light/40 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Text className="text-white text-2xl font-bbh font-bold">
                  {initials}
                </Text>
              )}
            </View>
          )}
          <View className="items-center space-y-1">
            <Text className="text-white text-xl font-bbh font-bold">
              {displayName}
            </Text>
            <Text className="text-white/60 text-sm font-bbh">
              {user?.email}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="space-y-2">
          <Pressable
            onPress={() => navigate({ to: '/app/sub-profile/insights' })}
            className="bg-card-light/40 rounded-2xl p-4 flex-row items-center justify-between"
          >
            <View className="flex-row  items-center gap-3">
              <View className="bg-card-light/60 rounded-xl p-2">
                <RiBarChartBoxLine size={20} className="text-white" />
              </View>
              <View className='text-left'>
                <Text className="text-white text-sm font-bbh font-semibold">
                  Insights
                </Text>
                <Text className="text-white/50 text-xs font-bbh">
                  View your progress stats
                </Text>
              </View>
            </View>
            <RiArrowRightSLine size={20} className="text-white/40" />
          </Pressable>
        </View>

        {/* Edit/Cancel Button */}
        <View className="flex flex-row gap-3">
          {!isEditing ? (
            <Button
              label="Edit Profile"
              variant="secondary"
              fullWidth
              onClick={() => setIsEditing(true)}
            />
          ) : (
            <View className="flex flex-row gap-3 w-full">
              <Button
                label="Cancel"
                variant="outline"
                fullWidth
                onClick={handleCancel}
                disabled={updateProfileMutation.isPending}
              />
              <Button
                label="Save Changes"
                variant="default"
                fullWidth
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                loading={updateProfileMutation.isPending}
              />
            </View>
          )}
        </View>

        {/* Profile Form */}
        <View className="space-y-3">
          <Text className="text-white/70 text-sm font-bbh font-semibold px-1">
            Profile Information
          </Text>

          <View className="bg-card-light/40 rounded-2xl p-5 space-y-4">
            {/* First Name */}
            <View>
              <Text className="text-white/70 text-sm font-bbh mb-2">
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
              <Text className="text-white/70 text-sm font-bbh mb-2">
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
              <Text className="text-white/70 text-sm font-bbh mb-2">
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
              <Text className="text-white/70 text-sm font-bbh mb-2">
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
              <Text className="text-white/70 text-sm font-bbh mb-2">
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
                  className="min-h-[100px] bg-card-light/40 border-white/10 text-white p-1"
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

        {/* Logout Button */}
        <Button
          label="Logout"
          onClick={logout}
          variant="outline"
          textClassName="text-sm"
        />
      </View>

      <BottomNotchPadd/>
      <BottomNotchPadd/>
    </View>
  )
}
