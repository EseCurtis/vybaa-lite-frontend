import { BottomNotch } from '@/components/common/notch.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import {
  AchievementSelector,
  ShareBottomSheetContent,
} from '@/components/custom/flexx/flexx-share-sheet.component'
import { FlexxCard } from '@/components/custom/flexx/flexx-card.component'
import type {
  CardType,
  FlexxStats,
} from '@/components/custom/flexx/flexx-card.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAchievements } from '@/hooks/use-achievements.hook'
import { useBottomSheet } from '@/hooks/use-bottom-sheet.hook'
import { useFlexxExport } from '@/hooks/use-flexx-export.hook'
import { useInsights } from '@/hooks/use-insights.hook'
import { useRewindInsights } from '@/hooks/use-rewind.hook'
import { useAuth } from '@/providers/auth.provider'
import type { Achievement } from '@/shared/api/achievement.api'
import { rewindAPI } from '@/shared/api/rewind.api'
import '@/styles/swiper-custom.css'
import { RiUpload2Fill } from '@remixicon/react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import { Swiper, SwiperSlide } from 'swiper/react'

const flexxCards: CardType[] = [
  'daily',
  'weekly',
  'streak',
  'rewind',
  'achievement',
]

function isFlexxCardType(value: unknown): value is CardType {
  return typeof value === 'string' && flexxCards.some((card) => card === value)
}

function getRecommendedFlexxSelection(): {
  achievementId?: string
  cardIndex: number
} {
  if (typeof window === 'undefined') return { cardIndex: 0 }
  const stored = window.sessionStorage.getItem('rewind:flexx-recommendation')
  if (!stored) return { cardIndex: 0 }
  window.sessionStorage.removeItem('rewind:flexx-recommendation')
  try {
    const parsed: unknown = JSON.parse(stored)
    const cardType =
      typeof parsed === 'object' && parsed && 'cardType' in parsed
        ? parsed.cardType
        : undefined
    const achievementId =
      typeof parsed === 'object' &&
      parsed &&
      'achievementId' in parsed &&
      typeof parsed.achievementId === 'string'
        ? parsed.achievementId
        : undefined
    const index = isFlexxCardType(cardType) ? flexxCards.indexOf(cardType) : -1
    return { achievementId, cardIndex: index >= 0 ? index : 0 }
  } catch {
    return { cardIndex: 0 }
  }
}

export function FlexxV2AppScreen() {
  const [recommendedSelection] = useState(getRecommendedFlexxSelection)
  const [activeCardIndex, setActiveCardIndex] = useState(
    recommendedSelection.cardIndex,
  )
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

  useEffect(() => {
    if (!recommendedSelection.achievementId || selectedAchievement) return
    const achievement = achievements.find(
      (item) => item.id === recommendedSelection.achievementId,
    )
    if (achievement) setSelectedAchievement(achievement)
  }, [achievements, recommendedSelection.achievementId, selectedAchievement])

  const cards = flexxCards

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
    if (activeCardIndex !== 4) {
      swiperRef.current?.slideTo(4)
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
        onShare={async (element) => {
          const shared = await exportCardFromElement(element)
          if (!shared) return false
          try {
            const cardType = cards[activeCardIndex]
            await rewindAPI.recordFlexxActivity({
              description: `Shared a ${cardType} Flexx card.`,
              eventType: 'FLEXX_SHARED',
              happenedAt: new Date().toISOString(),
              sourceId: `${cardType}:${Date.now()}`,
            })
          } catch (error: unknown) {
            console.warn('Unable to record Flexx activity', error)
          }
          return true
        }}
        onDismiss={dismiss}
      />,
      { title: 'Share Your Flexx' },
    )
  }

  if (isLoading || achievementsLoading || rewindInsightsLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-5 bg-cardd px-mg">
        <Skeleton className="h-[52vh] w-full max-w-[360px]" rounded="xl" />
        <View className="w-full max-w-[280px] gap-2">
          <Skeleton className="h-3 w-2/3" rounded="sm" />
          <Skeleton className="h-3 w-full" rounded="sm" />
        </View>
      </View>
    )
  }

  const stats: FlexxStats = insightsData?.summary || {
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
                initialSlide={activeCardIndex}
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
