import { BottomNotch } from '@/components/common/notch.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { Avatar } from '@/components/user/avatar.component'
import { useAchievements } from '@/hooks/use-achievements.hook'
import { useBottomSheet } from '@/hooks/use-bottom-sheet.hook'
import { useFlexxExport } from '@/hooks/use-flexx-export.hook'
import { useInsights } from '@/hooks/use-insights.hook'
import { useRewindInsights } from '@/hooks/use-rewind.hook'
import { useAuth } from '@/providers/auth.provider'
import type { Achievement } from '@/shared/api/achievement.api'
import type { RewindInsights } from '@/shared/api/rewind.api'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import '@/styles/swiper-custom.css'
import { Icon } from '@iconify/react'
import {
  RiFireFill,
  RiFlashlightFill,
  RiHeart2Line,
  RiInstagramLine,
  RiTrophyFill,
  RiTwitterXLine,
  RiUpload2Fill,
  RiWhatsappLine,
} from '@remixicon/react'
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import { Swiper, SwiperSlide } from 'swiper/react'

type CardType = 'daily' | 'weekly' | 'streak' | 'achievement' | 'rewind'

interface FlexxCardProps {
  type: CardType
  data: {
    totalGoals: number
    totalCheckIns: number
    currentStreak: number
    longestStreak: number
    completionRate: number
    averageProgress: number
  }
  username?: string
  userAvatarUrl?: string
  achievement?: Achievement | null
  rewind?: RewindInsights | null
}

interface ShareBottomSheetContentProps {
  cardRef: HTMLDivElement
  cardType: CardType
  onShare: (element: HTMLElement) => Promise<void>
  onDismiss: () => void
}

interface AchievementSelectorProps {
  achievements: Achievement[]
  onSelect: (achievement: Achievement) => void
  selectedId?: string
}

function AchievementSelector({
  achievements,
  onSelect,
  selectedId,
}: AchievementSelectorProps) {
  return (
    <View className="space-y-3">
      <Text className="text-white/70 text-sm font-bbh mb-2">
        Select Achievement to Flex
      </Text>
      <View className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
        {achievements.map((achievement) => {
          const isSelected = selectedId === achievement.id
          const emojiIcon = getEmojiIcon(achievement.badgeIcon)

          return (
            <motion.div
              key={achievement.id}
              whileTap={{ scale: 0.95 }}
              animate={
                isSelected
                  ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, -5, 0],
                    }
                  : {}
              }
              transition={{
                duration: 0.5,
                ease: 'easeInOut',
              }}
            >
              <Pressable
                onPress={() => onSelect(achievement)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-warning-yellow/20 border-2 border-warning-yellow'
                    : 'bg-card-light border-2 border-transparent hover:bg-card-light/80'
                }`}
              >
                <Icon
                  icon={emojiIcon}
                  width={48}
                  height={48}
                  className="mb-2"
                />
                <Text className="text-white text-xs font-bbh text-center leading-tight line-clamp-2">
                  {achievement.title}
                </Text>
              </Pressable>
            </motion.div>
          )
        })}
      </View>
      {achievements.length === 0 && (
        <View className="py-12 items-center">
          <Text className="text-white/40 text-sm font-bbh text-center">
            No achievements yet. Keep going! 💪
          </Text>
        </View>
      )}
    </View>
  )
}

function ShareBottomSheetContent({
  cardRef,
  cardType,
  onShare,
  onDismiss,
}: ShareBottomSheetContentProps) {
  const getCardTitle = () => {
    switch (cardType) {
      case 'daily':
        return 'Daily Discipline'
      case 'weekly':
        return 'Weekly Flexx'
      case 'streak':
        return 'Streak Power'
    }
  }

  const handleShareAndClose = async () => {
    await onShare(cardRef)
    onDismiss()
  }

  return (
    <View className="space-y-4 pb-4">
      {/* Preview */}
      <View className="space-y-2 hidden">
        <Text className="text-white/70 text-sm font-bbh">Preview</Text>
        <View className="rounded-2xl overflow-hidden bg-card-light max-h-[300px] flex items-center justify-center p-4">
          <View
            className="w-full max-w-[180px] aspect-[9/16] rounded-xl overflow-hidden shadow-lg"
            style={{
              transform: 'scale(0.95)',
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: cardRef.outerHTML }}
              className="pointer-events-none"
            />
          </View>
        </View>
        <Text className="text-center text-white/50 text-xs font-bbh">
          {getCardTitle()} • Ready to share
        </Text>
      </View>

      {/* Share Options */}
      <View className="space-y-3">
        <Text className="text-white/70 text-sm font-bbh">Share to</Text>

        <View className="grid grid-cols-3 gap-3">
          <Pressable
            onPress={handleShareAndClose}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-pink-600/10 hover:bg-pink-600/20 transition-colors"
          >
            <RiInstagramLine size={32} className="text-pink-600 mb-2" />
            <Text className="text-pink-600 text-xs font-bbh font-semibold">
              Instagram
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShareAndClose}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-success-green/10 hover:bg-success-green/20 transition-colors"
          >
            <RiWhatsappLine size={32} className="text-success-green mb-2" />
            <Text className="text-success-green text-xs font-bbh font-semibold">
              WhatsApp
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShareAndClose}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
          >
            <RiTwitterXLine size={32} className="text-blue-500 mb-2" />
            <Text className="text-blue-500 text-xs font-bbh font-semibold">
              Twitter
            </Text>
          </Pressable>
        </View>

        <Button
          label="Download"
          onClick={handleShareAndClose}
          variant="outline"
          className="w-full"
        />
      </View>
    </View>
  )
}

function FlexxCard({
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

export function FlexxV2AppScreen() {
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ])
  const swiperRef = useRef<SwiperType | null>(null)
  const { exportCardFromElement } = useFlexxExport()
  const { present, dismiss } = useBottomSheet()
  const { user } = useAuth()
  const { data: insightsData, isLoading } = useInsights()
  const { data: rewindInsightsData, isLoading: rewindInsightsLoading } =
    useRewindInsights('7d')
  const { data: achievements = [], isLoading: achievementsLoading } =
    useAchievements()

  const cards: CardType[] = [
    'daily',
    'weekly',
    'streak',
    'rewind',
    'achievement',
  ]

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveCardIndex(swiper.activeIndex)
  }

  const getBackgroundGradient = () => {
    switch (activeCardIndex) {
      case 0: // Daily - Purple
        return 'from-purple-900/30 via-purple-950/20 to-cardd'
      case 1: // Weekly - Emerald
        return 'from-emerald-900/30 via-teal-950/20 to-cardd'
      case 2: // Streak - Orange/Red
        return 'from-orange-900/30 via-red-950/20 to-cardd'
      case 3: // Achievement - Yellow/Gold
        return 'from-pink-900/30 via-rose-950/20 to-cardd'
      case 4: // Achievement - Yellow/Gold
        return 'from-yellow-900/30 via-amber-950/20 to-cardd'
      default:
        return 'from-purple-900/30 via-purple-950/20 to-cardd'
    }
  }

  const handleAchievementSelect = (achievement: Achievement) => {
    setSelectedAchievement(achievement)
    dismiss()
    // Switch to achievement card if not already there
    if (activeCardIndex !== 3) {
      swiperRef.current?.slideTo(3)
    }
  }

  const handleAchievementCardClick = () => {
    present(
      <AchievementSelector
        achievements={achievements}
        onSelect={handleAchievementSelect}
        selectedId={selectedAchievement?.id}
      />,
      { title: 'Choose Your Achievement' },
    )
  }

  const handleShareBottomSheet = () => {
    const currentCardRef = cardRefs.current[activeCardIndex]
    if (!currentCardRef) return

    present(
      <ShareBottomSheetContent
        cardRef={currentCardRef}
        cardType={cards[activeCardIndex]}
        onShare={exportCardFromElement}
        onDismiss={dismiss}
      />,
      { title: 'Share Your Flexx' },
    )
  }

  if (isLoading || achievementsLoading || rewindInsightsLoading) {
    return (
      <View className="flex-1 bg-cardd items-center justify-center">
        <Spinner size={32} />
      </View>
    )
  }

  const stats = insightsData?.summary || {
    totalGoals: 0,
    totalCheckIns: 0,
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    averageProgress: 0,
    completedDays: 0,
    totalDays: 0,
  }

  return (
    <View className="max-h-screen bg-cardd flex-1 relative overflow-hidden">
      {/* Dynamic Background Gradient */}
      <motion.div
        key={activeCardIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className={`absolute inset-0 bg-gradient-to-br ${getBackgroundGradient()}`}
      />

      {/* Noise Overlay */}
      <div
        style={{
          background: 'url(/assets/framernoise.png)',
          backgroundSize: '300px',
          opacity: 0.3,
          mixBlendMode: 'overlay',
        }}
        className="absolute inset-0"
      />

      <View className="relative z-10 flex-1">
        <View className="h-full overflow-hidden">
          <View className="">
            <TabHeader title="Flexx On'Em ">
              <Pressable
                onPress={handleShareBottomSheet}
                className="w-12 h-12 rounded-full bg-warning-yellow/10 flex items-center justify-center"
              >
                <RiUpload2Fill size={24} className="text-warning-yellow" />
              </Pressable>
            </TabHeader>
          </View>

          <View className="h-full w-full overflow-y-hidden flex flex-col">
            {/* Cards Container with Swiper */}
            <View className="h-full overflow-y-hidden">
              <Swiper
                spaceBetween={20}
                slidesPerView={1.2}
                centeredSlides={true}
                onSwiper={(swiper) => (swiperRef.current = swiper)}
                onSlideChange={handleSlideChange}
                className="flexx-swiper"
                style={{ height: '100%', width: '100%' }}
              >
                {cards.map((cardType, index) => (
                  <SwiperSlide key={cardType}>
                    <div
                      ref={(el) => (cardRefs.current[index] = el)}
                      style={{
                        width: '100%',
                      }}
                      className="rounded-3xxl size-full overflow-hidden shadow-2xl"
                      onClick={
                        cardType === 'achievement'
                          ? handleAchievementCardClick
                          : undefined
                      }
                    >
                      <FlexxCard
                        type={cardType}
                        data={stats}
                        username={user?.username}
                        userAvatarUrl={user?.avatarUrl}
                        achievement={
                          cardType === 'achievement'
                            ? selectedAchievement
                            : undefined
                        }
                        rewind={
                          cardType === 'rewind' ? rewindInsightsData : undefined
                        }
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </View>

            {/* Swipe Indicator */}
            <View className="pb-2 mt-6 justify-center items-center">
              <View className="flex-row gap-2 mb-2">
                {cards.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === activeCardIndex
                        ? 'w-8 bg-warning-yellow'
                        : 'w-2 bg-white/20'
                    }`}
                  />
                ))}
              </View>
              <Text className="text-white/60 text-sm font-bbh">
                Swipe to see different cards
              </Text>
            </View>
            <BottomNotch />
          </View>
        </View>
      </View>
    </View>
  )
}
