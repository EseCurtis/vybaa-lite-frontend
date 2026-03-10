import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { View } from '@/components/layout/view.component'
import { RiAddLine, RiLogoutBoxLine, RiRefreshLine, RiSettings3Line, RiUserAddLine } from '@remixicon/react'

interface CommunityHeaderActionsProps {
  isMember: boolean
  userRole?: 'OWNER' | 'MOD' | 'MEMBER' | null
  onJoin: () => void
  onLeave: () => void
  onCreateTemplate: () => void
  onOpenSettings: () => void
  onRefresh?: () => void
  onInvite?: () => void
}

export function CommunityHeaderActions({
  isMember,
  userRole,
  onJoin,
  onLeave,
  onCreateTemplate,
  onOpenSettings,
  onRefresh,
  onInvite,
}: CommunityHeaderActionsProps) {
  return (
    <View className="flex-row gap-2 items-center">
      {isMember && onRefresh && (
        <Pressable
          onPress={onRefresh}
          className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <RiRefreshLine size={20} />
        </Pressable>
      )}
      {isMember && onInvite && (
        <Pressable
          onPress={onInvite}
          className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <RiUserAddLine size={20} />
        </Pressable>
      )}
      {isMember && (
        <Pressable
          onPress={onOpenSettings}
          className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <RiSettings3Line size={20} />
        </Pressable>
      )}
      {!isMember ? (
        <Button
          label="Join"
          variant="default"
          onClick={onJoin}
          className="px-4 py-2"
          textClassName="text-sm"
        />
      ) : userRole === 'OWNER' || userRole === 'MOD' ? (
        <Pressable
          onPress={onCreateTemplate}
          className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <RiAddLine size={20} />
        </Pressable>
      ) : null}
      {isMember && userRole !== 'OWNER' && (
        <Pressable
          onPress={onLeave}
          className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <RiLogoutBoxLine size={20} />
        </Pressable>
      )}
    </View>
  )
}
