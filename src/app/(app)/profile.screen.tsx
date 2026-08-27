import { ProfileActionButtons } from '@/app/(app)/components/profile/profile-action-buttons.component'
import { ProfileHeader } from '@/app/(app)/components/profile/profile-header.component'
import { ProfileInfoSection } from '@/app/(app)/components/profile/profile-info-section.component'
import { ProfileQuickActions } from '@/app/(app)/components/profile/profile-quick-actions.component'
import type {
  ProfileFormData,
  ProfileQuickAction,
} from '@/app/(app)/components/profile/profile.types'
import { NoiseComponent } from '@/components/common/noise.component'
import { TopNotchPadd } from '@/components/common/notch.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { View } from '@/components/layout/view.component'
import { useGoalOperations } from '@/hooks/use-goals.hook'
import { useTabBar } from '@/hooks/use-tab-bar.hook'
import { useAuth } from '@/providers/auth.provider'
import { useSubscription } from '@/providers/subscription.provider'
import { useToast } from '@/providers/toast.provider'
import { authAPI } from '@/shared/api/auth.api'
import { uploadAPI } from '@/shared/api/upload.api'
import { RiHeart3Fill, RiSettings3Fill, RiTrophyFill } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

function createProfileFormData(
  user: ReturnType<typeof useAuth>['user'],
): ProfileFormData {
  return {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    username: user?.username ?? '',
    profileImageId: user?.avatarUrl ?? '',
  }
}

function getProfileDisplayName(
  user: ReturnType<typeof useAuth>['user'],
): string {
  if (!user) {
    return 'User'
  }

  return (
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    user.email
  )
}

function getProfileInitials(user: ReturnType<typeof useAuth>['user']): string {
  if (!user) {
    return 'U'
  }

  return (
    [user.firstName?.[0], user.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase() ||
    user.username?.[0]?.toUpperCase() ||
    user.email[0].toUpperCase()
  )
}

function validateProfileFormData(formData: ProfileFormData): string | null {
  if (formData.username && formData.username.length < 3) {
    return 'Username must be at least 3 characters'
  }

  if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
    return 'Username can only contain letters, numbers, and underscores'
  }

  return null
}

const profileQuickActions: ProfileQuickAction[] = [
  {
    title: 'Achievements',
    description: 'View your earned badges',
    to: '/achievements',
    icon: <RiTrophyFill size={20} className="text-white" />,
    colorScheme: {
      bg1: 'bg-[#cc5e0c]',
      bg2: 'bg-rose-900/40',
    },
  },
  {
    title: 'Wellbeing',
    description: 'View progress stats',
    to: '/app/sub-profile/insights',
    icon: <RiHeart3Fill size={20} className="text-white" />,
    colorScheme: {
      bg1: 'bg-[#da2068]',
      bg2: 'bg-rose-900/40',
    },
  },
  {
    title: 'Settings',
    description: 'App preferences',
    to: '/app/sub-profile/settings',
    icon: <RiSettings3Fill size={20} className="text-white" />,
  },
]

export default function ProfileScreen() {
  const { user, refreshSession } = useAuth()
  const toast = useToast()
  useGoalOperations(1, 100)
  const [updatedProfileImage, setUpdatedProfileImage] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>(
    createProfileFormData(user),
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { hide, show } = useTabBar()

  const { isPro } = useSubscription()

  useEffect(() => {
    if (user) {
      setFormData(createProfileFormData(user))
      setImagePreview(user.avatarUrl ?? null)
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
    onError: (error: unknown) => {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to update profile'
      toast.error(errorMsg)
      setFormError(errorMsg)
    },
  })

  function handleImageSelect(imageDataUrl: string): void {
    setImagePreview(imageDataUrl)
    setFormData({ ...formData, profileImageId: imageDataUrl })
    setUpdatedProfileImage(true)
  }

  async function handleSave(): Promise<void> {
    setFormError(null)

    const validationError = validateProfileFormData(formData)
    if (validationError) {
      setFormError(validationError)
      toast.warning(validationError)
      return
    }

    try {
      let cloudinaryUrl = formData.profileImageId

      if (
        formData.profileImageId &&
        formData.profileImageId.startsWith('data:image/') &&
        updatedProfileImage
      ) {
        const loadingToast = toast.loading('Uploading image...')
        const uploadResponse = await uploadAPI.uploadImage({
          image: formData.profileImageId,
          folder: 'profile-images',
        })
        cloudinaryUrl = uploadResponse.data.url
        // @ts-ignore
        toast.dismiss(loadingToast)
      }

      updateProfileMutation.mutate({
        ...formData,
        profileImageId: cloudinaryUrl,
      })
    } catch (error: unknown) {
      // @ts-ignore
      toast.dismiss()
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to upload image'
      setFormError(errorMsg)
      toast.warning(errorMsg)
      toast.error(errorMsg)
    }
  }

  function handleCancel(): void {
    if (user) {
      setFormData(createProfileFormData(user))
      setImagePreview(user.avatarUrl ?? null)
    }
    setIsEditing(false)
    setFormError(null)
  }

  function handleFieldChange(
    field: keyof Pick<ProfileFormData, 'firstName' | 'lastName' | 'username'>,
    value: string,
  ): void {
    setFormData({
      ...formData,
      [field]: value,
    })
    setFormError(null)
  }

  const displayName = getProfileDisplayName(user)
  const initials = getProfileInitials(user)

  useEffect(() => {
    if (isEditing) {
      hide()
    } else {
      show()
    }
  }, [hide, isEditing, show])

  return (
    <View className="flex-1 bg-cardd overflow-y-auto no-scrollbar">
      <NoiseComponent>
        {isEditing ? (
          <TabHeader
            onBack={() => {
              setIsEditing(false)
            }}
            title="Edit Profile"
          />
        ) : (
          <TopNotchPadd />
        )}

        <View className="flex-1 px-mg pb-[170px] pt-4 space-y-3">
          <ProfileHeader
            displayName={displayName}
            imagePreview={imagePreview}
            initials={initials}
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onImageSelect={handleImageSelect}
            user={user}
          />

          <ProfileInfoSection
            formData={formData}
            formError={formError}
            isEditing={isEditing}
            onFieldChange={handleFieldChange}
            user={user}
          />

          <ProfileActionButtons
            isEditing={isEditing}
            isSaving={updateProfileMutation.isPending}
            onCancel={handleCancel}
            onEdit={() => setIsEditing(true)}
            onSave={handleSave}
          />

          {!isEditing && <ProfileQuickActions actions={profileQuickActions} />}
        </View>
      </NoiseComponent>
    </View>
  )
}
