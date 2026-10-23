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

const ACTION_GROUPS = [
  { id: 'personal', title: 'Your space' },
  { id: 'progress', title: 'Progress & rewards' },
  { id: 'preferences', title: 'App & connections' },
] as const

export function ProfileQuickActions({ actions }: ProfileQuickActionsProps) {
  const navigate = useNavigate()

  return (
    <View
      className="gap-7 pt-5 pb-[120px]"
      data-walkthrough="profile-quick-actions"
    >
      {ACTION_GROUPS.map((group) => {
        const grouped = actions.filter(
          (action) => (action.group ?? 'personal') === group.id,
        )
        if (!grouped.length) return null
        return (
          <section
            key={group.id}
            aria-labelledby={`profile-actions-${group.id}`}
            className="space-y-3"
          >
            <h2
              id={`profile-actions-${group.id}`}
              className="px-1 font-bbh text-base font-semibold text-white"
            >
              {group.title}
            </h2>
            <View className="gap-3">
              {grouped.map((action) => (
                <Pressable
                  key={action.to}
                  type="button"
                  onPress={() => navigate({ to: action.to })}
                  className={cn(
                    action.colorScheme?.bg1 ?? 'bg-cardx',
                    'min-h-20 w-full flex-row items-center justify-between gap-3 rounded-[50px] px-5 py-4 text-left active:!scale-[0.98] motion-reduce:!transform-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white',
                  )}
                >
                  <View className="min-w-0 flex-1 flex-row items-center text-left gap-3">
                    <View
                      className={cn(
                        action.colorScheme?.bg2 ?? 'bg-card-light/60',
                        'size-10 shrink-0 rounded-xl flex items-center justify-center',
                        action.iconContainerClassName,
                      )}
                    >
                      {action.icon}
                    </View>
                    <View className="min-w-0 flex-1 gap-1">
                      <Text className="text-white text-sm font-bbh font-semibold">
                        {action.title}
                      </Text>
                      <Text className="text-white/70 text-xs leading-5 font-bbh">
                        {action.description}
                      </Text>
                    </View>
                  </View>
                  <RiArrowRightCircleFill
                    aria-hidden="true"
                    size={20}
                    className="shrink-0 text-white/90"
                  />
                </Pressable>
              ))}
            </View>
          </section>
        )
      })}
    </View>
  )
}
