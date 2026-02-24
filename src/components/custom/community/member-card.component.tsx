import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { CommunityMember } from '@/shared/api/community.api'
import { RiShieldStarLine, RiShieldLine, RiUserLine } from '@remixicon/react'
import moment from 'moment'

interface MemberCardProps {
  member: CommunityMember
  currentUserRole?: 'OWNER' | 'MOD' | 'MEMBER' | null
  onPress?: (member: CommunityMember) => void
  onRoleChange?: (member: CommunityMember, newRole: 'OWNER' | 'MOD' | 'MEMBER') => void
}

const roleIcons = {
  OWNER: RiShieldStarLine,
  MOD: RiShieldLine,
  MEMBER: RiUserLine,
}

const roleLabels = {
  OWNER: 'Owner',
  MOD: 'Moderator',
  MEMBER: 'Member',
}

export function MemberCard({ member, currentUserRole, onPress, onRoleChange }: MemberCardProps) {
  const RoleIcon = roleIcons[member.role] || RiUserLine
  const roleLabel = roleLabels[member.role] || 'Member'
  const canManageRoles = currentUserRole === 'OWNER' || (currentUserRole === 'MOD' && member.role === 'MEMBER')
  const displayName = member.user.username || 
    [member.user.firstName, member.user.lastName].filter(Boolean).join(' ') || 
    'User'

  const handlePress = () => {
    onPress?.(member)
  }

  return (
    <Pressable
      onPress={handlePress}
      className="p-4 rounded-2xl bg-card-light/40 border border-card-lighter/20 mb-3"
    >
      <View className="flex-row items-center gap-3">
        {/* Avatar */}
        <View className="w-12 h-12 rounded-full bg-card-lighter/20 flex items-center justify-center shrink-0">
          {member.user.avatarUrl ? (
            <img
              src={member.user.avatarUrl}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <Text className="text-white/60 text-base font-bold font-bbh">
              {displayName[0].toUpperCase()}
            </Text>
          )}
        </View>

        {/* Member Info */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-white text-base font-bold font-bbh">
              {displayName}
            </Text>
            <View className="flex-row items-center gap-1">
              <RoleIcon size={14} className="text-white/40" />
              <Text className="text-white/40 text-xs font-bbh">
                {roleLabel}
              </Text>
            </View>
          </View>
          <Text className="text-white/40 text-xs font-bbh">
            Joined {moment(member.joinedAt).fromNow()}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}
