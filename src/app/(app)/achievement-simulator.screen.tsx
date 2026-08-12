import { TabHeader } from '@/components/common/tab-header.component'
import { AchievementModal } from '@/components/custom/achievement/achievement-modal.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { Achievement } from '@/shared/api/achievement.api'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { Icon } from '@iconify/react'
import { useState } from 'react'

// Sample achievements based on badge definitions
const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  // Streak Milestones
  {
    id: '1',
    userId: 'demo',
    goalId: 'demo-goal',
    type: 'streak_milestone',
    milestone: 3,
    title: 'Rising Star',
    description: 'Reached 3 consecutive days',
    badgeIcon: '⭐',
    earnedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'demo',
    goalId: 'demo-goal',
    type: 'streak_milestone',
    milestone: 7,
    title: 'Week Warrior',
    description: 'Completed a full week streak',
    badgeIcon: '🗡️',
    earnedAt: new Date().toISOString(),
  },
  {
    id: '3',
    userId: 'demo',
    goalId: 'demo-goal',
    type: 'streak_milestone',
    milestone: 21,
    title: 'Habit Hero',
    description: 'Reached 21 days - a true habit formed',
    badgeIcon: '🦸',
    earnedAt: new Date().toISOString(),
  },
  {
    id: '4',
    userId: 'demo',
    goalId: 'demo-goal',
    type: 'streak_milestone',
    milestone: 30,
    title: 'Month Master',
    description: 'Dominated an entire month',
    badgeIcon: '👑',
    earnedAt: new Date().toISOString(),
  },
  {
    id: '5',
    userId: 'demo',
    goalId: 'demo-goal',
    type: 'streak_milestone',
    milestone: 100,
    title: 'Century Champion',
    description: '100 days of unstoppable dedication',
    badgeIcon: '🏆',
    earnedAt: new Date().toISOString(),
  },
  // Total Goals
  {
    id: '6',
    userId: 'demo',
    type: 'total_goals',
    milestone: 3,
    title: 'Goal Getter',
    description: 'Completed 3 goals',
    badgeIcon: '🎯',
    earnedAt: new Date().toISOString(),
  },
  {
    id: '7',
    userId: 'demo',
    type: 'total_goals',
    milestone: 10,
    title: 'Goal Grandmaster',
    description: 'Mastered 10 goals',
    badgeIcon: '🔥',
    earnedAt: new Date().toISOString(),
  },
  // Total Check-ins
  {
    id: '8',
    userId: 'demo',
    type: 'total_checkins',
    milestone: 50,
    title: 'Dedication Dynamo',
    description: '50 total check-ins across all goals',
    badgeIcon: '⚡',
    earnedAt: new Date().toISOString(),
  },
  {
    id: '9',
    userId: 'demo',
    type: 'total_checkins',
    milestone: 100,
    title: 'Consistency Champion',
    description: '100 total check-ins - you\'re unstoppable',
    badgeIcon: '👑',
    earnedAt: new Date().toISOString(),
  },
  // Special Achievements
  {
    id: '10',
    userId: 'demo',
    goalId: 'demo-goal',
    type: 'perfect_week',
    milestone: 1,
    title: 'Flawless Week',
    description: '7 consecutive check-ins without a miss',
    badgeIcon: '✨',
    earnedAt: new Date().toISOString(),
  },
  {
    id: '11',
    userId: 'demo',
    goalId: 'demo-goal',
    type: 'comeback',
    milestone: 1,
    title: 'Phoenix Rising',
    description: 'Bounced back after a streak reset',
    badgeIcon: '🦅',
    earnedAt: new Date().toISOString(),
  },
  {
    id: '12',
    userId: 'demo',
    goalId: 'demo-goal',
    type: 'early_bird',
    milestone: 1,
    title: 'Dawn Warrior',
    description: 'Checked in before 9 AM',
    badgeIcon: '☀️',
    earnedAt: new Date().toISOString(),
  },
  {
    id: '13',
    userId: 'demo',
    goalId: 'demo-goal',
    type: 'night_owl',
    milestone: 1,
    title: 'Night Guardian',
    description: 'Checked in after 9 PM',
    badgeIcon: '🌙',
    earnedAt: new Date().toISOString(),
  },
]

export default function AchievementSimulatorScreen() {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)

  const handleShowModal = (achievement: Achievement) => {
    setSelectedAchievement(achievement)
  }

  const handleDismiss = () => {
    setSelectedAchievement(null)
  }

  // Group achievements by type
  const groupedAchievements = SAMPLE_ACHIEVEMENTS.reduce(
    (acc, achievement) => {
      const type = achievement.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(achievement)
      return acc
    },
    {} as Record<string, Achievement[]>
  )

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      streak_milestone: 'Streak Milestones',
      total_goals: 'Goals Completed',
      total_checkins: 'Total Check-ins',
      perfect_week: 'Perfect Week',
      comeback: 'Comeback',
      early_bird: 'Early Bird',
      night_owl: 'Night Owl',
    }
    return labels[type] || type
  }

  return (
    <View className="flex-1 bg-cardd">
      <TabHeader title="Achievement Simulator" />

      <View className="flex-1 px-4 pb-[120px] pt-6 max-w-4xl mx-auto overflow-y-auto">
        <View className="mb-6">
          <Text className="text-white/60 text-sm font-bbh mb-4">
            Tap any achievement below to see the modal animation
          </Text>
        </View>

        {/* Achievement Groups */}
        <View className="space-y-8">
          {Object.entries(groupedAchievements).map(([type, achievements]) => (
            <View key={type}>
              <Text className="text-white text-xl font-bbh font-bold mb-4">
                {getTypeLabel(type)}
              </Text>
              <View className="grid grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <Button
                    key={achievement.id}
                    onClick={() => handleShowModal(achievement)}
                    className="!bg-card-700/40 !border-2 !border-white/10 hover:!border-primary-500/50 transition-all"
                  >
                    <View className="flex flex-col items-center gap-3 p-4">
                      <Icon
                        icon={getEmojiIcon(achievement.badgeIcon)}
                        className="text-white"
                        style={{ fontSize: '48px' }}
                      />
                      <View className="items-center">
                        <Text className="text-white font-bbh font-bold text-sm text-center">
                          {achievement.title}
                        </Text>
                        <Text className="text-white/60 text-xs font-bbh text-center mt-1">
                          {achievement.description}
                        </Text>
                        {achievement.type === 'streak_milestone' && (
                          <View className="mt-2 bg-accent-500/20 border border-accent-400/30 rounded-full px-3 py-1">
                            <Text className="text-accent-300 font-bbh font-bold text-xs">
                              Day {achievement.milestone}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Button>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Achievement Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md">
            <AchievementModal
              achievement={selectedAchievement}
              onDismiss={handleDismiss}
            />
          </div>
        </div>
      )}
    </View>
  )
}
