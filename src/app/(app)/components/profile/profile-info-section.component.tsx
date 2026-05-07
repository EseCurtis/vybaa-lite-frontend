import { Input } from '@/components/common/input.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { RiEmotionLine } from '@remixicon/react'
import type { ChangeEvent } from 'react'
import type { ProfileFormData, ProfileUser } from './profile.types'

interface ProfileInfoSectionProps {
  formData: ProfileFormData
  formError: string | null
  isEditing: boolean
  onFieldChange: (
    field: keyof Pick<ProfileFormData, 'firstName' | 'lastName' | 'username'>,
    value: string,
  ) => void
  user: ProfileUser
}

interface ProfileFieldCardProps {
  label: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  value: string
}

export function ProfileInfoSection({
  formData,
  formError,
  isEditing,
  onFieldChange,
  user,
}: ProfileInfoSectionProps) {
  return (
    <View className="space-y-3">
      {!isEditing ? (
        <View className="space-y-3">
          <View className="grid grid-cols-2 gap-3">
            <View className="col-span-2">
              <View className="bg-card-light/40 rounded-[50px]  p-4 flex-row items-start gap-4">
                <View className="w-10 h-10 rounded-xl bg-card-light/60 flex items-center justify-center shrink-0">
                  <RiEmotionLine size={20} className="text-white" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-white/50 text-xs font-bbh uppercase tracking-wide mb-1">
                    Current Mood
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
        <View className="space-y-3">
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
          <ProfileFieldCard
            label="Username"
            placeholder="Username"
            value={formData.username}
            onChange={(event) => {
              onFieldChange('username', event.target.value)
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
    <View className="bg-card-light/40 rounded-2xl p-4">
      <Text className="text-white/60 text-xs font-bbh mb-2 uppercase tracking-wide">
        {label}
      </Text>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="bg-card-light/40 border-white/10 text-white"
      />
    </View>
  )
}
