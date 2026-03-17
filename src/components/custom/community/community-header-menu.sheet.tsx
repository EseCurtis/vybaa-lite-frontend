import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { cn } from '@/shared/utils/helpers.util'
import {
  RiAddLine,
  RiLogoutBoxLine,
  RiRefreshLine,
  RiSettings3Line,
  RiUserAddLine,
} from '@remixicon/react'

type Role = 'OWNER' | 'MOD' | 'MEMBER' | null | undefined

export function CommunityHeaderMenuSheet({
  isMember,
  userRole,
  onJoin,
  onLeave,
  onCreateTemplate,
  onOpenSettings,
  onRefresh,
  onInvite,
  onClose,
}: {
  isMember: boolean
  userRole?: Role
  onJoin: () => void
  onLeave: () => void
  onCreateTemplate: () => void
  onOpenSettings: () => void
  onRefresh?: () => void
  onInvite?: () => void
  onClose: () => void
}) {
  const Item = ({
    icon,
    label,
    onPress,
    destructive,
  }: {
    icon: React.ReactNode
    label: string
    onPress: () => void
    destructive?: boolean
  }) => (
    <Pressable
      onPress={() => {
        onPress()
        onClose()
      }}
      className={cn(
        'flex-row items-center gap-3 px-4 py-3 rounded-2xl bg-card-light/10',
        destructive && 'bg-danger-500/10',
      )}
    >
      <View
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          destructive ? 'bg-danger-500/20' : 'bg-card-light/20',
        )}
      >
        {icon}
      </View>
      <Text
        className={cn(
          'text-white text-sm font-bbh font-semibold',
          destructive && 'text-danger-500',
        )}
      >
        {label}
      </Text>
    </Pressable>
  )

  const canCreateTemplate = isMember && (userRole === 'OWNER' || userRole === 'MOD')
  const canLeave = isMember && userRole !== 'OWNER'

  return (
    <View className="flex flex-col gap-3">
      {!isMember ? (
        <Item
          icon={<RiUserAddLine size={18} className="text-white" />}
          label="Join community"
          onPress={onJoin}
        />
      ) : (
        <>
          {onRefresh && (
            <Item
              icon={<RiRefreshLine size={18} className="text-white" />}
              label="Refresh Community"
              onPress={onRefresh}
            />
          )}
          {onInvite && (
            <Item
              icon={<RiUserAddLine size={18} className="text-white" />}
              label="Invite Participants"
              onPress={onInvite}
            />
          )}
          <Item
            icon={<RiSettings3Line size={18} className="text-white" />}
            label="Settings"
            onPress={onOpenSettings}
          />
          {canCreateTemplate && (
            <Item
              icon={<RiAddLine size={18} className="text-white" />}
              label="New Template"
              onPress={onCreateTemplate}
            />
          )}
          {canLeave && (
            <Item
              icon={<RiLogoutBoxLine size={18} className="text-danger-500" />}
              label="Leave community"
              onPress={onLeave}
              destructive
            />
          )}
        </>
      )}
    </View>
  )
}

