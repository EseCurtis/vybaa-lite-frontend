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

  const getIcon = (size: number = 40) => {
    switch (type) {
      case 'daily':
        return <RiFlashlightFill size={size} className="text-white/90" />
      case 'weekly':
        return <RiTrophyFill size={size} className="text-white/90" />
      case 'streak':
        return <RiFireFill size={size} className="text-white/90" />
    }
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
            <Text className="text-white/60 text-xs font-bbh uppercase tracking-[0.2em] mb-3">
              Today's Discipline
            </Text>
            <Text className="text-white text-[70px] leading-none font-bbh font-bold mb-1">
              {data.totalCheckIns}
            </Text>
            <Text className="text-white/80 text-lg font-bbh tracking-wide">
              check-ins
            </Text>

            {/* Secondary Stats */}
            <View className="mt-16 space-y-3 w-full max-w-[85%]">
              <View className="flex-row justify-between items-center">
                <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide">
                  Goals
                </Text>
                <Text className="text-white text-xl font-bbh font-bold">
                  {data.totalGoals}
                </Text>
              </View>
              <View className="h-px bg-white/10" />
              <View className="flex-row justify-between items-center">
                <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide">
                  Streak
                </Text>
                <Text className="text-white text-xl font-bbh font-bold">
                  {data.currentStreak} days
                </Text>
              </View>
              <View className="h-px bg-white/10" />
              <View className="flex-row justify-between items-center">
                <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide">
                  Completion
                </Text>
                <Text className="text-white text-xl font-bbh font-bold">
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

          {/* Stats Grid - 2x2 with better spacing */}
          <View className="flex-1 grid grid-cols-2 gap-3 mb-8">
            <View className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 flex flex-col justify-between">
              <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide mb-2">
                Total Goals
              </Text>
              <Text className="text-white text-6xl font-bbh font-bold leading-none">
                {data.totalGoals}
              </Text>
            </View>

            <View className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 flex flex-col justify-between">
              <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide mb-2">
                Check-ins
              </Text>
              <Text className="text-white text-6xl font-bbh font-bold leading-none">
                {data.totalCheckIns}
              </Text>
            </View>

            <View className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 flex flex-col justify-between">
              <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide mb-2">
                Progress
              </Text>
              <Text className="text-white text-6xl font-bbh font-bold leading-none">
                {Math.round(data.averageProgress)} <span className='text-lg'>%</span>
              </Text>
            </View>

            <View className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 flex flex-col justify-between">
              <Text className="text-white/60 text-xs font-bbh uppercase tracking-wide mb-2">
                Streak
              </Text>
              <Text className="text-white text-6xl font-bbh font-bold leading-none">
                {data.currentStreak}d
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
              className="text-center flex flex-col items-center"
            >
              <Text className="text-white/60 text-xs font-bbh uppercase tracking-[0.3em] mb-4">
                Current Streak
              </Text>
              <Text className="text-white text-[140px] leading-none font-bbh font-bold">
                {data.currentStreak}
              </Text>
              <Text className="text-white text-5xl font-bbh font-bold mt-2 tracking-wider">
                DAYS
              </Text>
            </motion.div>

            {/* Mini Stats Row */}
            <View className="flex-row items-center gap-6 mt-20">
              <View className="text-center flex-1">
                <Text className="text-white text-4xl font-bbh font-bold leading-none">
                  {data.longestStreak}
                </Text>
                <Text className="text-white/60 text-xs font-bbh uppercase mt-2 tracking-wide">
                  Best Streak
                </Text>
              </View>

              <View className="w-px h-14 bg-white/20" />

              <View className="text-center flex-1">
                <Text className="text-white text-4xl font-bbh font-bold leading-none">
                  {data.totalCheckIns}
                </Text>
                <Text className="text-white/60 text-xs font-bbh uppercase mt-2 tracking-wide">
                  Total Check-ins
                </Text>
              </View>

              <View className="w-px h-14 bg-white/20" />

              <View className="text-center flex-1">
                <Text className="text-white text-4xl font-bbh font-bold leading-none">
                  {Math.round(data.completionRate)}%
                </Text>
                <Text className="text-white/60 text-xs font-bbh uppercase mt-2 tracking-wide">
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

  // Fallback (shouldn't reach here)
  return null
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
            <View className="pb-2 justify-center items-center">
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
      </NoiseComponent>
    </View>
  )
}
