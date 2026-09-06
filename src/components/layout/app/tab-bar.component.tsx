import { BottomNotch } from '@/components/common/notch.component'
import { Avatar } from '@/components/user/avatar.component'
import { useInfiniteGoals } from '@/hooks/use-goals.hook'
import { useUnreadCount } from '@/hooks/use-notifications.hook'
import { useAuth } from '@/providers/auth.provider'
import { useTabBarController } from '@/providers/tab-bar.provider'
import { colors } from '@/shared/colors.shared'
import { Moti } from '@/shared/constants.shared'
import { goalNeedsAttention } from '@/shared/goal/goal-due.util'
import { hapticFeedback } from '@/shared/haptic.util'
//import { shouldAnimate } from '@/shared/utils/animation.util'
import { shouldAnimate } from '@/shared/utils/animation.util'
import { getAppTabRoot } from '@/shared/utils/app-navigation.util'
import { cn } from '@/shared/utils/helpers.util'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { AnimatePresence } from 'framer-motion'
import { BookOpenCheck, Plus } from 'lucide-react'
import { memo, useCallback, useMemo } from 'react'
import { Icons } from '../icon.component'
import { LinearGradient } from '../linear-gradient.component'
import { TouchableOpacity } from '../pressables.component'
import { Text } from '../text.component'
import { View } from '../view.component'

export const TabBar = memo(({ className }: { className?: string }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: unreadCount } = useUnreadCount()
  const dueGoals = useInfiniteGoals({ filter: 'DUE' })
  const overdueGoals = useInfiniteGoals({ filter: 'OVERDUE' })
  const { isVisible } = useTabBarController()
  const { user } = useAuth()
  const goalAttentionCount = useMemo(() => {
    const attentionGoalIds = new Set<string>()
    for (const data of [dueGoals.data, overdueGoals.data]) {
      for (const page of data?.pages ?? []) {
        for (const goal of page.data) {
          if (goalNeedsAttention(goal)) attentionGoalIds.add(goal.id)
        }
      }
    }
    return attentionGoalIds.size
  }, [dueGoals.data, overdueGoals.data])

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
          id: 'goals',
          route: '/app/goal',
          icon: Icons.Target,
          label: 'Goals',
          isSpecial: false,
          badge: goalAttentionCount,
          matchAllRoot: true,
          enabled: true,
        },

        {
          id: 'create-goal',
          route: '/app/goal/create',
          icon: Plus,
          label: 'Create goal',
          isSpecial: true,
          badge: null,
          enabled: true,
        },
        // {
        //   id: 'communities',
        //   route: '/app/communities',
        //   icon: Icons.Users,
        //   label: 'Communities',
        //   isSpecial: false,
        //   badge: null,
        //   matchAllRoot: true,
        // },
        {
          id: 'journal',
          route: '/app/journal',
          icon: BookOpenCheck,
          label: 'Journal',
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
          icon: user?.avatarUrl ? () => <Avatar user={user} /> : Icons.User,
          label: 'Me',
          isSpecial: false,
          badge: null,
          matchAllRoot: true,
        },
      ].filter((tab) => tab.enabled !== false), // Filter out disabled tabs
    [goalAttentionCount, unreadCount, user],
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
    async (route: string) => {
      // Only navigate if not already on the route
      if (location.pathname !== route) {
        // Provide haptic feedback
        await hapticFeedback.light()

        navigate({ replace: true, to: route })
      }
    },
    [location.pathname, navigate],
  )

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <Moti.div
        className={cn(
          className,
          'bottom-0 left-0 fixed  !py-0 w-full z-50 p-0',
        )}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        key="tabbar"
      >
        <LinearGradient
          className="absolute hidden top-0 size-full left-0 backdrop-blur-xl "
          colors={['transparent', colors.cardd]}
          locations={[0, 0.5]}
          style={{
            mask: 'linear-gradient(transparent , #000 30%)',
          }}
        />

        <View className="px-5 border-t-2 border-t-card-light z-10 relative bg-cardd">
          <Moti.div className="  px-2 flex flex-row items-center w-full justify-center ">
            {tabs.map((tab) => {
              const isActive = isActiveTab(
                tab.route,
                tab?.matchAllRoot,
                tab?.matchAlso,
              )
              let iconColor = colors['card-lighter-3']
              let iconFill = 'transparent'

              if (tab.isSpecial) {
                iconColor = colors.white
                iconFill = colors.white
              } else if (isActive) {
                iconColor = colors.accent[400]
                iconFill = colors.accent[700] + '7a'
              }
              const accessibilityLabel = tab.isSpecial
                ? 'Create a new goal'
                : `Navigate to ${tab.label || tab.id} tab${tab.id === 'goals' && tab.badge ? `, ${tab.badge} goals need attention` : ''}`
              const accessibilityHint = tab.isSpecial
                ? 'Double tap to create a new goal'
                : `Double tap to switch to ${tab.label || tab.id} screen`

              return (
                <Moti.div
                  key={tab.id}
                  className={cn(
                    'relative border-t-3 py-4 px-2',
                    tab.isSpecial && ' z-20',
                  )}
                  whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                  transition={
                    shouldAnimate
                      ? { type: 'spring', stiffness: 400, damping: 17 }
                      : { duration: 0 }
                  }
                >
                  {/* Active indicator background */}
                  {isActive && !tab.isSpecial && (
                    <Moti.div
                      className="absolute top-[-3px]  inset-0   flex items-start justify-center mt-full "
                      layoutId={shouldAnimate ? 'activeTab' : undefined}
                      initial={false}
                      animate={
                        shouldAnimate
                          ? {
                              //backgroundColor: colors.white,
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
                      <View className=" text-white bg-accent-500  h-0.5 w-full "></View>
                    </Moti.div>
                  )}

                  <TouchableOpacity
                    className={cn(
                      'items-center flex overflow-hidden relative justify-center flex-row transition-all',
                      tab.isSpecial
                        ? 'p-1 py-0.5 mx-2 rounded-md bg-accent-400  shadow-black/30'
                        : 'rounded-full px-4 py-2',
                    )}
                    onPress={() => handleTabPress(tab.route)}
                    accessibilityLabel={accessibilityLabel}
                    accessibilityRole="button"
                    accessibilityHint={accessibilityHint}
                    testID={`tab-${tab.id}`}
                  >
                    <>
                      {/* Icon with animation */}
                      <Moti.div
                        animate={
                          shouldAnimate
                            ? {
                                opacity: isActive ? 1 : 0.7,
                                scale: isActive ? 1 : 1,
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
                                scale: isActive ? 1 : 1,
                              }
                            : undefined
                        }
                      >
                        <tab.icon
                          color={iconColor}
                          size={tab.isSpecial ? 27 : 27}
                          fill={iconFill}
                          className="relative z-10"
                        />
                        {/* Notification Badge */}
                        {typeof tab.badge === 'number' && tab.badge > 0 && (
                          <span
                            aria-label={`${tab.badge} goals need attention`}
                            className="absolute z-10 flex items-center justify-center -right-2 -top-2 min-w-5 h-5 rounded-full bg-danger-500 px-1 text-center text-[10px] leading-5 font-bold text-white"
                            role="status"
                          >
                            {tab.badge > 99 ? '99+' : tab.badge}
                          </span>
                        )}
                        <Text
                          style={{
                            color: isActive ? 'transparent' : colors.card[100],
                          }}
                          className="text-white hidden whitespace-nowrap text-[5px] font-bold"
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
    </AnimatePresence>
  )
})

TabBar.displayName = 'TabBar'
