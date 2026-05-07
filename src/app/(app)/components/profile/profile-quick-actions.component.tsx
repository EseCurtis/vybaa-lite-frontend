import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { cn } from '@/shared/utils/helpers.util'
import { RiArrowRightSLine } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import type { ProfileQuickAction } from './profile.types'

interface ProfileQuickActionsProps {
  actions: ProfileQuickAction[]
}

export function ProfileQuickActions({
  actions,
}: ProfileQuickActionsProps) {
  const navigate = useNavigate()

  return (
    <View className="space-y-3 pb-[200px]">
      <Text className="text-white/70 text-sm font-bbh font-semibold px-1">
        Quick Access
      </Text>

      <View className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Pressable
            key={action.to}
            onPress={() => navigate({ to: action.to })}
            className="bg-card-light/40 col-span-2 rounded-[50px] px-5 py-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center text-left gap-4">
              <View
                className={cn(
                  'w-10 h-10 rounded-xl bg-card-light/60 flex items-center justify-center',
                  action.iconContainerClassName,
                )}
              >
                {action.icon}
              </View>
              <View>
                <Text className="text-white text-sm font-bbh font-semibold">
                  {action.title}
                </Text>
                <Text className="text-white/50 text-xs font-bbh">
                  {action.description}
                </Text>
              </View>
            </View>
            <RiArrowRightSLine size={20} className="text-white/40" />
          </Pressable>
        ))}
      </View>
    </View>
  )
}
