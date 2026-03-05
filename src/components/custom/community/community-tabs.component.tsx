import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { cn } from '@/shared/utils/helpers.util'

type Tab = 'templates' | 'activity' | 'members'

interface CommunityTabsProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function CommunityTabs({ activeTab, onTabChange }: CommunityTabsProps) {
  const tabs: Tab[] = ['templates', 'activity', 'members']

  return (
    <View className="flex-row gap-3 mb-4 p-2 bg-card-lighter-2/5 rounded-full max-w-full overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <Pressable
          key={tab}
          onPress={() => onTabChange(tab)}
          className={cn(
            'shrink-0 rounded-full px-4 py-2',
            activeTab === tab
              ? 'bg-white text-black'
              : 'bg-card-light/30 text-white',
          )}
        >
          <Text className="text-xs font-bold font-bbh capitalize">{tab}</Text>
        </Pressable>
      ))}
    </View>
  )
}
