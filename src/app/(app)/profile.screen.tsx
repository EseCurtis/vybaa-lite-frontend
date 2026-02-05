import { ImagePicker } from '@/components/common/image-picker.component'
import { Input } from '@/components/common/input.component'
import { TopNotchPadd } from '@/components/common/notch.component'
import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useGoalOperations } from '@/hooks/use-goals.hook'
import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { authAPI } from '@/shared/api/auth.api'
import { uploadAPI } from '@/shared/api/upload.api'
import {
  RiArrowRightSLine, RiBarChartBoxLine,
  RiEmotionLine,
  RiSettings3Line,
  RiTargetLine
} from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

export default function ProfileScreen() {
  const { user, refreshSession } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const { goals } = useGoalOperations(1, 100)
  const [updatedProfileImage, setUpdatedProfileImage] = useState(false)
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

  const handleImageSelect = (imageDataUrl: string) => {
    setImagePreview(imageDataUrl)
    setFormData({ ...formData, profileImageId: imageDataUrl })
    setUpdatedProfileImage(true)
  }

  const handleSave = async () => {
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

    try {
      let cloudinaryUrl = formData.profileImageId

      // If image is base64 (new upload), upload to Cloudinary first
      if (formData.profileImageId && formData.profileImageId.startsWith('data:image/') && updatedProfileImage) {
        const loadingToast = toast.loading('Uploading image...')
        const uploadResponse = await uploadAPI.uploadImage({
          image: formData.profileImageId,
          folder: 'profile-images',
        })
        cloudinaryUrl = uploadResponse.data.url
         //@ts-ignore
        toast.dismiss(loadingToast)
      }

      // Update profile with Cloudinary URL
      updateProfileMutation.mutate({
        ...formData,
        profileImageId: cloudinaryUrl,
      })
    } catch (error: any) {
      //@ts-ignore
      toast.dismiss()
      const errorMsg = error.message || 'Failed to upload image'
      setFormError(errorMsg)
      toast.error(errorMsg)
    }
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
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || user.email
    : 'User'

  const initials = user
    ? [user.firstName?.[0], user.lastName?.[0]]
        .filter(Boolean)
        .join('')
        .toUpperCase() ||
      user.username?.[0]?.toUpperCase() ||
      user.email[0].toUpperCase()
    : 'U'

  // Calculate overall progress for ring
  const overallProgress = useMemo(() => {
    if (!goals.length) return 0
    const totalProgress = goals.reduce((sum, goal) => {
      return sum + (goal.currentDay / goal.targetDays) * 100
    }, 0)
    return Math.round(totalProgress / goals.length)
  }, [goals])

  const hasProgress = goals.length > 0
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - overallProgress / 100)

  return (
    <View className="flex-1 bg-cardd overflow-y-auto no-scrollbar">
      {/* Header */}
      <TopNotchPadd />

      <View className="flex-1 px-mg pb-[170px] pt-4 space-y-8">
        {/* Profile Header with Progress Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <View className="items-center space-y-4">
            {/* Avatar with Progress Ring */}
            <View className="relative">
              {hasProgress && !isEditing && (
                <svg className="absolute -inset-2 w-36 h-36">
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-white/10"
                  />
                  <motion.circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    stroke="#FFD60A"
                    strokeWidth="5"
                    strokeLinecap="round"
                    className="transform -rotate-90 origin-center"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '72px 72px' }}
                  />
                </svg>
              )}
              
          {isEditing ? (
            <ImagePicker
              currentImageUrl={imagePreview || undefined}
              onImageSelect={handleImageSelect}
              size="lg"
              initials={initials}
            />
          ) : (
                <View className="rounded-full w-32 h-32 bg-card-light/60 flex items-center justify-center overflow-hidden relative z-10">
                  {(imagePreview || user?.avatarUrl) ? (
                <img
                      src={imagePreview || user?.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                    <Text className="text-white text-4xl font-bbh font-bold">{initials}</Text>
                  )}
                </View>
              )}
              
              {hasProgress && !isEditing && (
                <View className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-400 rounded-full px-3 py-1.5 shadow-lg">
                  <Text className="text-black text-sm font-bbh font-bold">
                    {overallProgress}%
                  </Text>
                </View>
              )}
            </View>

            {/* Name and Email */}
          <View className="items-center space-y-1">
            <Text className="text-white text-2xl font-bbh font-bold">{displayName}</Text>
              <Text className="text-white/50 text-sm font-bbh">@{user?.username}</Text>
            </View>
          </View>
        </motion.div>

        {/* Edit/Save Buttons */}
        <View className="flex flex-row gap-3">
          {!isEditing ? (
            <Button
              label="Edit Profile"
              variant="default"
              fullWidth
              onClick={() => setIsEditing(true)}
              textClassName="text-sm"
              style={{
                width: '100%'
              }}
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
                style={{
                width: '100%'
              }}
              />
              <Button
                label="Save"
                variant="default"
                fullWidth
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                loading={updateProfileMutation.isPending}
                textClassName="text-sm"
                style={{
                width: '100%'
              }}
              />
            </>
          )}
        </View>

        {/* Personal Information Cards */}
        <View className="space-y-3">

          {!isEditing ? (
            // Display Mode - Grid Cards with Icons
            <View className="space-y-3">
              <View className="grid grid-cols-2 gap-3">
                {/* Current Mood */}
                <View
                  
                  className="col-span-2"
                >
                  <View className="bg-card-light/40 rounded-2xl p-4 flex-row items-start gap-4">
                    <View className="w-10 h-10 rounded-xl bg-card-light/60 flex items-center justify-center shrink-0">
                      <RiEmotionLine size={20} className="text-white" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-white/50 text-xs font-bbh uppercase tracking-wide mb-1">
                        Current Mood
                      </Text>
                      <Text className={user?.currentMood ? 'text-white text-base font-bbh font-semibold' : 'text-white/40 text-base font-bbh'}>
                        {user?.currentMood || 'Not set'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Life Goal - Full Width */}
              <View
              className="col-span-2"
              >
                <View className="bg-card-light/40 gap-4 flex flex-col items-start rounded-2xl p-4 space-y-2">
                  <View className="w-10 h-10 rounded-xl bg-card-light/60 flex items-center justify-center">
                    <RiTargetLine size={20} className="text-white" />
                  </View>
                  <View className="flex-1 min-w-0 ">
                    <Text className="text-white/50 text-xs font-bbh uppercase tracking-wide mb-1">
                      Life Goal
                    </Text>
                    <Text className={user?.lifeGoal ? 'text-white text-base font-bbh font-semibold leading-relaxed' : 'text-white/40 text-base font-bbh'}>
                      {user?.lifeGoal || 'Not set'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            // Edit Mode - Form Fields
            <View className="space-y-3">
              {/* First Name */}
              <View className="bg-card-light/40 rounded-2xl p-4">
                <Text className="text-white/60 text-xs font-bbh mb-2 uppercase tracking-wide">
                  First Name
                </Text>
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
              </View>

              {/* Last Name */}
              <View className="bg-card-light/40 rounded-2xl p-4">
                <Text className="text-white/60 text-xs font-bbh mb-2 uppercase tracking-wide">
                  Last Name
                </Text>
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
              </View>

              {/* Username */}
              <View className="bg-card-light/40 rounded-2xl p-4">
                <Text className="text-white/60 text-xs font-bbh mb-2 uppercase tracking-wide">
                  Username
                </Text>
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
              </View>

              {/* Current Mood */}
              <View className="bg-card-light/40 rounded-2xl p-4">
                <Text className="text-white/60 text-xs font-bbh mb-2 uppercase tracking-wide">
                  Current Mood
                </Text>
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
              </View>

              {/* Life Goal */}
              <View className="bg-card-light/40 rounded-2xl p-4">
                <Text className="text-white/60 text-xs font-bbh mb-2 uppercase tracking-wide">
                  Life Goal
                </Text>
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
          )}
        </View>

        {/* Quick Access Actions */}
        <View className="space-y-3 pb-[200px]">
          <Text className="text-white/70 text-sm font-bbh font-semibold px-1">
            Quick Access
          </Text>
          
          <View className="grid grid-cols-2 gap-3">
            {/* Insights */}
            <Pressable
              onPress={() => navigate({ to: '/app/sub-profile/insights' })}
              className="bg-card-light/40 col-span-2 rounded-2xl px-5 py-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center text-left gap-4">
                <View className="w-10 h-10 rounded-xl bg-card-light/60 flex items-center justify-center">
                  <RiBarChartBoxLine size={20} className="text-white" />
                </View>
                <View>
                  <Text className="text-white text-sm font-bbh font-semibold">
                    Insights
                  </Text>
                  <Text className="text-white/50 text-xs font-bbh">
                    View progress stats
                  </Text>
                </View>
              </View>
              <RiArrowRightSLine size={20} className="text-white/40" />
            </Pressable>

            {/* Settings */}
            <Pressable
              onPress={() => navigate({ to: '/app/sub-profile/settings' })}
              className="bg-card-light/40 col-span-2 rounded-2xl px-5 py-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center text-left gap-4">
                <View className="w-10 h-10 rounded-xl bg-card-light/60 flex items-center justify-center">
                  <RiSettings3Line size={20} className="text-white" />
                </View>
                <View>
                  <Text className="text-white text-sm font-bbh font-semibold">
                    Settings
                  </Text>
                  <Text className="text-white/50 text-xs font-bbh">
                    App preferences
                  </Text>
                </View>
              </View>
              <RiArrowRightSLine size={20} className="text-white/40" />
            </Pressable>
          </View>

          
        </View>
      </View>

     
    </View>
  )
}
