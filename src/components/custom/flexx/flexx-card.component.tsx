import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { Avatar } from '@/components/user/avatar.component'
import type { Achievement } from '@/shared/api/achievement.api'
import type { RewindInsights } from '@/shared/api/rewind.api'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { Icon } from '@iconify/react'
import {
  RiFireFill,
  RiFlashlightFill,
  RiHeart2Line,
  RiTrophyFill,
} from '@remixicon/react'
import { motion } from 'framer-motion'

export type CardType = 'daily' | 'weekly' | 'streak' | 'achievement' | 'rewind'

export type FlexxStats = {
  totalGoals: number
  totalCheckIns: number
  currentStreak: number
  longestStreak: number
  completionRate: number
  averageProgress: number
}

export interface FlexxCardProps {
  type: CardType
  data: FlexxStats
  username?: string
  userAvatarUrl?: string
  achievement?: Achievement | null
  rewind?: RewindInsights | null
}

export function FlexxCard({
  type,
  data,
  username,
  userAvatarUrl,
  achievement,
  rewind,
}: FlexxCardProps) {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const getGradient = () => {
    switch (type) {
      case 'daily':
        return 'from-purple-600 via-purple-700 to-indigo-900'
      case 'weekly':
        return 'from-emerald-600 via-teal-700 to-cyan-900'
      case 'streak':
        return 'from-orange-600 via-red-700 to-pink-900'
      case 'achievement':
        return 'from-yellow-600 via-amber-700 to-orange-900'
      case 'rewind':
        return 'from-pink-700 via-rose-800 to-teal-950'
      default:
        return 'from-purple-600 via-purple-700 to-indigo-900'
    }
  }

  const getIcon = (size: number = 40) => {
    if (type === 'achievement' && achievement) {
      const emojiIcon = getEmojiIcon(achievement.badgeIcon)
      return <Icon icon={emojiIcon} width={size} height={size} />
    }

    switch (type) {
      case 'daily':
        return <RiFlashlightFill size={size} className="text-white/90" />
      case 'weekly':
        return <RiTrophyFill size={size} className="text-white/90" />
      case 'streak':
        return <RiFireFill size={size} className="text-white/90" />
      case 'rewind':
        return <RiHeart2Line size={size} className="text-white/90" />
      default:
        return <RiTrophyFill size={size} className="text-white/90" />
    }
  }

  // Dynamic font sizing based on number length for scalability
  const getHeroFontSize = (value: number) => {
    const digits = value.toString().length
    if (digits <= 2) return 'text-[70px]' // 0-99
    if (digits === 3) return 'text-[60px]' // 100-999
    return 'text-[50px]' // 1000+
  }

  const getStreakFontSize = (value: number) => {
    const digits = value.toString().length
    if (digits <= 2) return 'text-[110px]' // 0-99
    if (digits === 3) return 'text-[90px]' // 100-999
    return 'text-[50px]' // 1000+
  }

  const getGridFontSize = (value: number | string) => {
    const str = value.toString()
    if (str.length <= 2) return 'text-6xl' // 0-99
    if (str.length === 3) return 'text-5xl' // 100-999
    return 'text-4xl' // 1000+
  }

  // Different layouts for each card type
  if (type === 'daily') {
    return (
      <View className="size-full relative overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getGradient()}`}
        />
        <div
          style={{
            background: 'url(/assets/framernoise.png)',
            backgroundSize: '300px',
            opacity: 0.15,
            mixBlendMode: 'overlay',
          }}
          className="absolute inset-0"
        />

        {/* Minimal/Clean Layout */}
        <View className="relative z-10 flex-1 p-6 size-full flex flex-col">
          {/* Top Corner - Date & Icon */}
          <View className="flex-row justify-between items-start mb-8">
            <Text className="text-white/50 text-sm font-bbh">{today}</Text>
            {getIcon()}
          </View>

          {/* Center - Hero Stat */}
          <View className="flex-1 justify-center items-center">
            <Text className="text-white/60 text-xs font-bbh uppercase tracking-[0.2em] mb-4">
              Today's Discipline
            </Text>
            <Text
              className={`text-white ${getHeroFontSize(data.totalCheckIns)} leading-none font-bbh font-bold mb-2`}
            >
              {data.totalCheckIns}
            </Text>
            <Text className="text-white/80 text-lg font-bbh tracking-wide">
              check-ins
            </Text>

            {/* Secondary Stats - Flexible width */}
            <View className="mt-16 space-y-3 w-full max-w-[85%]">
              <View className="flex-row justify-between items-center gap-4">
                <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide flex-shrink-0">
                  Goals
                </Text>
                <Text className="text-white text-2xl font-bbh font-bold text-right flex-shrink">
                  {data.totalGoals}
                </Text>
              </View>
              <View className="h-px bg-white/10" />
              <View className="flex-row justify-between items-center gap-4">
                <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide flex-shrink-0">
                  Streak
                </Text>
                <Text className="text-white text-2xl font-bbh font-bold text-right flex-shrink">
                  {data.currentStreak} days
                </Text>
              </View>
              <View className="h-px bg-white/10" />
              <View className="flex-row justify-between items-center gap-4">
                <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide flex-shrink-0">
                  Completion
                </Text>
                <Text className="text-white text-2xl font-bbh font-bold text-right flex-shrink">
                  {Math.round(data.completionRate)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom - User Info */}
          <View className="flex-row items-center justify-between pt-4">
            <View className="flex-row gap-3 items-center">
              {userAvatarUrl && <Avatar url={userAvatarUrl} size={40} />}
              <View>
                {username && (
                  <Text className="text-white text-base font-bbh font-semibold">
                    @{username}
                  </Text>
                )}
                <Text className="text-white/40 text-xs font-bbh">
                  Made with Vybaa
                </Text>
              </View>
            </View>
            <View className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <img
                src="/assets/icon-foreground.png"
                className="w-6 h-6 brightness-[100]"
                alt="Vybaa"
              />
            </View>
          </View>
        </View>
      </View>
    )
  }

  if (type === 'weekly') {
    return (
      <View className="size-full relative overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getGradient()}`}
        />
        <div
          style={{
            background: 'url(/assets/framernoise.png)',
            backgroundSize: '300px',
            opacity: 0.15,
            mixBlendMode: 'overlay',
          }}
          className="absolute inset-0"
        />

        {/* Grid Layout */}
        <View className="relative z-10 flex-1 p-6 size-full flex flex-col">
          {/* Header */}
          <View className="flex-col text-center justify-center items-center mb-10">
            <View className="flex-col gap-3 items-center">
              {getIcon()}
              <Text className="text-white text-2xl font-bbh font-bold leading-tight">
                Weekly{'\n'}Flexx
              </Text>
            </View>
            <Text className="text-white/50 text-sm font-bbh">{today}</Text>
          </View>

          {/* Stats Grid - 2x2 with responsive sizing */}
          <View className="flex-1 grid grid-cols-2 gap-3 mb-8">
            <View className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
              <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide mb-2">
                Total Goals
              </Text>
              <Text
                className={`text-white ${getGridFontSize(data.totalGoals)} font-bbh font-bold leading-none `}
              >
                {data.totalGoals}
              </Text>
            </View>

            <View className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
              <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide mb-2">
                Check-ins
              </Text>
              <Text
                className={`text-white ${getGridFontSize(data.totalCheckIns)} font-bbh font-bold leading-none `}
              >
                {data.totalCheckIns}
              </Text>
            </View>

            <View className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
              <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide mb-2">
                Progress
              </Text>
              <Text
                className={`text-white ${getGridFontSize(data.averageProgress)} font-bbh font-bold leading-none`}
              >
                {Math.round(data.averageProgress)}
                <span className="text-2xl">%</span>
              </Text>
            </View>

            <View className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
              <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide mb-2">
                Streak
              </Text>
              <Text
                className={`text-white ${getGridFontSize(data.currentStreak)} font-bbh font-bold leading-none break-all`}
              >
                {data.currentStreak}
                <span className="text-xl">d</span>
              </Text>
            </View>
          </View>

          {/* Bottom */}
          <View className="flex-row items-center justify-between border-t border-white/10 pt-5">
            <View className="flex-row gap-3 items-center">
              {userAvatarUrl && <Avatar url={userAvatarUrl} size={36} />}
              <View>
                {username && (
                  <Text className="text-white text-base font-bbh font-semibold">
                    @{username}
                  </Text>
                )}
                <Text className="text-white/40 text-xs font-bbh">
                  Made with Vybaa
                </Text>
              </View>
            </View>
            <View className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <img
                src="/assets/icon-foreground.png"
                className="w-6 h-6 brightness-[100]"
                alt="Vybaa"
              />
            </View>
          </View>
        </View>
      </View>
    )
  }

  if (type === 'streak') {
    return (
      <View className="size-full relative overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getGradient()}`}
        />
        <div
          style={{
            background: 'url(/assets/framernoise.png)',
            backgroundSize: '300px',
            opacity: 0.15,
            mixBlendMode: 'overlay',
          }}
          className="absolute inset-0"
        />

        {/* Dramatic Center-Focused Layout */}
        <View className="relative z-10 flex-1 size-full flex flex-col p-6">
          {/* Top Corner Info */}
          <View className="flex-row justify-between items-center mb-6">
            {getIcon()}
            <Text className="text-white/50 text-sm font-bbh">{today}</Text>
          </View>

          {/* Massive Center Streak */}
          <View className="flex-1 justify-center items-center -mt-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center flex flex-col items-center w-full px-4"
            >
              <Text className="text-white/60 text-xs font-bbh uppercase tracking-[0.3em] mb-4">
                Current Streak
              </Text>
              <Text
                className={`text-white ${getStreakFontSize(data.currentStreak)} leading-none font-bbh font-bold break-all`}
              >
                {data.currentStreak}
              </Text>
              <Text className="text-white text-5xl font-bbh font-bold mt-3 tracking-wider">
                DAYS
              </Text>
            </motion.div>

            {/* Mini Stats Row - Flexible */}
            <View className="flex-row items-stretch justify-between w-full max-w-[90%] mt-20 gap-3">
              <View className="text-center flex-1 flex flex-col items-center">
                <Text
                  className={`text-white ${getGridFontSize(data.longestStreak)} font-bbh font-bold leading-none break-all`}
                >
                  {data.longestStreak}
                </Text>
                <Text className="text-white/60 text-[10px] font-bbh uppercase mt-2 tracking-wide">
                  Best
                </Text>
              </View>

              <View className="w-px self-stretch bg-white/20 my-1" />

              <View className="text-center flex-1 flex flex-col items-center">
                <Text
                  className={`text-white ${getGridFontSize(data.totalCheckIns)} font-bbh font-bold leading-none `}
                >
                  {data.totalCheckIns}
                </Text>
                <Text className="text-white/60 text-[10px] font-bbh uppercase mt-2 tracking-wide">
                  Total
                </Text>
              </View>

              <View className="w-px self-stretch bg-white/20 my-1" />

              <View className="text-center flex-1 flex flex-col items-center">
                <Text
                  className={`text-white ${getGridFontSize(data.completionRate)} font-bbh font-bold leading-none break-all`}
                >
                  {Math.round(data.completionRate)}
                  <span className="text-xl">%</span>
                </Text>
                <Text className="text-white/60 text-[10px] font-bbh uppercase mt-2 tracking-wide">
                  Score
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom */}
          <View className="flex-row items-center justify-between pt-4">
            <View className="flex-row gap-3 items-center">
              {userAvatarUrl && <Avatar url={userAvatarUrl} size={36} />}
              <View>
                {username && (
                  <Text className="text-white text-base font-bbh font-semibold">
                    @{username}
                  </Text>
                )}
                <Text className="text-white/40 text-xs font-bbh">
                  Streak Power • Vybaa
                </Text>
              </View>
            </View>
            <View className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <img
                src="/assets/icon-foreground.png"
                className="w-6 h-6 brightness-[100]"
                alt="Vybaa"
              />
            </View>
          </View>
        </View>
      </View>
    )
  }

  if (type === 'achievement') {
    if (!achievement) {
      return (
        <View className="size-full relative overflow-hidden">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${getGradient()}`}
          />
          <div
            style={{
              background: 'url(/assets/framernoise.png)',
              backgroundSize: '300px',
              opacity: 0.15,
              mixBlendMode: 'overlay',
            }}
            className="absolute inset-0"
          />
          <View className="relative z-10 flex-1 size-full flex flex-col items-center justify-center p-8">
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <RiTrophyFill size={80} className="text-white/40 mb-6" />
            </motion.div>
            <Text className="text-white/70 text-xl font-bbh text-center font-semibold mb-2">
              Tap to Select
            </Text>
            <Text className="text-white/50 text-sm font-bbh text-center">
              Choose an achievement to flex
            </Text>
          </View>
        </View>
      )
    }

    const earnedDate = new Date(achievement.earnedAt).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      },
    )

    return (
      <View className="size-full relative overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getGradient()}`}
        />
        <div
          style={{
            background: 'url(/assets/framernoise.png)',
            backgroundSize: '300px',
            opacity: 0.15,
            mixBlendMode: 'overlay',
          }}
          className="absolute inset-0"
        />

        {/* Achievement Badge Layout */}
        <View className="relative z-10 flex-1 size-full flex flex-col p-6">
          {/* Top */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white/60 text-xs font-bbh uppercase tracking-[0.2em]">
              Achievement Unlocked
            </Text>
            <Text className="text-white/50 text-sm font-bbh">{earnedDate}</Text>
          </View>

          {/* Center - Badge */}
          <View className="flex-1 justify-center items-center">
            {/* Large Badge with Glow and Wiggle Animation */}
            <motion.div
              key={achievement.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                rotate: [0, -3, 3, -3, 0],
                y: [0, -10, 0, -5, 0],
              }}
              transition={{
                scale: { duration: 0.6, type: 'spring', stiffness: 200 },
                opacity: { duration: 0.4 },
                rotate: { duration: 0.8, ease: 'easeInOut', delay: 0.3 },
                y: { duration: 0.8, ease: 'easeInOut', delay: 0.3 },
              }}
              className="relative mb-8"
            >
              {/* Animated Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 bg-yellow-400/30 rounded-full blur-3xl scale-150"
              />

              <View className="relative z-10 flex items-center justify-center">
                <Icon
                  icon={getEmojiIcon(achievement.badgeIcon)}
                  width={160}
                  height={160}
                />
              </View>
            </motion.div>

            {/* Title */}
            <Text className="text-white text-4xl font-bbh font-bold text-center mb-3 leading-tight">
              {achievement.title}
            </Text>

            {/* Description */}
            <Text className="text-white/70 text-base font-bbh text-center max-w-[85%] leading-relaxed">
              {achievement.description}
            </Text>

            {/* Milestone Badge */}
            <View className="mt-8 bg-white backdrop-blur-sm rounded-full px-6 py-3">
              <Text className="text-black text-lg font-bbh font-bold">
                {achievement.type === 'streak_milestone' &&
                  `${achievement.milestone} Day Streak`}
                {achievement.type === 'total_goals' &&
                  `${achievement.milestone} Goals`}
                {achievement.type === 'total_checkins' &&
                  `${achievement.milestone} Check-ins`}
                {achievement.type === 'perfect_week' && 'Perfect Week'}
                {achievement.type === 'comeback' && 'Comeback'}
                {achievement.type === 'early_bird' && 'Early Bird'}
                {achievement.type === 'night_owl' && 'Night Owl'}
              </Text>
            </View>
          </View>

          {/* Bottom */}
          <View className="flex-row items-center justify-between pt-4 border-t border-white/10">
            <View className="flex-row gap-3 items-center">
              {userAvatarUrl && <Avatar url={userAvatarUrl} size={36} />}
              <View>
                {username && (
                  <Text className="text-white text-base font-bbh font-semibold">
                    @{username}
                  </Text>
                )}
                <Text className="text-white/40 text-xs font-bbh">
                  Achievement • Vybaa
                </Text>
              </View>
            </View>
            <View className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <img
                src="/assets/icon-foreground.png"
                className="w-6 h-6 brightness-[100]"
                alt="Vybaa"
              />
            </View>
          </View>
        </View>
      </View>
    )
  }

  if (type === 'rewind') {
    const completedSessions = rewind?.coverage.completedSessions ?? 0
    const consistency = rewind?.progress?.consistency ?? 0
    const reflection =
      rewind?.contextualInsight ??
      'A little reflection can reveal what your days are asking for.'

    return (
      <View className="size-full relative overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getGradient()}`}
        />
        <div
          style={{
            background: 'url(/assets/framernoise.png)',
            backgroundSize: '300px',
            opacity: 0.15,
            mixBlendMode: 'overlay',
          }}
          className="absolute inset-0"
        />

        <View className="relative z-10 flex-1 size-full flex flex-col p-6">
          <View className="flex-row items-start justify-between mb-8">
            <View>
              <Text className="text-white/50 text-sm font-bbh">
                Last 7 days
              </Text>
              <Text className="text-white text-2xl font-bbh font-bold mt-2">
                Rewind reflection
              </Text>
            </View>
            {getIcon(42)}
          </View>

          <View className="flex-1 justify-center">
            <Text className="text-white/60 text-xs font-bbh uppercase tracking-[0.2em] mb-4">
              Sessions completed
            </Text>
            <Text
              className={`text-white ${getHeroFontSize(completedSessions)} leading-none font-bbh font-bold`}
            >
              {completedSessions}
            </Text>
            <Text className="text-white/80 text-lg font-bbh mt-2">
              moments made to notice yourself
            </Text>

            <View className="mt-14 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide">
                  Reflection consistency
                </Text>
                <Text className="text-white text-xl font-bbh font-bold">
                  {Math.round(consistency)}%
                </Text>
              </View>
              <View className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <View
                  className="h-full rounded-full bg-white"
                  style={{
                    width: `${Math.min(100, Math.max(0, consistency))}%`,
                  }}
                />
              </View>
            </View>

            <View className="mt-10 rounded-2xl bg-black/20 p-5">
              <Text className="text-white/50 text-xs font-bbh uppercase tracking-wide mb-2">
                What is showing up
              </Text>
              <Text className="text-white text-base font-bbh leading-6 line-clamp-3">
                {reflection}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between pt-4">
            <View className="flex-row gap-3 items-center">
              {userAvatarUrl && <Avatar url={userAvatarUrl} size={36} />}
              <View>
                {username && (
                  <Text className="text-white text-base font-bbh font-semibold">
                    @{username}
                  </Text>
                )}
                <Text className="text-white/40 text-xs font-bbh">
                  Made with Vybaa
                </Text>
              </View>
            </View>
            <View className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <img
                src="/assets/icon-foreground.png"
                className="w-6 h-6 brightness-[100]"
                alt="Vybaa"
              />
            </View>
          </View>
        </View>
      </View>
    )
  }

  // Fallback (shouldn't reach here)
  return null
}
