import { LinearGradient } from '@/components/layout/linear-gradient.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { FilterTab } from '@/components/tasks/segmented-tabs'
import checkMark from '@iconify-icons/twemoji/check-mark-button'
import crossMark from '@iconify-icons/twemoji/cross-mark'
import clock from '@iconify-icons/twemoji/hourglass-not-done'
import { Icon } from '@iconify/react'

interface HomeStatsCardsProps {
  pending: number
  completed: number
  skipped: number
  onStatPress: (filter: FilterTab) => void
}

// Format number with appropriate sizing
function formatStatNumber(num: number): { display: string; fontSize: string } {
  if (num >= 1000) {
    return {
      display: `${(num / 1000).toFixed(1)}K`,
      fontSize: 'text-4xl',
    }
  }
  if (num >= 100) {
    return {
      display: num.toString(),
      fontSize: 'text-4xl',
    }
  }
  if (num >= 10) {
    return {
      display: num.toString(),
      fontSize: 'text-5xl',
    }
  }
  return {
    display: num.toString(),
    fontSize: 'text-5xl',
  }
}

interface StatCardProps {
  value: number
  label: string
  icon: any
  borderColorClass: string
  textColorClass: string
  iconBgColorClass: string
  iconBorderColorClass: string
  gradientColors: [string, string]
  onPress: () => void
}

function StatCard({
  value,
  label,
  icon,
  borderColorClass,
  textColorClass,
  iconBgColorClass,
  iconBorderColorClass,
  gradientColors,
  onPress,
}: StatCardProps) {
  const { display, fontSize } = formatStatNumber(value)

  return (
    <TouchableOpacity
      className={`flex-1 rounded-2xl overflow-hidden border ${borderColorClass} hover:opacity-80 transition-all duration-200 active:scale-[0.98] min-w-0`}
      onPress={onPress}
    >
      <LinearGradient
        className="w-full h-full p-4"
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="items-center min-h-[120px] justify-center">
          {/* Icon */}
          <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 border ${iconBgColorClass} ${iconBorderColorClass}`}>
            <Icon icon={icon} className={`${textColorClass} text-xl`} />
          </View>
          {/* Number */}
          <Text
            className={`${fontSize} ${textColorClass} font-bold font-bbh mb-1 text-center leading-none truncate w-full`}
          >
            {display}
          </Text>
          {/* Label */}
          <Text className="text-white/90 text-xs font-semibold font-bbh text-center">
            {label}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

export function HomeStatsCards({ pending, completed, skipped, onStatPress }: HomeStatsCardsProps) {
  return (
    <View className="gap-4 mb-6">
      <View className="flex-row gap-3">
        {/* Pending Card */}
        <StatCard
          value={pending}
          label="Pending"
          icon={clock}
          borderColorClass="border-accent-400/30"
          textColorClass="text-accent-400"
          iconBgColorClass="bg-accent-400/20"
          iconBorderColorClass="border-accent-400/30"
          gradientColors={['rgba(179, 201, 56, 0.15)', 'rgba(179, 201, 56, 0.05)']}
          onPress={() => onStatPress('PENDING')}
        />

        {/* Completed Card */}
        <StatCard
          value={completed}
          label="Completed"
          icon={checkMark}
          borderColorClass="border-success-400/30"
          textColorClass="text-success-400"
          iconBgColorClass="bg-success-400/20"
          iconBorderColorClass="border-success-400/30"
          gradientColors={['rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.05)']}
          onPress={() => onStatPress('COMPLETED')}
        />

        {/* Skipped Card */}
        <StatCard
          value={skipped}
          label="Skipped"
          icon={crossMark}
          borderColorClass="border-card-400/30"
          textColorClass="text-neutral-400"
          iconBgColorClass="bg-white/10"
          iconBorderColorClass="border-white/20"
          gradientColors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
          onPress={() => onStatPress('SKIPPED')}
        />
      </View>
    </View>
  )
}
