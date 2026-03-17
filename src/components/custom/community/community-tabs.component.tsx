import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { cn } from '@/shared/utils/helpers.util'

export type CommunityTabKey = 'templates' | 'activity' | 'members' | 'moderation'

interface CommunityTabsProps {
  activeTab: CommunityTabKey
  onTabChange: (tab: CommunityTabKey) => void
  showModeration?: boolean
}

export function CommunityTabs({
  activeTab,
  onTabChange,
  showModeration = false,
}: CommunityTabsProps) {
  const tabs: CommunityTabKey[] = showModeration
    ? ['templates', 'activity', 'members', 'moderation']
    : ['templates', 'activity', 'members']

  return (
    <View className="flex-row pl-mg gap-3 mb-2 p-2 max-w-full overflow-x-auto no-scrollbar">
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
          <Text className="text-sm font-bold font-bbh capitalize">
            {tab === 'moderation' ? 'moderation' : tab}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}
