import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { cn } from '@/shared/utils/helpers.util'
import { RiAddLine, RiKeyLine, RiRefreshLine } from '@remixicon/react'

export function CommunitiesHeaderMenuSheet({
  onRefresh,
  onJoinByCode,
  onCreateCommunity,
  onClose,
}: {
  onRefresh: () => void
  onJoinByCode: () => void
  onCreateCommunity: () => void
  onClose: () => void
}) {
  const Item = ({
    icon,
    label,
    onPress,
  }: {
    icon: React.ReactNode
    label: string
    onPress: () => void
  }) => (
    <Pressable
      onPress={() => {
        onPress()
        onClose()
      }}
      className={cn('flex-row items-center gap-3 px-4 py-3 rounded-2xl bg-card-light/10')}
    >
      <View className="w-10 h-10 rounded-full flex items-center justify-center bg-card-light/20">
        {icon}
      </View>
      <Text className="text-white text-sm font-bbh font-semibold">{label}</Text>
    </Pressable>
  )

  return (
    <View className="flex flex-col gap-3">
      <Item
        icon={<RiRefreshLine size={18} className="text-white" />}
        label="Refresh"
        onPress={onRefresh}
      />
      <Item
        icon={<RiKeyLine size={18} className="text-white" />}
        label="Join by Code"
        onPress={onJoinByCode}
      />
      <Item
        icon={<RiAddLine size={18} className="text-white" />}
        label="Create Community"
        onPress={onCreateCommunity}
      />
    </View>
  )
}

