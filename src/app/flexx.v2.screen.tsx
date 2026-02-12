import { NoiseComponent } from '@/components/common/noise.component'
import { BottomNotch } from '@/components/common/notch.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { Avatar } from '@/components/user/avatar.component'
import { useDomExport } from '@/hooks/use-dom-export.hook'
import { useInsights } from '@/hooks/use-insights.hook'
import { useAuth } from '@/providers/auth.provider'
import {
    RiFireFill,
    RiFlashlightFill,
    RiInstagramLine,
    RiTrophyFill,
    RiUpload2Fill,
    RiWhatsappLine,
} from '@remixicon/react'
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'

type CardType = 'daily' | 'weekly' | 'streak'

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
}

function FlexxCard({ type, data, username, userAvatarUrl }: FlexxCardProps) {
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
      default:
        return 'from-purple-600 via-purple-700 to-indigo-900'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'daily':
        return <RiFlashlightFill size={30} className="text-white/90" />
      case 'weekly':
        return <RiTrophyFill size={30} className="text-white/90" />
      case 'streak':
        return <RiFireFill size={30} className="text-white/90" />
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'daily':
        return (
          <>
            <Text className="flex gap-1 items-center"> Daily{getIcon()}</Text>{' '}
            <Text className="flex">Discipline </Text>
          </>
        )
      case 'weekly':
        return (
          <>
            <Text className="flex gap-1 items-center"> Weekly{getIcon()}</Text>{' '}
            <Text className="flex">Flexx </Text>
          </>
        )
      case 'streak':
        return (
          <>
            <Text className="flex gap-1 items-center"> Streak{getIcon()}</Text>{' '}
            <Text className="flex">Power </Text>
          </>
        )
    }
  }

  const getStats = () => {
    switch (type) {
      case 'daily':
        return [
          { label: 'Goals', value: data.totalGoals },
          { label: 'Check-ins Today', value: data.totalCheckIns },
          { label: 'Completion', value: `${Math.round(data.completionRate)}%` },
          { label: 'Current Streak', value: `${data.currentStreak} days` },
        ]
      case 'weekly':
        return [
          { label: 'Total Goals', value: data.totalGoals },
          {
            label: 'Avg Progress',
            value: `${Math.round(data.averageProgress)}%`,
          },
          { label: 'Check-ins', value: data.totalCheckIns },
          { label: 'Streak', value: `${data.currentStreak} days` },
        ]
      case 'streak':
        return [
          { label: 'Current Streak', value: `${data.currentStreak} days` },
          { label: 'Longest Streak', value: `${data.longestStreak} days` },
          { label: 'Total Check-ins', value: data.totalCheckIns },
          {
            label: 'Discipline Score',
            value: `${Math.round(data.completionRate)}%`,
          },
        ]
    }
  }

  return (
    <View className="size-full relative overflow-hidden bg-gradient-to-br from-gray-900 to-black">
      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getGradient()} opacity-90`}
      />

      {/* Noise texture */}
      <div
        style={{
          background: 'url(/assets/framernoise.png)',
          backgroundSize: '300px',
          opacity: 0.15,
          mixBlendMode: 'overlay',
        }}
        className="absolute inset-0"
      />

      {/* Content */}
      <View className="relative z-10 flex-1 p-8  flex flex-col justify-between">
        {/* Header */}
        <View className="space-y-1 ">
          <View className="flex-row items-center justify-between">
            <Text className="text-white/50 text-sm font-bbh">{today}</Text>
          </View>

          <View>
            <Text className="text-white flex-col  text-4xl font-bbh font-bold tracking-tight">
              {getTitle()}
            </Text>
            <Text className="text-white/60 text-base font-bbh mt-2">
              Proof of Discipline
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="space-y-1 my-1">
          {getStats().map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-row items-center justify-between py-1 border-b border-white/10"
            >
              <Text className="text-white/70 text-sm font-bbh uppercase tracking-wide">
                {stat.label}
              </Text>
              <Text className="text-white text-2xl font-bbh font-bold">
                {stat.value}
              </Text>
            </motion.div>
          ))}
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row gap-2">
              {userAvatarUrl && (
                <View className="">
                  <Avatar url={userAvatarUrl} />
                </View>
              )}
              <View className="">
                {username && (
                  <Text className="text-white text-lg font-bbh font-semibold">
                    @{username}
                  </Text>
                )}
                <Text className="text-white/40 text-xs font-bbh mt-0">
                  Made with Vybaa
                </Text>
              </View>
            </View>
          </View>
          <View className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
            <img
              src="/assets/icon-foreground.png"
              className="w-7 h-7 brightness-[100]"
              alt="Vybaa"
            />
          </View>
        </View>
      </View>
    </View>
  )
}

export function FlexxV2AppScreen() {
  const cardWidth = 90
  const padding = (100 - cardWidth) / 4
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])
  const { exportAndShare } = useDomExport({ scale: 5 })
  const { user } = useAuth()
  const { data: insightsData, isLoading } = useInsights()

  const cards: CardType[] = ['daily', 'weekly', 'streak']

  const handleShare = async () => {
    const currentCardRef = cardRefs.current[activeCardIndex]
    if (currentCardRef) {
      await exportAndShare(currentCardRef)
    }
  }

  if (isLoading) {
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
    <View className=" max-h-screen bg-cardd flex-1">
      <NoiseComponent>
        <TabHeader title="Flexx On'Em ">
          <Pressable
            onPress={handleShare}
            className="w-12 h-12 rounded-full bg-warning-yellow/10 flex items-center justify-center"
          >
            <RiUpload2Fill size={24} className="text-warning-yellow" />
          </Pressable>
        </TabHeader>

        <View className="grid grid-rows-6 flex-1 w-full">
          {/* Cards Container */}
          <View className="row-span-5 flex-row gap-3 overflow-x-scroll snap-x snap-mandatory">
            <View
              style={{ width: `${padding}%` }}
              className="shrink-0 h-full snap-start"
            />

            {cards.map((cardType, index) => (
              <View
                key={cardType}
                //@ts-ignore
                ref={(el) => (cardRefs.current[index] = el)}
                style={{ width: `${cardWidth}%` }}
                className="snap-center bg-card-light shrink-0 rounded-3xl overflow-hidden shadow-2xl"
                onMouseEnter={() => setActiveCardIndex(index)}
              >
                <FlexxCard
                  type={cardType}
                  data={stats}
                  username={user?.username}
                  userAvatarUrl={user?.avatarUrl}
                />
              </View>
            ))}

            <View
              style={{ width: `${padding}%` }}
              className="shrink-0 h-full snap-start"
            />
          </View>

          {/* Action Buttons */}
          <View className="row-span-1 justify-center">
            <View className="flex-row gap-3 items-center justify-center mb-4">
              <Text className="text-white/60 text-sm font-bbh">
                Swipe to see different cards
              </Text>
            </View>
            <View className="flex-row gap-3 items-center justify-center">
              <Button label="Share" onClick={handleShare} />
              <Pressable
                onPress={handleShare}
                className="w-12 h-12 rounded-full bg-success-green/10 flex items-center justify-center"
              >
                <RiWhatsappLine size={24} className="text-success-green" />
              </Pressable>

              <Pressable
                onPress={handleShare}
                className="w-12 h-12 rounded-full bg-pink-600/10 flex items-center justify-center"
              >
                <RiInstagramLine size={24} className="text-pink-600" />
              </Pressable>
            </View>
          </View>
          <BottomNotch />
        </View>
      </NoiseComponent>
    </View>
  )
}
