import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import React from 'react'

/**
 * Tab switcher for filtering tasks by status.
 */
export type FilterTab = 'ALL' | 'PENDING' | 'COMPLETED' | 'SKIPPED'

export interface SegmentedTabsProps {
  value: FilterTab
  onChange: (tab: FilterTab) => void
}

export const SegmentedTabs: React.FC<SegmentedTabsProps> = ({
  value,
  onChange,
}) => {
  const tabs: Array<FilterTab> = ['ALL', 'PENDING', 'COMPLETED', 'SKIPPED']
  return (
    <View className="flex-row">
      <View className="border border-[#2a2a2a] rounded-full p-0.5 flex-row overflow-hidden bg-[#0f0f0f]">
        {tabs.map((t) => (
          <TouchableOpacity
            key={t}
            className={`px-3 py-1.5 rounded-full transition ${value === t ? 'bg-white' : 'bg-transparent hover:bg-white/5'}`}
            onPress={() => onChange(t)}
          >
            <Text
              className={`text-center text-sm md:text-base font-outfit capitalize ${value === t ? 'text-black font-semibold' : 'text-white/70'}`}
            >
              {t.toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}






