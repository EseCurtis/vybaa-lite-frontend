import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import books from '@iconify-icons/twemoji/books'
import target from '@iconify-icons/twemoji/direct-hit'
import biceps from '@iconify-icons/twemoji/flexed-biceps'
import memo from '@iconify-icons/twemoji/memo'
import money from '@iconify-icons/twemoji/money-bag'
import people from '@iconify-icons/twemoji/people-holding-hands'
import lotus from '@iconify-icons/twemoji/person-in-lotus-position'
import sunrise from '@iconify-icons/twemoji/sunrise'
import { Icon } from '@iconify/react'

interface CategoryPickerSheetProps {
  selected?: string
  onSelect: (emoji: string) => void
}

const items: Array<{ key: string; label: string; emoji: string; icon: any; bg: string }> = [
  { key: 'morning', label: 'Morning', emoji: '🌅', icon: sunrise, bg: 'from-amber-500/20 to-orange-500/20' },
  { key: 'wellness', label: 'Wellness', emoji: '🧘', icon: lotus, bg: 'from-emerald-500/20 to-teal-500/20' },
  { key: 'focus', label: 'Focus', emoji: '🎯', icon: target, bg: 'from-indigo-500/20 to-fuchsia-500/20' },
  { key: 'journal', label: 'Journal', emoji: '📝', icon: memo, bg: 'from-sky-500/20 to-cyan-500/20' },
  { key: 'fitness', label: 'Fitness', emoji: '💪', icon: biceps, bg: 'from-rose-500/20 to-pink-500/20' },
  { key: 'study', label: 'Study', emoji: '📚', icon: books, bg: 'from-violet-500/20 to-purple-500/20' },
  { key: 'social', label: 'Social', emoji: '🤝', icon: people, bg: 'from-lime-500/20 to-green-500/20' },
  { key: 'money', label: 'Money', emoji: '💸', icon: money, bg: 'from-yellow-500/20 to-amber-500/20' },
]

export const CategoryPickerSheet = ({ selected, onSelect }: CategoryPickerSheetProps) => {
  return (
    <View className="gap-4">
      <Text className="text-white/80 text-sm font-bbh">Pick an icon</Text>
      <View className="grid grid-cols-4 gap-3">
        {items.map((item) => {
          const isActive = selected === item.emoji
          return (
            <TouchableOpacity
              key={item.key}
              className={`rounded-xl p-3 border transition-all duration-150 active:scale-95 bg-gradient-to-br ${
                isActive ? 'border-white/50 ring-2 ring-white/40' : 'border-[#2a2a2a]'
              } ${item.bg}`}
              onPress={() => onSelect(item.emoji)}
            >
              <View className="items-center">
                <Icon icon={item.icon} className="text-white/90 text-xl" />
                <Text className="text-white/80 text-[11px] mt-2 font-bbh">{item.label}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
