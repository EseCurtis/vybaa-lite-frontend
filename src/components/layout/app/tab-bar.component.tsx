import { BottomNotch } from '@/components/common/notch.component'
import { colors } from '@/shared/colors.shared'
import { Moti } from '@/shared/constants.shared'
import { hapticFeedback } from '@/shared/haptic.util'
import { shouldAnimate } from '@/shared/utils/animation.util'
import { cn } from '@/shared/utils/helpers.util'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { memo, useCallback, useMemo } from 'react'
import { Icons } from '../icon.component'
import { LinearGradient } from '../linear-gradient.component'
import { TouchableOpacity } from '../pressables.component'
import { Text } from '../text.component'
import { View } from '../view.component'
import { useUnreadCount } from '@/hooks/use-notifications.hook'

export const TabBar = memo(() => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: unreadCount } = useUnreadCount()

  const tabs = useMemo(
    () => [
      {
        id: 'home',
        route: '/app/home',
        icon: Icons.Home,
        label: 'Home',
        isSpecial: false,
        badge: null,
      },
      {
        id: 'notifications',
        route: '/app/notifications',
        icon: Icons.Bell,
        label: 'Notifications',
        isSpecial: false,
        badge: unreadCount || null,
      },
      {
        id: 'profile',
        route: '/app/profile',
        icon: Icons.User,
        label: 'Me',
        isSpecial: false,
        badge: null,
        matchAllRoot: true,
      },
    ],
    [unreadCount],
  )

  const isActiveTab = useCallback(
    (route: string, matchAllRoot: boolean = false, matchAlso?: string[]) => {
      if (matchAlso) {
        return (
          matchAlso.includes(location.pathname) || location.pathname === route
        )
      }

      if (matchAllRoot) {
        return location.pathname.includes(route)
      }

      return location.pathname === route
    },
    [location.pathname],
  )

  const handleTabPress = useCallback(
    async (route: string) => {
      // Only navigate if not already on the route
      if (location.pathname !== route) {
        // Provide haptic feedback
        await hapticFeedback.light()

        // Navigate to the route
        navigate({ to: route })
      }
    },
    [location.pathname, navigate],
  )

  return (
    <Moti.div
      className="bottom-0 left-0 fixed w-full z-50  "
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      key="tabbar"
    >
      <LinearGradient
        className="absolute top-0 size-full left-0"
        colors={['transparent', colors.black]}
        locations={[0, 0.9]}
      />
      <View className="p-mg py-0 z-10 relative">
        <Moti.div className=" py-2 rounded-full  mx-auto flex flex-row items-center w-full justify-between px-2  shadow-2xl borsder border-card-300/20">
          {tabs.map((tab) => {
            const isActive = isActiveTab(
              tab.route,
              tab?.matchAllRoot,
              tab?.matchAlso,
            )

            return (
              <Moti.div
                key={tab.id}
                className="relative rounded-full py-1"
                whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                transition={
                  shouldAnimate
                    ? { type: 'spring', stiffness: 400, damping: 17 }
                    : { duration: 0 }
                }
              >
                <TouchableOpacity
                  className={cn(
                    isActive ? '  ' : '',
                    ` px-4 items-center flex trasnition-all  justify-center flex-row  rounded-full py-2 `,
                  )}
                  onPress={() => handleTabPress(tab.route)}
                  accessibilityLabel={`Navigate to ${tab.label || tab.id} tab`}
                  accessibilityRole="button"
                  accessibilityHint={`Double tap to switch to ${tab.label || tab.id} screen`}
                  testID={`tab-${tab.id}`}
                >
                  <>
                    {/* Active indicator background */}
                    {isActive && (
                      <Moti.div
                        className="absolute  inset-0   flex items-end justify-center mt-full rounded-full "
                        layoutId={shouldAnimate ? 'activeTab' : undefined}
                        initial={false}
                        animate={
                          shouldAnimate
                            ? {
                                //  backgroundColor: colors.white,
                              }
                            : false
                        }
                        transition={
                          shouldAnimate
                            ? {
                                type: 'spring',
                                stiffness: 300,
                                damping: 30,
                              }
                            : { duration: 0 }
                        }
                      >
                        <View className="w-4 text-white bg-accent-500 rounded-full h-1 shadow-lg shadow-accent-500"></View>
                      </Moti.div>
                    )}

                    {/* Icon with animation */}
                    <Moti.div
                      animate={
                        shouldAnimate
                          ? {
                              opacity: isActive ? 1 : 0.7,
                              scale: isActive ? 1.1 : 1,
                            }
                          : false
                      }
                      transition={
                        shouldAnimate
                          ? {
                              type: 'spring',
                              stiffness: 300,
                              damping: 20,
                            }
                          : { duration: 0 }
                      }
                      className="relative flex items-center justify-center flex-col"
                      style={
                        !shouldAnimate
                          ? {
                              opacity: isActive ? 1 : 0.7,
                              scale: isActive ? 1.1 : 1,
                            }
                          : undefined
                      }
                    >
                      <tab.icon
                        color={isActive ? colors.accent[400] : colors['card-lighter-3']}
                        size={27}
                        fill={
                          isActive ? colors.accent[700] + '7a' : 'transparent'
                        }
                        className="relative z-10"
                      />
                      {/* Notification Badge */}
                      {tab.badge && tab.badge > 0 && (
                        <View className="absolute -top-1 -right-1 bg-danger-500 rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          <Text className="text-white text-[10px] font-bbh font-bold">
                            {tab.badge > 99 ? '99+' : tab.badge}
                          </Text>
                        </View>
                      )}
                      <Text
                        style={{
                          color: isActive
                            ? 'transparent'
                            : colors.card[100],
                        }}
                        className="text-white hidden text-[0.6rem] font-bold"
                      >
                        {tab.label.toUpperCase()}
                      </Text>
                    </Moti.div>
                  </>
                </TouchableOpacity>
              </Moti.div>
            )
          })}
        </Moti.div>

        <BottomNotch />
      </View>
    </Moti.div>
  )
})

TabBar.displayName = 'TabBar'
