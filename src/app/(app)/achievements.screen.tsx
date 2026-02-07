import { TabHeader } from '@/components/common/tab-header.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useAchievements,
  useAchievementStats,
  useBadgeDefinitions,
} from '@/hooks/use-achievements.hook'
import type { Achievement, BadgeDefinition } from '@/shared/api/achievement.api'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import { useMemo } from 'react'

function BadgeCard({
  badge,
  isEarned,
  earnedDate,
}: {
  badge: BadgeDefinition
  isEarned: boolean
  earnedDate?: string
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl p-6 ${
        isEarned
          ? 'bg-gradient-to-br from-primary-500/20 to-accent-500/20 border-2 border-primary-500/30'
          : 'bg-card-700/40 border-2 border-white/5'
      }`}
    >
      {/* Badge Icon */}
      <View className="flex items-center justify-center mb-4">
        <View
          className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isEarned
              ? 'bg-gradient-to-br from-primary-500/30 to-accent-500/30'
              : 'bg-card-600/50'
          }`}
        >
          <Icon
            icon={getEmojiIcon(badge.badgeIcon)}
            className={`text-white ${!isEarned && 'opacity-30 grayscale'}`}
            style={{ fontSize: '48px' }}
          />
        </View>
      </View>

      {/* Badge Info */}
      <View className="items-center space-y-2">
        <Text
          className={`font-bbh font-bold text-center ${
            isEarned ? 'text-white' : 'text-white/40'
          }`}
        >
          {badge.title}
        </Text>
        <Text
          className={`text-sm text-center font-bbh ${
            isEarned ? 'text-white/70' : 'text-white/30'
          }`}
        >
          {badge.description}
        </Text>

        {/* Earned Date */}
        {isEarned && earnedDate && (
          <Text className="text-xs text-primary-400 font-bbh mt-2">
            Earned {formatDate(earnedDate)}
          </Text>
        )}

        {/* Locked Indicator */}
        {!isEarned && (
          <View className="mt-2 px-3 py-1 bg-white/5 rounded-full">
            <Text className="text-xs text-white/40 font-bbh"> Locked</Text>
          </View>
        )}
      </View>
    </motion.div>
  )
}

export default function AchievementsScreen() {
  const { data: achievements = [], isLoading: achievementsLoading } =
    useAchievements()
  const { data: stats, isLoading: statsLoading } = useAchievementStats()
  const { data: definitions = [], isLoading: defsLoading } =
    useBadgeDefinitions()

  // Create a map of earned achievements
  const earnedMap = useMemo(() => {
    const map = new Map<string, Achievement>()
    achievements.forEach((achievement) => {
      const key = `${achievement.type}-${achievement.milestone}`
      map.set(key, achievement)
    })
    return map
  }, [achievements])

  // Group badges by type
  const badgesByType = useMemo(() => {
    const grouped: Record<string, BadgeDefinition[]> = {}
    definitions.forEach((def) => {
      if (!grouped[def.type]) {
        grouped[def.type] = []
      }
      grouped[def.type].push(def)
    })
    return grouped
  }, [definitions])

  const loading = achievementsLoading || statsLoading || defsLoading

  const getTypeInfo = (type: string): { icon: string; title: string } => {
    const typeInfo: Record<string, { icon: string; title: string }> = {
      streak_milestone: { icon: '🔥', title: 'Streak Milestones' },
      total_goals: { icon: '🎯', title: 'Goals Completed' },
      total_checkins: { icon: '✨', title: 'Total Check-ins' },
      perfect_week: { icon: '✨', title: 'Perfect Weeks' },
      comeback: { icon: '🦅', title: 'Comeback Stories' },
      early_bird: { icon: '🌅', title: 'Early Bird' },
      night_owl: { icon: '🌙', title: 'Night Owl' },
    }
    return typeInfo[type] || { icon: '🏆', title: type }
  }

  return (
    <View className="flex-1 bg-cardd">
      <TabHeader
        title={
          <View >
            Achievements
            {stats && (
              <Text className="!text-white/20 text-sm font-bbh mb-2">
                {stats.totalBadges}{' '}
                {stats.totalBadges === 1 ? 'badge' : 'badges'} earned
              </Text>
            )}
          </View>
        }
      />

      <View className="flex-1 px-4 pb-[120px] pt-6 max-w-4xl mx-auto overflow-y-auto">
        {/* Stats Cards */}
        {stats && stats.totalBadges > 0 && (
          <View className="mb-8">
            <Text className="text-white text-xl font-bbh font-bold mb-4">
              Recent Achievements
            </Text>
            <View className="flex flex-row gap-3 overflow-x-auto pb-2 no-scrollbar">
              {stats.recentBadges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="shrink-0"
                >
                  <View className="bg-card-700/80 rounded-2xl p-4 flex items-center gap-3 min-w-[200px]">
                    <Icon
                      icon={getEmojiIcon(badge.badgeIcon)}
                      className="text-white"
                      style={{ fontSize: '36px' }}
                    />
                    <View>
                      <Text className="text-white font-bbh font-bold text-sm">
                        {badge.title}
                      </Text>
                      <Text className="text-white/50 text-xs font-bbh">
                        {new Date(badge.earnedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </motion.div>
              ))}
            </View>
          </View>
        )}

        {/* All Badges */}
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-white/60 text-lg font-bbh">
              Loading achievements...
            </Text>
          </View>
        ) : Object.keys(badgesByType).length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Icon
              icon={getEmojiIcon('🏆')}
              className="text-white/60 mb-4"
              style={{ fontSize: '64px' }}
            />
            <Text className="text-white/60 text-lg font-bbh text-center">
              No achievements yet
            </Text>
            <Text className="text-white/40 text-sm font-bbh text-center mt-2">
              Start checking in on your goals to earn badges!
            </Text>
          </View>
        ) : (
          <View className="space-y-8">
            {Object.entries(badgesByType).map(([type, badges]) => {
              const typeInfo = getTypeInfo(type)
              return (
                <View key={type}>
                  <View className="flex flex-row items-center gap-2 mb-4">
                    <Icon
                      icon={getEmojiIcon(typeInfo.icon)}
                      className="text-white"
                      style={{ fontSize: '24px' }}
                    />
                    <Text className="text-white text-xl font-bbh font-bold">
                      {typeInfo.title}
                    </Text>
                  </View>
                  <View className="grid grid-cols-2 gap-4">
                    {badges.map((badge) => {
                      const key = `${badge.type}-${badge.milestone}`
                      const earned = earnedMap.get(key)
                      return (
                        <BadgeCard
                          key={key}
                          badge={badge}
                          isEarned={!!earned}
                          earnedDate={earned?.earnedAt}
                        />
                      )
                    })}
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </View>
    </View>
  )
}
