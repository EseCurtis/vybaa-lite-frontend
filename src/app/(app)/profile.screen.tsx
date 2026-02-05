import { TopNotchPadd } from '@/components/common/notch.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useGoalOperations } from '@/hooks/use-goals.hook'
import { useAuth } from '@/providers/auth.provider'
import {
  RiArrowRightSLine,
  RiBarChartBoxLine,
  RiGroupLine,
  RiLogoutBoxRLine,
  RiQuestionLine,
  RiSettings3Line
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useMemo } from 'react'

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { goals } = useGoalOperations(1, 100) // Get first 100 for progress calculation

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || user.email
    : 'User'

  const initials = user
    ? [user.firstName?.[0], user.lastName?.[0]]
        .filter(Boolean)
        .join('')
        .toUpperCase() ||
      user.username?.[0]?.toUpperCase() ||
      user.email[0].toUpperCase()
    : 'U'

  // Calculate overall progress for ring
  const overallProgress = useMemo(() => {
    if (!goals.length) return 0
    const totalProgress = goals.reduce((sum, goal) => {
      return sum + (goal.currentDay / goal.targetDays) * 100
    }, 0)
    return Math.round(totalProgress / goals.length)
  }, [goals])

  const hasProgress = goals.length > 0
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - overallProgress / 100)

  return (
    <View className="flex-1 bg-cardd overflow-y-auto no-scrollbar">
      {/* Header */}
      <TopNotchPadd />

      <View className="flex-1 px-mg pb-[120px] pt-4 space-y-8">
        {/* Profile Header with Progress Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <View className="items-center space-y-4">
            {/* Avatar with Progress Ring */}
            <View className="relative">
              {hasProgress && (
                <svg className="absolute -inset-2 w-36 h-36">
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-white/10"
                  />
                  <motion.circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    stroke="#FFD60A"
                    strokeWidth="5"
                    strokeLinecap="round"
                    className="transform -rotate-90 origin-center"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '72px 72px' }}
                  />
                </svg>
              )}
              <View className="rounded-full w-32 h-32 bg-card-light/60 flex items-center justify-center overflow-hidden relative z-10">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Text className="text-white text-4xl font-bbh font-bold">{initials}</Text>
                )}
              </View>
              {hasProgress && (
                <View className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-400 rounded-full px-3 py-1.5 shadow-lg">
                  <Text className="text-black text-sm font-bbh font-bold">
                    {overallProgress}%
                  </Text>
                </View>
              )}
            </View>

            {/* Name and Email */}
            <View className="items-center space-y-1">
              <Text className="text-white text-2xl font-bbh font-bold">{displayName}</Text>
              <Text className="text-white/50 text-sm font-bbh">{user?.email}</Text>
            </View>
          </View>
        </motion.div>

        {/* Action Cards Grid */}
        <View className="grid grid-cols-2 gap-3">
          {/* Help */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='col-span-1 bg-card-light/40 rounded-2xl'
          >
            <Pressable
              onPress={() => {}}
              className=" flex flex-col text-left p-3 rounded-2xl  space-y-3 "
            >
              <View className="w-10 h-10 rounded-xl bg-card-light/60 flex items-center justify-center">
                <RiQuestionLine size={20} className="text-white" />
              </View>
              <View>
                <Text className="text-white text-base font-bbh font-semibold">
                  Help
                </Text>
                <Text className="text-white/50 text-xs font-bbh">
                  Help is Here
                </Text>
              </View>
            </Pressable>
          </motion.div>

          {/* Insights */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
             className='col-span-1 bg-card-light/40 rounded-2xl'
          >
            <Pressable
              onPress={() => navigate({ to: '/app/sub-profile/insights' })}
              className="  flex flex-col text-left p-3 space-y-3 "
            >
              <View className="w-10 h-10 rounded-xl bg-card-light/60 flex items-center justify-center">
                <RiBarChartBoxLine size={20} className="text-white" />
              </View>
              <View>
                <Text className="text-white text-base font-bbh font-semibold">
                  Insights
                </Text>
                <Text className="text-white/50 text-xs font-bbh">
                  Progress Stats
                </Text>
              </View>
            </Pressable>
          </motion.div>

          {/* My Goals */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
             className='col-span-1 bg-card-light/40 rounded-2xl'
          >
            <Pressable
              onPress={() => navigate({ to: '/goal' })}
              className="  flex flex-col text-left p-3 space-y-3 "
            >
              <View className="w-10 h-10 rounded-xl bg-card-light/60 flex items-center justify-center">
                <RiGroupLine size={20} className="text-white" />
              </View>
              <View>
                <Text className="text-white text-base font-bbh font-semibold">
                  My Goals
                </Text>
                <Text className="text-white/50 text-xs font-bbh">
                  View All
                </Text>
              </View>
            </Pressable>
          </motion.div>

          {/* Settings */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
             className='col-span-1 bg-card-light/40 rounded-2xl'
          >
            <Pressable
              onPress={() => navigate({ to: '/app/sub-profile/settings' })}
              className="  flex flex-col text-left p-3 space-y-3 "
            >
              <View className="w-10 h-10 rounded-xl bg-card-light/60 flex items-center justify-center">
                <RiSettings3Line size={20} className="text-white" />
              </View>
              <View>
                <Text className="text-white text-base font-bbh font-semibold">
                  Settings
                </Text>
                <Text className="text-white/50 text-xs font-bbh">
                  App Settings
                </Text>
              </View>
            </Pressable>
          </motion.div>
        </View>

        {/* Menu List Items */}
        <View className="space-y-2 grid grid-cols-2 gap-3 flex-row items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
             className='col-span-1 bg-card-light/40 rounded-2xl'
          >
            <Pressable
              onPress={() => navigate({ to: '/app/sub-profile/settings' })}
              className="px-5 py-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-4">
                <RiSettings3Line size={20} className="text-white/70" />
                <Text className="text-white text-base font-bbh">
                  Settings
                </Text>
              </View>
              <RiArrowRightSLine size={20} className="text-white/40" />
            </Pressable>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
             className='col-span-1 bg-card-light/40 rounded-2xl'
          >
            <Pressable
              onPress={logout}
              className="px-5 py-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-4">
                <RiLogoutBoxRLine size={20} className="text-pink-500" />
                <Text className="text-white text-base font-bbh">
                  Logout
                </Text>
              </View>
              <RiArrowRightSLine size={20} className="text-white/40" />
            </Pressable>
          </motion.div>
        </View>
      </View>
    </View>
  )
}
