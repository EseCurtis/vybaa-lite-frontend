import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { CommunityMember } from '@/shared/api/community.api'
import { RiCoinsLine, RiShieldLine, RiShieldStarLine, RiUserLine } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
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

export function MemberCard({ member, onPress }: MemberCardProps) {
  const navigate = useNavigate()
  const RoleIcon = roleIcons[member.role] || RiUserLine
  const roleLabel = roleLabels[member.role] || 'Member'
  const displayName = member.user.username || 
    [member.user.firstName, member.user.lastName].filter(Boolean).join(' ') || 
    'User'

  const handlePress = () => {
    if (onPress) {
      onPress(member)
      return
    }

    if (member.user.username) {
      navigate({ to: '/app/u/$username', params: { username: member.user.username } })
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      className="p-4 w-full rounded-2xl bg-cardx mb-1 min-h-[88px]"
    >
      <View className="flex-row items-center gap-3 w-full">
        {/* Avatar */}
        <View className="w-12 h-12 rounded-full bg-card-lighter flex items-center justify-center shrink-0">
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
        <View className="flex-1 min-w-0">
          <View className="flex-row items-start justify-between  gap-2 w-full mb-1 min-w-0">
            <Text className="text-white  mr-auto  text-left text-base font-bold font-bbh flex-1 min-w-0 leading-tight break-words">
              {displayName}
            </Text>
            <View className="flex-row items-center ml-auto gap-1 rounded-full bg-card-light/20 px-2 py-1 shrink-0">
              <RoleIcon size={14} className="text-white/40" />
              <Text className="text-white/50 text-[11px] font-bbh whitespace-nowrap">
                {roleLabel}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-x-3 gap-y-1 flex-wrap min-w-0">
            <Text className="text-card-lighter-3/40 text-xs font-bbh leading-snug">
              Joined {moment(member.joinedAt).fromNow()}
            </Text>
            {typeof member.totalRewards === 'number' && (
              <View className="flex-row items-center ml-auto gap-1 min-w-0">
                <RiCoinsLine size={12} className="text-accent-400" />
                <Text className="text-accent-400 text-xs font-bbh leading-snug break-words">
                  {member.totalRewards.toLocaleString()}ppts
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  )
}
