import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useJournalByDate } from '@/hooks/use-journal.hook'
import memo from '@iconify-icons/twemoji/memo'
import { Icon } from '@iconify/react'
import { useEffect, useMemo } from 'react'

interface JournalCTAProps {
  onPress: () => void
  autoOpen?: boolean
}

export function JournalCTA({ onPress, autoOpen = false }: JournalCTAProps) {
  // Get today's date in YYYY-MM-DD format
  const todayDate = useMemo(() => {
    return new Date().toISOString().split('T')[0]
  }, [])

  const { data: todayJournal } = useJournalByDate(todayDate)
  const hasEntryToday = !!todayJournal?.data?.journal

  // Auto-open if triggered by notification
  useEffect(() => {
    if (autoOpen && !hasEntryToday) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        onPress()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [autoOpen, hasEntryToday, onPress])

  const getPromptText = () => {
    if (hasEntryToday) {
      return {
        title: 'Want to add anything?',
        subtitle: 'Update your journal entry',
      }
    }
    const hour = new Date().getHours()
    if (hour < 12) {
      return {
        title: 'How\'s your morning going?',
        subtitle: 'Share a quick thought',
      }
    }
    if (hour < 17) {
      return {
        title: 'How\'s your day been?',
        subtitle: 'Take a moment to reflect',
      }
    }
    return {
      title: 'How was your day?',
      subtitle: 'Capture your thoughts',
    }
  }

  const prompt = getPromptText()

  return (
    <TouchableOpacity
      className="mb-6 w-full rounded-xl border border-card-400 bg-card-600 p-4 hover:bg-card-500 transition-colors active:opacity-80"
      onPress={onPress}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-10 h-10 rounded-lg bg-accent-500/10 items-center justify-center flex-shrink-0">
          <Icon icon={memo} className="text-accent-400" style={{ fontSize: 22 }} />
        </View>
        
        <View className="flex-1 min-w-0 text-left">
          <Text className="text-white text-base font-semibold font-outfit">
            {prompt.title}
          </Text>
          <Text className="text-white/60 text-sm font-outfit mt-0.5">
            {prompt.subtitle}
          </Text>
        </View>

        <View className="w-6 h-6 rounded items-center justify-center flex-shrink-0 ml-auto">
          <Icon icon="mdi:chevron-right" className="text-white/40" style={{ fontSize: 20 }} />
        </View>
      </View>
    </TouchableOpacity>
  )
}
