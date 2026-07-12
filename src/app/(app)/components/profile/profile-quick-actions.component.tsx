import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { cn } from '@/shared/utils/helpers.util'
import { RiArrowRightCircleFill } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import type { ProfileQuickAction } from './profile.types'

interface ProfileQuickActionsProps {
  actions: ProfileQuickAction[]
}

export function ProfileQuickActions({ actions }: ProfileQuickActionsProps) {
  const navigate = useNavigate()

  return (
    <View className="space-y-3 pb-[200px] pt-3">
      <Text className="text-white/70 text-sm font-bbh font-semibold px-1">
        Quick Access
      </Text>

      <View className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Pressable
            key={action.to}
            onPress={() => navigate({ to: action.to })}
            className={cn(
              action.colorScheme?.bg1 || "bg-cardx",
              ' col-span-2 rounded-[50px] px-5 py-4 flex-row items-center justify-between',
            )}
          >
            <View className="flex-row items-center text-left gap-4">
              <View
                className={cn(
                  action.colorScheme?.bg2 || "bg-card-light/60",
                  'w-10 h-10 rounded-xl  flex items-center justify-center',
                  action.iconContainerClassName,
                )}
              >
                {action.icon}
              </View>
              <View>
                <Text className="text-white text-sm font-bbh font-semibold">
                  {action.title}
                </Text>
                <Text className="text-white/70 text-xs font-bbh">
                  {action.description}
                </Text>
              </View>
            </View>
            <RiArrowRightCircleFill size={20} className="text-white/90" />
          </Pressable>
        ))}
      </View>
    </View>
  )
}
