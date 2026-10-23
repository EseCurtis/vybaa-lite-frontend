import { BottomNotch } from '@/components/common/notch.component'
import { Avatar } from '@/components/user/avatar.component'
import { useUnreadCount } from '@/hooks/use-notifications.hook'
import { useAuth } from '@/providers/auth.provider'
import { useTabBarController } from '@/providers/tab-bar.provider'
import { colors } from '@/shared/colors.shared'
import { hapticFeedback } from '@/shared/haptic.util'
import { getAppTabRoot } from '@/shared/utils/app-navigation.util'
import { cn } from '@/shared/utils/helpers.util'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { LaughIcon, MessagesSquare, Plus } from 'lucide-react'
import { memo, useCallback, useMemo } from 'react'
import { Icons } from '../icon.component'
import { Pressable } from '../pressables.component'
import { Text } from '../text.component'
import { View } from '../view.component'

export const TabBar = memo(({ className }: { className?: string }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: unreadCount } = useUnreadCount()
  const { isVisible } = useTabBarController()
  const { user } = useAuth()

  const tabs = useMemo(
    () =>
      [
        {
          id: 'home',
          route: '/app/home',
          icon: Icons.Home,
          label: 'Home',
          isSpecial: false,
          badge: null,
          matchAlso: [],
        },
        {
          id: 'flexx',
          route: '/app/actions/flexx',
          icon: LaughIcon,
          label: 'Flexx',
          isSpecial: false,
          badge: null,
          matchAllRoot: true,
          enabled: true,
        },
        {
          id: 'create-goal',
          route: '/app/goal/create',
          icon: Plus,
          label: 'Create task',
          isSpecial: true,
          badge: null,
          enabled: true,
        },
        {
          id: 'rewind-chats',
          route: '/app/rewind-chats',
          icon: MessagesSquare,
          label: 'Rewind Chats',
          isSpecial: false,
          badge: null,
          matchAllRoot: true,
          enabled: true,
        },
        {
          id: 'wellness',
          route: '/app/wellness',
          icon: Icons.Heart,
          label: 'Wellness',
          isSpecial: false,
          badge: null,
          matchAllRoot: true,
          enabled: false, // Hide wellness tab when insights is disabled
        },
        {
          id: 'profile',
          route: '/app/profile',
          icon: () => <Avatar user={user ?? undefined} size={27} />,
          label: 'Me',
          isSpecial: false,
          badge: null,
          matchAllRoot: true,
        },
      ].filter((tab) => tab.enabled !== false), // Filter out disabled tabs
    [unreadCount, user],
  )

  const isActiveTab = useCallback(
    (route: string, matchAllRoot: boolean = false, matchAlso?: string[]) => {
      if (matchAlso) {
        return (
          matchAlso.includes(location.pathname) || location.pathname === route
        )
      }

      if (matchAllRoot) {
        return getAppTabRoot(location.pathname) === route
      }

      return location.pathname === route
    },
    [location.pathname],
  )

  const handleTabPress = useCallback(
    (route: string) => {
      // Only navigate if not already on the route
      if (location.pathname !== route) {
        void hapticFeedback.light()
        void navigate({
          replace: true,
          to: route,
          // Also skip snapshots on WebViews without transition-type support.
          viewTransition: getAppTabRoot(route) === route ? false : undefined,
        })
      }
    },
    [location.pathname, navigate],
  )

  return isVisible ? (
    <div
      className={cn(className, 'bottom-0 left-0 fixed !py-0 w-full z-50 p-0')}
      data-walkthrough="main-navigation"
    >
      <View className="px-3 z-10 relative bg-cardd">
        <div className="grid w-full grid-cols-5 items-center">
          {tabs.map((tab) => {
            const isActive = isActiveTab(
              tab.route,
              tab?.matchAllRoot,
              tab?.matchAlso,
            )
            let iconColor = colors['card-lighter-3']
            let iconFill = 'transparent'

            if (tab.isSpecial) {
              iconColor = colors.cardd
              iconFill = 'transparent'
            } else if (isActive) {
              iconColor = colors.accent[400]
              iconFill = 'transparent'
            }
            const accessibilityLabel = tab.isSpecial
              ? 'Create a new task'
              : `Navigate to ${tab.label || tab.id} tab`
            const accessibilityHint = tab.isSpecial
              ? 'Double tap to create a new task'
              : `Double tap to switch to ${tab.label || tab.id} screen`

            return (
              <div
                key={tab.id}
                className={cn(
                  'relative flex min-w-0 items-center justify-center py-3',
                  tab.isSpecial && ' z-20',
                )}
              >
                <Pressable
                  type="button"
                  aria-pressed={!tab.isSpecial && isActive}
                  className={cn(
                    'min-h-12 min-w-12 items-center flex relative justify-center flex-row focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                    tab.isSpecial
                      ? 'p-1 rounded-full bg-white'
                      : 'rounded-xl px-2 py-2',
                    !tab.isSpecial && isActive && 'bg-card-light/20',
                  )}
                  onPress={() => handleTabPress(tab.route)}
                  accessibilityLabel={accessibilityLabel}
                  accessibilityRole="button"
                  accessibilityHint={accessibilityHint}
                  testID={`tab-${tab.id}`}
                >
                  <>
                    <View className="relative flex items-center justify-center flex-col">
                      <tab.icon
                        color={iconColor}
                        size={tab.isSpecial ? 27 : 27}
                        fill={iconFill}
                        className="relative z-10"
                      />
                      {/* Notification Badge */}
                      {typeof tab.badge === 'number' && tab.badge > 0 && (
                        <span
                          aria-label={`${tab.badge} tasks need attention`}
                          className="absolute z-10 flex items-center justify-center -right-2 -top-2 min-w-5 h-5 rounded-full bg-danger-500 px-1 text-center text-[10px] leading-5 font-bold text-white"
                          role="status"
                        >
                          {tab.badge > 99 ? '99+' : tab.badge}
                        </span>
                      )}
                      <Text className="sr-only">{tab.label.toUpperCase()}</Text>
                    </View>
                  </>
                </Pressable>
              </div>
            )
          })}
        </div>
        <BottomNotch />
      </View>
    </div>
  ) : null
})

TabBar.displayName = 'TabBar'
