import { NoiseComponent } from '@/components/common/noise.component'
import { BottomNotch } from '@/components/common/notch.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { Avatar } from '@/components/user/avatar.component'
import { useBottomSheet } from '@/hooks/use-bottom-sheet.hook'
import { useFlexxExport } from '@/hooks/use-flexx-export.hook'
import { useInsights } from '@/hooks/use-insights.hook'
import { useAuth } from '@/providers/auth.provider'
import '@/styles/swiper-custom.css'
import {
    RiFireFill,
    RiFlashlightFill,
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

interface ShareBottomSheetContentProps {
  cardRef: HTMLDivElement
  cardType: CardType
  onShare: (element: HTMLElement) => Promise<void>
  onDismiss: () => void
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
      <View className="space-y-2">
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
          label="Download Image"
          onClick={handleShareAndClose}
          variant="outline"
          className="w-full"
        />
      </View>
    </View>
  )
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
    const size = 40
    const Icon = () => {
      switch (type) {
        case 'daily':
          return <RiFlashlightFill size={size} className="text-white/90" />
        case 'weekly':
          return <RiTrophyFill size={size} className="text-white/90" />
        case 'streak':
          return <RiFireFill size={size} className="text-white/90" />
      }
    }

    return (
      <View className="">
        <View className="absolute top-0 right-0 p-mg mt-3">
          <Icon />
        </View>
        <View className="absolute scale-[7.1] bottom-mg opacity-10 right-0 p-mg mt-3">
          <Icon />
        </View>
      </View>
    )
  }

  const getTitle = () => {
    switch (type) {
      case 'daily':
        return (
          <>
            <View className="flex-row flex gap-2 items-center">
              <Text className="text-white text-4xl font-bbh font-bold tracking-tight">
                Daily
              </Text>
              {getIcon()}
            </View>
            <Text className="text-white text-4xl font-bbh font-bold tracking-tight">
              Discipline
            </Text>
          </>
        )
      case 'weekly':
        return (
          <>
            <View className="flex-row  flex gap-2 items-center">
              <Text className="text-white text-4xl font-bbh font-bold tracking-tight">
                Weekly
              </Text>
              {getIcon()}
            </View>
            <Text className="text-white text-4xl font-bbh font-bold tracking-tight">
              Flexx
            </Text>
          </>
        )
      case 'streak':
        return (
          <>
            <View className="flex-row flex gap-2 items-center">
              <Text className="text-white text-4xl font-bbh font-bold tracking-tight">
                Streak
              </Text>
              {getIcon()}
            </View>
            <Text className="text-white text-4xl font-bbh font-bold tracking-tight">
              Power
            </Text>
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
    <View className="size-full relative overflow-hidden">
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradient()}`} />

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
      <View className="relative z-10 flex-1 p-8 size-full  flex flex-col justify-between">
        {/* Header */}
        <View className="space-y-1  ">
          <View className="flex-row items-center justify-between">
            <Text className="text-white/50 text-sm font-bbh">{today}</Text>
          </View>

          <View className="flex-col space-y-1">
            {getTitle()}
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
              className="flex flex-row items-center justify-between py-2 border-b border-white/10"
            >
              <Text className="text-white/70 text-xs font-bbh uppercase tracking-wide">
                {stat.label}
              </Text>
              <Text className="text-white text-md font-bbh font-bold">
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
          <View className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <img
              src="/assets/icon-foreground.png"
              className="w-7 h-7 brightness-[100] "
              alt="Vybaa"
            />
          </View>
        </View>
      </View>
    </View>
  )
}

export function FlexxV2AppScreen() {
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])
  const swiperRef = useRef<SwiperType | null>(null)
  const { exportCardFromElement } = useFlexxExport()
  const { present, dismiss } = useBottomSheet()
  const { user } = useAuth()
  const { data: insightsData, isLoading } = useInsights()

  const cards: CardType[] = ['daily', 'weekly', 'streak']

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveCardIndex(swiper.activeIndex)
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
            onPress={handleShareBottomSheet}
            className="w-12 h-12 rounded-full bg-warning-yellow/10 flex items-center justify-center"
          >
            <RiUpload2Fill size={24} className="text-warning-yellow" />
          </Pressable>
        </TabHeader>

        <View className="flex-1 w-full flex flex-col">
          {/* Cards Container with Swiper */}
          <View className="flex-1">
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
                      aspectRatio: '9/16',
                      maxHeight: '85%',
                      width: '100%',
                    }}
                    className="rounded-3xl size-full overflow-hidden shadow-2xl"
                  >
                    <FlexxCard
                      type={cardType}
                      data={stats}
                      username={user?.username}
                      userAvatarUrl={user?.avatarUrl}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </View>

          {/* Swipe Indicator */}
          <View className="py-6 justify-center items-center">
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
      </NoiseComponent>
    </View>
  )
}
