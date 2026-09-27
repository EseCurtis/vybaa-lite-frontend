import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useAchievements,
  useAchievementStats,
  useBadgeDefinitions,
} from '@/hooks/use-achievements.hook'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import type { Achievement, BadgeDefinition } from '@/shared/api/achievement.api'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { cn } from '@/shared/utils/helpers.util'
import { Icon } from '@iconify/react'
import { RiFilter3Line } from '@remixicon/react'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'

type BadgeStatusFilter = 'all' | 'earned' | 'locked'
type BadgeQuickFilter = 'all' | 'recent' | 'locked'

interface AchievementFilters {
  quick: BadgeQuickFilter
  status: BadgeStatusFilter
  type: string
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getTypeInfo(type: string): { icon: string; title: string } {
  const typeInfo: Record<string, { icon: string; title: string }> = {
    streak_milestone: { icon: '🔥', title: 'Streak Milestones' },
    total_goals: { icon: '🎯', title: 'Goals Completed' },
    total_checkins: { icon: '✨', title: 'Total Check-ins' },
    perfect_week: { icon: '✨', title: 'Perfect Weeks' },
    comeback: { icon: '🦅', title: 'Comeback Stories' },
    early_bird: { icon: '☀️', title: 'Early Bird' },
    night_owl: { icon: '🌙', title: 'Night Owl' },
  }
  return typeInfo[type] || { icon: '🏆', title: type }
}

function BadgeCard({
  badge,
  isEarned,
  earnedDate,
  onPress,
}: {
  badge: BadgeDefinition
  isEarned: boolean
  earnedDate?: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityLabel={`${badge.title}, ${isEarned ? 'earned' : 'locked'}`}
      onPress={onPress}
      className="block w-full rounded-[40px]"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.97 }}
        className="rounded-[40px] flex flex-col items-center justify-center bg-cardx pb-5 pt-2 aspect-square"
      >
        {/* Locked Indicator */}
        {!isEarned && (
          <View className="flex items-center justify-center ">
            <View className="mt-2 px-3 py-1 bg-warning-yellow/20 rounded-full">
              <Text className="text-xs text-warning-yellow/70 font-bbh">
                {' '}
                Locked
              </Text>
            </View>
          </View>
        )}

        {/* Badge Icon */}
        <View className="flex items-center justify-center mb-2">
          <View
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isEarned ? '' : 'bg-cardx'
            }`}
          >
            <Icon
              icon={getEmojiIcon(badge.badgeIcon)}
              className={`text-card-lighter ${!isEarned && 'opacity-30 grayscale'}`}
              style={{ fontSize: '48px' }}
            />
          </View>
        </View>

        {/* Badge Info */}
        <View className="items-center w-full space-y-2">
          <View className=" flex flex-col items-center justify-center">
            {' '}
            <Text
              className={`font-bbh text-xs flex mx-auto w-full font-bold !text-center ${
                isEarned ? 'text-card-lighter' : 'text-card-lighter/40'
              }`}
            >
              {badge.title}
            </Text>
          </View>
          <Text
            className={`text-xs hidden text-center font-bbh ${
              isEarned ? 'text-card-lighter/70' : 'text-card-lighter/30'
            }`}
          >
            {badge.description}
          </Text>

          {/* Earned Date */}
          {isEarned && earnedDate && (
            <Text className="text-xs hidden text-warning-yellow font-bbh mt-2">
              @{formatDate(earnedDate)}
            </Text>
          )}
        </View>
      </motion.div>
    </Pressable>
  )
}

function BadgeDetailsSheet({
  badge,
  achievement,
}: {
  badge: BadgeDefinition
  achievement?: Achievement
}) {
  const isEarned = Boolean(achievement)

  return (
    <View className="items-center pb-2 pt-3">
      <View
        className={cn(
          'h-28 w-28 items-center justify-center rounded-full bg-cardx',
          !isEarned && 'grayscale opacity-50',
        )}
      >
        <Icon
          icon={getEmojiIcon(badge.badgeIcon)}
          className="text-card-lighter"
          style={{ fontSize: '68px' }}
        />
      </View>

      <Text className="mt-5 text-center text-2xl font-display font-bold text-card-lighter">
        {badge.title}
      </Text>
      <Text className="muted mt-2 px-2 text-center text-sm leading-6">
        {badge.description}
      </Text>

      <View className="mt-6 w-full rounded-2xl bg-cardx px-4 py-4">
        <Text className="text-xs font-bold uppercase text-card-lighter-3/60">
          Status
        </Text>
        <Text
          className={cn(
            'mt-1 text-base font-bold',
            isEarned ? 'text-success-green' : 'text-warning-yellow',
          )}
        >
          {isEarned ? 'Earned' : 'Locked'}
        </Text>
        {achievement?.earnedAt && (
          <Text className="muted mt-1 text-sm">
            Earned {formatDate(achievement.earnedAt)}
          </Text>
        )}
      </View>
    </View>
  )
}

function FilterOption({
  active,
  label,
  onPress,
}: {
  active: boolean
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'px-4 py-2 rounded-full bg-card-light/20',
        active && 'bg-white',
      )}
    >
      <Text
        className={cn(
          'text-xs font-bbh',
          active ? 'text-black font-bold' : 'text-white/70',
        )}
      >
        {label}
      </Text>
    </Pressable>
  )
}

function AchievementsFilterSheet({
  filters,
  onChange,
  onClear,
  types,
}: {
  filters: AchievementFilters
  onChange: (filters: AchievementFilters) => void
  onClear: () => void
  types: Array<{ label: string; value: string }>
}) {
  const [draftFilters, setDraftFilters] = useState(filters)
  const updateFilters = (nextFilters: AchievementFilters) => {
    setDraftFilters(nextFilters)
    onChange(nextFilters)
  }
  const clearFilters = () => {
    const nextFilters: AchievementFilters = {
      quick: 'all',
      status: 'all',
      type: 'all',
    }
    setDraftFilters(nextFilters)
    onClear()
  }

  return (
    <View className="space-y-6">
      <View className="space-y-3">
        <Text className="text-white/70 text-xs font-bbh">View</Text>
        <View className="flex-row flex-wrap gap-2">
          {(
            [
              ['all', 'All'],
              ['recent', 'Recent'],
              ['locked', 'Locked'],
            ] as const
          ).map(([value, label]) => (
            <FilterOption
              key={value}
              active={draftFilters.quick === value}
              label={label}
              onPress={() => updateFilters({ ...draftFilters, quick: value })}
            />
          ))}
        </View>
      </View>

      <View className="space-y-3">
        <Text className="text-white/70 text-xs font-bbh">Earned status</Text>
        <View className="flex-row flex-wrap gap-2">
          {(
            [
              ['all', 'All'],
              ['earned', 'Earned'],
              ['locked', 'Locked'],
            ] as const
          ).map(([value, label]) => (
            <FilterOption
              key={value}
              active={draftFilters.status === value}
              label={label}
              onPress={() => updateFilters({ ...draftFilters, status: value })}
            />
          ))}
        </View>
      </View>

      <View className="space-y-3">
        <Text className="text-white/70 text-xs font-bbh">Badge type</Text>
        <View className="flex-row flex-wrap gap-2">
          <FilterOption
            active={draftFilters.type === 'all'}
            label="All"
            onPress={() => updateFilters({ ...draftFilters, type: 'all' })}
          />
          {types.map((type) => (
            <FilterOption
              key={type.value}
              active={draftFilters.type === type.value}
              label={type.label}
              onPress={() =>
                updateFilters({ ...draftFilters, type: type.value })
              }
            />
          ))}
        </View>
      </View>

      <Pressable
        onPress={clearFilters}
        className="w-full rounded-full bg-card-light/20 py-3 items-center justify-center"
      >
        <Text className="text-white text-sm font-bbh font-bold">
          Clear filters
        </Text>
      </Pressable>
    </View>
  )
}

export default function AchievementsScreen() {
  const bottomSheet = useBottomSheetController()
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

  const achievementsById = useMemo(() => {
    return new Map(
      achievements.map((achievement) => [achievement.id, achievement]),
    )
  }, [achievements])

  const recentKeys = useMemo(() => {
    return new Set(
      [...achievements]
        .sort(
          (a, b) =>
            new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime(),
        )
        .slice(0, 8)
        .map((badge) => `${badge.type}-${badge.milestone}`),
    )
  }, [achievements])

  const [filters, setFilters] = useState<AchievementFilters>({
    quick: 'all',
    status: 'all',
    type: 'all',
  })

  // Group badges by type
  const badgesByType = useMemo(() => {
    const grouped: Record<string, BadgeDefinition[]> = {}
    definitions.forEach((def) => {
      const key = `${def.type}-${def.milestone}`
      const earned = earnedMap.has(key)
      if (filters.type !== 'all' && filters.type !== def.type) return
      if (filters.status === 'earned' && !earned) return
      if (filters.status === 'locked' && earned) return
      if (filters.quick === 'recent' && !recentKeys.has(key)) return
      if (filters.quick === 'locked' && earned) return

      if (!grouped[def.type]) {
        grouped[def.type] = []
      }
      grouped[def.type].push(def)
    })
    return grouped
  }, [definitions, earnedMap, filters, recentKeys])

  const badgeTypes = useMemo(() => {
    return Array.from(new Set(definitions.map((def) => def.type))).map(
      (type) => ({
        label: getTypeInfo(type).title,
        value: type,
      }),
    )
  }, [definitions])

  const loading = achievementsLoading || statsLoading || defsLoading

  const clearFilters = () => {
    setFilters({ quick: 'all', status: 'all', type: 'all' })
  }

  const openFilters = () => {
    bottomSheet.present(
      <AchievementsFilterSheet
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
        types={badgeTypes}
      />,
      { title: 'Filter badges', elevation: 9999 },
    )
  }

  const openBadgeDetails = (
    badge: BadgeDefinition,
    achievement?: Achievement,
  ) => {
    bottomSheet.present(
      <BadgeDetailsSheet achievement={achievement} badge={badge} />,
      { title: achievement ? 'Badge earned' : 'Badge details' },
    )
  }

  return (
    <View className="flex-1 min-h-0 absolute top-0 left-0 size-full bg-cardd ">
      <TabHeader
        title={
          <View>
            Achievements
            {stats && (
              <Text className="!text-card-lighter/70 text-sm  font-bbh mb-2">
                {stats.totalBadges}{' '}
                {stats.totalBadges === 1 ? 'badge' : 'badges'} earned
              </Text>
            )}
          </View>
        }
      >
        <Pressable
          onPress={openFilters}
          className="w-12 h-12 rounded-full bg-card-light/20 items-center justify-center"
        >
          <RiFilter3Line size={20} className="text-white" />
        </Pressable>
      </TabHeader>

      <View
        className="min-h-0 flex-1 px-4 pb-[120px] pt-6  max-w-4xl mx-auto overflow-y-auto"
        style={{ height: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        {/* Stats Cards */}
        {stats && stats.totalBadges > 0 && (
          <View className="mb-8">
            <Text className="text-card-lighter text-xl font-bbh font-bold mb-4">
              Recent Achievements
            </Text>
            <View className="flex flex-row gap-3 overflow-x-auto pb-2 no-scrollbar">
              {stats.recentBadges.map((badge, index) => (
                <Pressable
                  key={badge.id}
                  className="shrink-0"
                  onPress={() => {
                    const achievement = achievementsById.get(badge.id)
                    if (achievement) openBadgeDetails(achievement, achievement)
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <View className="bg-cardx rounded-2xl p-4 flex flex-row items-center gap-3 min-w-[200px]">
                      <View className="p-1">
                        <Icon
                          icon={getEmojiIcon(badge.badgeIcon)}
                          className="text-card-lighter"
                          style={{ fontSize: '36px' }}
                        />
                      </View>
                      <View>
                        <Text className="text-card-lighter font-bbh font-bold text-sm">
                          {badge.title}
                        </Text>
                        <Text className="text-warning-yellow hidden text-xs font-bbh">
                          @{formatDate(badge.earnedAt)}
                        </Text>
                      </View>
                    </View>
                  </motion.div>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* All Badges */}
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-card-lighter/60 text-lg font-bbh">
              Loading achievements...
            </Text>
          </View>
        ) : Object.keys(badgesByType).length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Icon
              icon={getEmojiIcon('🏆')}
              className="text-card-lighter/60 mb-4"
              style={{ fontSize: '64px' }}
            />
            <Text className="text-card-lighter/60 text-lg font-bbh text-center">
              No badges match these filters
            </Text>
            <Text className="text-card-lighter/40 text-sm font-bbh text-center mt-2">
              Clear filters or keep checking in to unlock more badges.
            </Text>
          </View>
        ) : (
          <View className="space-y-8">
            {Object.entries(badgesByType).map(([type, badges]) => {
              const typeInfo = getTypeInfo(type)
              return (
                <View key={type} className="border-b pb-3 border-card-light/20">
                  <View className="flex flex-row items-center justify-center gap-2 mb-4">
                    <Text className="text-card-lighter text-xl font-bbh font-bold">
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
                          onPress={() => openBadgeDetails(badge, earned)}
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
