import { Input } from '@/components/common/input.component'
import { BottomNotch } from '@/components/common/notch.component'
import { TextArea } from '@/components/common/textarea.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { Moti } from '@/shared/constants.shared'
import { hapticFeedback } from '@/shared/haptic.util'
import { shouldAnimate } from '@/shared/utils/animation.util'
import { motion } from 'framer-motion'
import { useState } from 'react'

export type TaskFrequency = 'DAILY' | 'WEEKLY'

interface TaskFormSheetProps {
  mode: 'add' | 'edit'
  initialTitle?: string
  initialDescription?: string
  initialFrequency?: TaskFrequency
  isSaving?: boolean
  onSubmit: (payload: { title: string; description: string; frequency: TaskFrequency }) => void
  onCancel: () => void
}

export const TaskFormSheet = ({
  mode,
  initialTitle = 'Untitled Task',
  initialDescription = '',
  initialFrequency = 'DAILY',
  isSaving = false,
  onSubmit,
  onCancel,
}: TaskFormSheetProps) => {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [error, setError] = useState<string | null>(null)
  const [frequency, setFrequency] = useState<TaskFrequency>(initialFrequency)

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !isSaving

  const handleSubmit = () => {
    if (!title.trim()) return setError('Please add a title')
    if (!description.trim()) return setError('Please add a short description')
    setError(null)
    onSubmit({ title: title.trim(), description: description.trim(), frequency })
  }

  const onToggleFreq = (value: TaskFrequency) => {
    setFrequency(value)
    try { hapticFeedback?.light && hapticFeedback.light() } catch {}
  }

  return (
    <View className="gap-2">
      {/* Frequency - animated segmented control (top) */}
      <View className="flex flex-row justify-between items-center ">
        <View className="border border-[#2a2a2a] rounded-full p-1 flex-row relative overflow-hidden">
          <View className="relative flex-row flex text-sm">
            <TouchableOpacity
              className={`relative px-4 py-1 rounded-full overflow-hidden`}
              onPress={() => onToggleFreq('DAILY')}
            >
              {frequency === 'DAILY' && (
                <Moti.div
                  layoutId={shouldAnimate ? "freqBg" : undefined}
                  className="absolute inset-0 bg-white rounded-full"
                  transition={shouldAnimate ? { type: 'spring', stiffness: 300, damping: 26 } : { duration: 0 }}
                />
              )}
              <Text className={`relative text-center font-bbh ${frequency === 'DAILY' ? 'text-black font-semibold' : 'text-white/70'}`}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`relative px-3 py-1 rounded-full overflow-hidden`}
              onPress={() => onToggleFreq('WEEKLY')}
            >
              {frequency === 'WEEKLY' && (
                <motion.div
                  layoutId={shouldAnimate ? "freqBg" : undefined}
                  className="absolute inset-0 bg-white rounded-full"
                  transition={shouldAnimate ? { type: 'spring', stiffness: 300, damping: 26 } : { duration: 0 }}
                />
              )}
              <Text className={`relative text-center font-bbh ${frequency === 'WEEKLY' ? 'text-black font-semibold' : 'text-white/70'}`}>Weekly</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Icon selector removed */}
        <View />
      </View>

      {/* Title */}
      <View className="">
        <Input
          value={title}
          onChange={(e) => setTitle((e.target as HTMLInputElement).value.slice(0, 80))}
          placeholder="Untitled Task"
          inputClassName="bg-transparent !border-0 pb-0 !rounded-[0px] text-white text-2xl font-semibold font-bbh px-0"
          containerClassName="!rounded-[0px]"
          className="!rounded-[0px] !border-0 pb-5"
          onKeyDown={(e: any) => {
            if (e.key === 'Enter' && canSubmit) handleSubmit()
          }}
        />
      </View>

      {/* Description */}
      <View className="mb-4">
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value.slice(0, 280))}
          placeholder="Tap to add a description..."
          autosize
          maxWidth={720}
          className="min-h-[64px] border-b border-card-300"
        />
        <View className="flex-row items-center justify-between mt-2">
          {error ? (
            <Text className="text-red-400 text-xs font-bbh">{error}</Text>
          ) : (
            <Text className="text-white/40 text-xs font-bbh">{description.length}/280</Text>
          )}
          <TouchableOpacity
            className="px-2 py-1 rounded-md border border-[#2a2a2a]"
            onPress={() => setDescription('')}
          >
            <Text className="text-white/70 text-xs font-bbh">Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom row: Create + Cancel */}
      <View className="flex-row gap-3 pt-1">
        <TouchableOpacity
          className={`w-2/3 flex justify-center rounded-xl py-3 ${canSubmit ? 'bg-white' : 'bg-[#1a1a1a] border border-[#2a2a2a]'}`}
          onPress={() => canSubmit && handleSubmit()}
        >
          <Text className={`text-center font-bbh font-semibold ${canSubmit ? 'text-black' : 'text-white/60'}`}>
            {isSaving ? 'Saving…' : mode === 'add' ? 'Create task' : 'Save'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-1/3 bg-transparent flex justify-center rounded-xl py-3 border border-[#2a2a2a]"
          onPress={onCancel}
        >
          <Text className="text-white/80 text-center font-bbh">Cancel</Text>
        </TouchableOpacity>
      </View>

      <BottomNotch />
    </View>
  )
}
