import { useNavigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { cn } from '@/shared/utils/helpers.util'

export type RewindIntelligenceTab = 'insights' | 'observations'

export function RewindIntelligenceTabs({
  selected,
}: {
  selected: RewindIntelligenceTab
}): ReactElement {
  const navigate = useNavigate()
  const tabs: Array<{
    label: string
    route: '/app/rewind-history' | '/app/rewind-observations'
    value: RewindIntelligenceTab
  }> = [
    { label: 'Insights', route: '/app/rewind-history', value: 'insights' },
    {
      label: 'Observations',
      route: '/app/rewind-observations',
      value: 'observations',
    },
  ]

  return (
    <View className="flex-row rounded-xl bg-cardx p-1">
      {tabs.map((tab) => {
        const isSelected = selected === tab.value
        return (
          <Pressable
            accessibilityLabel={`Open Rewind ${tab.label}`}
            aria-pressed={isSelected}
            className={cn(
              'min-h-11 flex-1 items-center justify-center rounded-lg px-3',
              isSelected ? 'bg-white' : 'bg-cardx',
            )}
            key={tab.value}
            onPress={() => {
              if (!isSelected) void navigate({ to: tab.route })
            }}
          >
            <Text
              className={cn(
                'font-bbh text-sm font-bold',
                isSelected ? 'text-cardd' : 'text-card-lighter-2',
              )}
            >
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
