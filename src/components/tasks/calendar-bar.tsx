import { Icons } from '@/components/layout/icon.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import calendarIcon from '@iconify-icons/twemoji/spiral-calendar'
import { Icon } from '@iconify/react'
import React from 'react'

/**
 * Calendar bar showing the active date with controls to open/reset.
 */
export interface CalendarBarProps {
  date: Date
  onOpen: () => void
  onReset?: () => void
}

export const CalendarBar: React.FC<CalendarBarProps> = ({ date, onOpen, onReset }) => {
  const fmt = new Intl.DateTimeFormat(undefined, {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(date)
  return (
    <View className="flex-row items-center justify-between   rounded-b-2xl px-4 py-3">
      <View className="flex-row items-center gap-2">
        <Icon icon={calendarIcon} className="text-white/80 text-lg" />
        <Text className="text-white text-sm font-bbh">{fmt}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          className="rounded-full bg-card-600 border gap-2 border-[#2a2a2a]  p-2"
          onPress={onOpen}
        >
          <Icons.Calendar color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          className="rounded-full   bg-red-500/10 border gap-2 border-red-500/50 px-3 py-1 text-red-500"
          onPress={onReset}
        >
          <Text className="font-bbh-mini-2">
            Reset
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}






