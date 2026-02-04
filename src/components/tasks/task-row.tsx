import { Icons } from '@/components/layout/icon.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { smartTruncate } from '@/shared/utils/helpers.util'
import memo from '@iconify-icons/twemoji/memo'
import { Icon } from '@iconify/react'

export default function TaskRow({
  item,
  onPress,
}: {
  item: any
  onPress?: (item: any) => void
}) {
  const status = (item.status || 'ACTIVE') as 'ACTIVE' | 'COMPLETED' | 'SKIPPED'
  const isCompleted = status === 'COMPLETED'
  const isSkipped = status === 'SKIPPED'
  const badgeColor = isCompleted
    ? 'bg-green-500'
    : isSkipped
      ? 'bg-[#555]'
      : 'bg-yellow-500'

  return (
    <TouchableOpacity
      onPress={() => onPress?.(item)}
      className="flex-row text-left flex w-full items-center justify-between bg-card-700  rounded-2xl px-4 py-3"
    >
      <View className="flex-row items-center gap-3">
        <View className="w-9 h-9 rounded-full bg-card-600 border border-[#2a2a2a] items-center justify-center relative">
          <Icon icon={memo} className="text-white text-base" />
          <View
            className={`w-2.5 h-2.5 rounded-full ${badgeColor} absolute -top-1 -right-1`}
          />
        </View>
        <View className="items-start">
          <Text
            className={`text-white font-bbh-mini-2 text-2xl font-semibold whitespace-nowrap overflow-hidden max-w-[40vw] text-ellipsis ${isCompleted ? 'line-through text-white/60' : ''}`}
          >
            {item.title}
          </Text>
          {item.description && (
            <Text className="text-white/70 text-xs font-bbh">
              {smartTruncate(item.description, 30)}
            </Text>
          )}
        </View>
      </View>
      <View className="rounded-full p-0.5 border border-card-400">
        <Icons.ChevronRight className="text-white/60 text-base" size={15} />
      </View>
    </TouchableOpacity>
  )
}






