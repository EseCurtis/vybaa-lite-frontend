import { Icons } from '@/components/layout/icon.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import checkMark from '@iconify-icons/twemoji/check-mark-button'
import crossMark from '@iconify-icons/twemoji/cross-mark'
import memo from '@iconify-icons/twemoji/memo'
import pencil from '@iconify-icons/twemoji/pencil'
import { Icon } from '@iconify/react'

export type FrontendTaskStatus = 'pending' | 'completed' | 'skipped'

export function TaskCard({
  id,
  title,
  frequency,
  status,
  onDone,
  onSkip,
  onEdit,
  onPress,
}: {
  id: string
  title: string
  frequency: string
  status: FrontendTaskStatus
  onDone: (id: string) => void
  onSkip: (id: string) => void
  onEdit: (id: string) => void
  onPress?: (id: string) => void
}) {
  const isCompleted = status === 'completed'
  const isSkipped = status === 'skipped'

  

  return (
    <View
      className={`rounded-xl flex flex-col p-3.5 transition-all duration-200 border ${
        isCompleted 
          ? 'bg-card-600/50 border-card-500/50' 
          : isSkipped
            ? 'bg-card-700/30 border-card-600/30'
            : 'bg-card-600 border-card-500'
      }`}
    >
      <View className="flex-row items-start gap-3 mb-2.5">
        <View className={`w-7 h-7 rounded-lg items-center justify-center flex-shrink-0 ${
          isCompleted ? 'bg-success-500/20' : isSkipped ? 'bg-neutral-500/20' : 'bg-accent-500/20'
        }`}>
          <Icon icon={memo} className={`text-sm ${
            isCompleted ? 'text-success-400' : isSkipped ? 'text-neutral-400' : 'text-accent-400'
          }`} />
        </View>
        <View className="flex-1 min-w-0 items-start">
          <Text className={`text-base h-[24px] overflow-hidden overflow-ellipsis whitespace-nowrap max-w-[50vw] font-semibold font-outfit mb-1 ${
            isCompleted ? 'line-through text-white/50' : 'text-white'
          }`}>
            {title}
          </Text>
          <View className="bg-white/5 rounded-md px-2 py-0.5 self-start">
            <Text className="text-white/60 text-xs font-outfit font-medium">{frequency}</Text>
          </View>
        </View>
        {onPress && (
          <TouchableOpacity
            data-action-button
            onPress={() => onPress(id)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 items-center justify-center flex-shrink-0 transition-colors"
          >
            <Icons.ChevronRight className="text-white/60 text-sm" />
          </TouchableOpacity>
        )}
      </View>

      {status === 'pending' && (
        <View className="flex-row gap-2 mt-2">
          <TouchableOpacity 
            data-action-button
            className="bg-success-500/20 hover:bg-success-500/30 border border-success-500/30 rounded-lg px-3 py-2 flex-row items-center gap-1.5 flex-1 justify-center transition-colors" 
              //@ts-ignore
            onPress={(e: any) => {
              if (e?.stopPropagation) e.stopPropagation()
              if (e?.preventDefault) e.preventDefault()
              onDone(id)
            }}
          >
            <Icon icon={checkMark} className="text-success-400 text-sm" />
            <Text className="text-success-400 text-xs font-semibold font-outfit">Done</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            data-action-button
            className="bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 flex-row items-center gap-1.5 flex-1 justify-center transition-colors" 
            //@ts-ignore
            onPress={(e: any) => {
              if (e?.stopPropagation) e.stopPropagation()
              if (e?.preventDefault) e.preventDefault()
              onSkip(id)
            }}
          >
            <Icon icon={crossMark} className="text-white/60 text-sm" />
            <Text className="text-white/60 text-xs font-semibold font-outfit">Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            data-action-button
            className="bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 flex-row items-center gap-1.5 justify-center transition-colors" 
              //@ts-ignore
            onPress={(e: any) => {
              if (e?.stopPropagation) e.stopPropagation()
              if (e?.preventDefault) e.preventDefault()
              onEdit(id)
            }}
          >
            <Icon icon={pencil} className="text-white/60 text-sm" />
          </TouchableOpacity>
        </View>
      )}

      {isCompleted && (
        <View className="bg-success-500/20 border border-success-500/30 rounded-lg px-3 py-2 flex-row items-center gap-2 justify-center mt-2">
          <Icon icon={checkMark} className="text-success-400 text-sm" />
          <Text className="text-success-400 text-xs font-semibold font-outfit">Completed</Text>
        </View>
      )}

      {isSkipped && (
        <View className="bg-neutral-500/10 border border-neutral-500/20 rounded-lg px-3 py-2 flex-row items-center gap-2 justify-center mt-2">
          <Icon icon={crossMark} className="text-neutral-400 text-xs" />
          <Text className="text-neutral-400 text-xs font-semibold font-outfit">Skipped</Text>
        </View>
      )}
    </View>
  )
}
