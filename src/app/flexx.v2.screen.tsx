import { RiPauseLine, RiPlayLine, RiShuffleLine } from '@remixicon/react'
import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'

import { QueryFeedback } from '@/components/common/query-feedback.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { FlexxFeedCard } from '@/components/custom/flexx/flexx-feed-card.component'
import { FlexxActions } from '@/components/custom/flexx/flexx-actions.component'
import { FlexxQuestionnaire } from '@/components/custom/flexx/flexx-questionnaire.component'
import { FLEXX_FEED } from '@/components/custom/flexx/flexx-feed.config'
import {
  AchievementSelector,
  ShareBottomSheetContent,
} from '@/components/custom/flexx/flexx-share-sheet.component'
import type {
  CardType,
  FlexxStats,
} from '@/components/custom/flexx/flexx-card.component'
import { Pressable } from '@/components/layout/pressables.component'
import { useAchievements } from '@/hooks/use-achievements.hook'
import { useBottomSheet } from '@/hooks/use-bottom-sheet.hook'
import { useFlexxDesigns } from '@/hooks/use-flexx-designs.hook'
import { useFlexxExport } from '@/hooks/use-flexx-export.hook'
import { useFlexxFeed } from '@/hooks/use-flexx-feed.hook'
import { useFlexxLikes } from '@/hooks/use-flexx-likes.hook'
import { useFlexxMotion } from '@/hooks/use-flexx-motion.hook'
import { useInsights } from '@/hooks/use-insights.hook'
import { useRewindInsights } from '@/hooks/use-rewind.hook'
import { useAuth } from '@/providers/auth.provider'
import type { Achievement } from '@/shared/api/achievement.api'
import { rewindAPI } from '@/shared/api/rewind.api'
import { FLEXX_THEMES } from '@/shared/flexx/flexx-design'
import type { FlexxCategory } from '@/shared/flexx/flexx-design'
import { cn } from '@/shared/utils/helpers.util'
import '@/components/custom/flexx/flexx-motion.css'

const flexxCards = FLEXX_FEED.map((entry) => entry.type)
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

function CardLoading({ type }: { type: CardType }): ReactElement {
  return (
    <div
      role="status"
      aria-label={`Loading ${type} card`}
      className="flex size-full flex-col justify-between p-7"
    >
      <Skeleton className="size-10" rounded="full" />
      <div className="flex flex-col gap-5">
        <Skeleton className="h-10 w-4/5" />
        {type === 'weekly' ? (
          <div className="grid grid-cols-2 gap-5">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <>
            <Skeleton className="h-24 w-3/5" />
            <Skeleton className="h-3 w-1/2" />
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="size-8" rounded="full" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  )
}

export function FlexxV2AppScreen(): ReactElement {
  const [recommendedSelection] = useState(getRecommendedFlexxSelection)
  const [category, setCategory] = useState<FlexxCategory>('all')
  const [seed] = useState(() => Math.floor(Math.random() * 100_000))
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null)
  const { user } = useAuth()
  const { isLiked, toggleLike } = useFlexxLikes(user?.id)
  const flexxMotion = useFlexxMotion()
  const designQuery = useFlexxDesigns(user?.id, category, seed)
  const designs = designQuery.designs
  const { activeIndex, feedRef, goTo, onKeyDown, onScroll } = useFlexxFeed(
    designs.length,
    category === 'all' ? recommendedSelection.cardIndex : 0,
    category,
    flexxMotion.reducedMotion,
  )
  const cardRefs = useRef(new Map<string, HTMLDivElement>())
  const lastPrefetch = useRef('')
  const { exportCardFromElement } = useFlexxExport()
  const { present, dismiss } = useBottomSheet()
  const insightsQuery = useInsights()
  const rewindQuery = useRewindInsights('7d')
  const achievementsQuery = useAchievements()
  const achievements = achievementsQuery.data ?? []
  const cardQueries = {
    daily: insightsQuery,
    weekly: insightsQuery,
    streak: insightsQuery,
    rewind: rewindQuery,
    achievement: achievementsQuery,
  }
  const activeDesign = designs[activeIndex]

  useEffect(() => {
    if (!recommendedSelection.achievementId || selectedAchievement) return
    const achievement = achievements.find(
      (item) => item.id === recommendedSelection.achievementId,
    )
    if (achievement) setSelectedAchievement(achievement)
  }, [achievements, recommendedSelection.achievementId, selectedAchievement])

  useEffect(() => {
    const key = `${category}:${designs.length}`
    if (
      activeIndex < designs.length - 4 ||
      !designQuery.hasNextPage ||
      designQuery.isFetching ||
      designQuery.isError ||
      lastPrefetch.current === key
    )
      return
    lastPrefetch.current = key
    void designQuery.fetchNextPage({ cancelRefetch: false })
  }, [
    activeIndex,
    category,
    designs.length,
    designQuery.hasNextPage,
    designQuery.isFetching,
    designQuery.isError,
    designQuery.fetchNextPage,
  ])

  function handleAchievementSelect(achievement: Achievement): void {
    setSelectedAchievement(achievement)
    dismiss()
    if (activeDesign?.category === 'achievement') return
    const index = designs.findIndex(
      (design) => design.category === 'achievement',
    )
    if (index >= 0) goTo(index)
    else setCategory('achievement')
  }
  function openAchievements(): void {
    if (!achievementsQuery.data) return
    present(
      <AchievementSelector
        achievements={achievements}
        onSelect={handleAchievementSelect}
        selectedId={selectedAchievement?.id}
      />,
      { title: 'Choose Your Achievement' },
    )
  }
  function openShare(index: number): void {
    const design = designs[index]
    const card = design && cardRefs.current.get(design.id)
    if (
      !design ||
      !card ||
      (!cardQueries[design.category].data && !design.questionnaire)
    )
      return
    const cardType = design.category
    present(
      <ShareBottomSheetContent
        cardRef={card}
        cardType={cardType}
        onShare={async (element) => {
          const shared = await exportCardFromElement(element)
          if (!shared) return false
          try {
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
  const stats: FlexxStats = insightsQuery.data?.summary ?? {
    totalGoals: 0,
    totalCheckIns: 0,
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    averageProgress: 0,
  }

  return (
    <div className="grid h-full min-h-0 w-full min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-cardd">
      <TabHeader
        title={
          <span className="font-display text-2xl font-extrabold tracking-tight">
            Flexx<span className="text-accent-400">.</span>
          </span>
        }
        className="!py-3"
        closeToBack={
          <Pressable
            type="button"
            onPress={flexxMotion.toggle}
            disabled={flexxMotion.reducedMotion}
            aria-pressed={flexxMotion.paused || flexxMotion.reducedMotion}
            accessibilityLabel={
              flexxMotion.reducedMotion
                ? 'Flexx animations off: reduced motion enabled'
                : `${flexxMotion.paused ? 'Resume' : 'Pause'} Flexx animations`
            }
            className="ml-1 min-h-11 min-w-11 items-center justify-center rounded-full bg-card-light-50 text-white disabled:text-card-lighter-3"
          >
            {flexxMotion.paused || flexxMotion.reducedMotion ? (
              <RiPlayLine size={18} aria-hidden="true" />
            ) : (
              <RiPauseLine size={18} aria-hidden="true" />
            )}
          </Pressable>
        }
      >
        <Pressable
          onPress={() => setCategory('all')}
          aria-pressed={category === 'all'}
          accessibilityLabel="Show mixed Flexx feed"
          className={cn(
            'min-h-11 flex-row items-center gap-2 rounded-full px-3 font-bbh text-xs font-bold',
            category === 'all'
              ? 'bg-white text-black'
              : 'bg-card-light-50 text-white',
          )}
        >
          <RiShuffleLine size={16} aria-hidden="true" />
          <span>Mix</span>
        </Pressable>
      </TabHeader>
      <div
        ref={feedRef}
        role="region"
        aria-label="Your Flexx feed"
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        className="min-h-0 w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain outline-none no-scrollbar focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-card-lighter [@media(max-height:500px)]:snap-proximity"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {designs.map((design, index) => {
          const query = cardQueries[design.category]
          const theme = FLEXX_THEMES[design.palette]
          const mounted = Math.abs(index - activeIndex) <= 2
          const label =
            FLEXX_FEED.find((entry) => entry.type === design.category)?.label ??
            design.category
          return (
            <article
              key={design.id}
              aria-label={`${label} Flexx: ${design.headline}`}
              aria-current={activeIndex === index ? 'true' : undefined}
              data-flexx-post={design.category}
              data-design-id={design.id}
              className="relative flex h-full min-h-full w-full snap-start snap-always [@media(max-height:500px)]:h-[680px]"
              style={{ backgroundColor: theme.background }}
            >
              {mounted ? (
                <>
                  <div
                    className="flex min-h-0 min-w-0 flex-1 items-center justify-center"
                    style={{ containerType: 'size' }}
                  >
                    <div
                      className="relative max-h-full"
                      style={{
                        width: 'min(100cqw, calc(100cqh * 9 / 16))',
                        aspectRatio: '9 / 16',
                      }}
                    >
                      <div
                        ref={(element) => {
                          if (element) cardRefs.current.set(design.id, element)
                          else cardRefs.current.delete(design.id)
                        }}
                        className="size-full"
                      >
                        {query.isPending &&
                        !query.data &&
                        !design.questionnaire ? (
                          <CardLoading type={design.category} />
                        ) : null}
                        {query.isError &&
                        !query.data &&
                        !design.questionnaire ? (
                          <div className="flex size-full items-center justify-center p-5">
                            <QueryFeedback
                              message="This design couldn't load."
                              onRetry={() => void query.refetch()}
                              retrying={query.isFetching}
                            />
                          </div>
                        ) : null}
                        {design.questionnaire ? (
                          <FlexxQuestionnaire
                            design={design}
                            userId={user?.id}
                            animate={
                              activeIndex === index && flexxMotion.enabled
                            }
                          />
                        ) : null}
                        {query.data && !design.questionnaire ? (
                          <FlexxFeedCard
                            design={design}
                            animate={
                              activeIndex === index && flexxMotion.enabled
                            }
                            user={user ?? undefined}
                            type={design.category}
                            data={stats}
                            username={user?.username}
                            userAvatarUrl={user?.avatarUrl}
                            achievement={
                              design.category === 'achievement'
                                ? selectedAchievement
                                : undefined
                            }
                            rewind={
                              design.category === 'rewind'
                                ? rewindQuery.data
                                : undefined
                            }
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <FlexxActions
                    label={label}
                    foreground={theme.foreground}
                    author={design.author}
                    likedBy={design.likedBy}
                    ready={Boolean(query.data) || Boolean(design.questionnaire)}
                    likeEnabled={Boolean(user?.id)}
                    liked={isLiked(design)}
                    onLike={() => toggleLike(design)}
                    onShare={() => openShare(index)}
                    achievement={
                      design.category === 'achievement'
                        ? {
                            label: selectedAchievement
                              ? 'Change achievement to Flexx'
                              : 'Choose an achievement to Flexx',
                            ready: Boolean(achievementsQuery.data),
                            onPress: openAchievements,
                          }
                        : undefined
                    }
                    more={
                      activeIndex === designs.length - 1 &&
                      (designQuery.isError || designQuery.hasNextPage)
                        ? {
                            loading: designQuery.isFetching,
                            onPress: () => {
                              if (designQuery.isError && !designQuery.data)
                                void designQuery.refetch()
                              else
                                void designQuery.fetchNextPage({
                                  cancelRefetch: false,
                                })
                            },
                          }
                        : undefined
                    }
                  />
                </>
              ) : null}
            </article>
          )
        })}
      </div>
      <nav
        aria-label="Flexx categories"
        className="grid grid-cols-5 gap-1 bg-cardd px-3 pt-3"
        style={{
          paddingBottom: 'max(12px, var(--safe-area-inset-bottom, 0px))',
        }}
      >
        {FLEXX_FEED.map((entry) => {
          const Icon = entry.icon
          return (
            <Pressable
              key={entry.type}
              onPress={() => setCategory(entry.type)}
              aria-pressed={category === entry.type}
              accessibilityLabel={`Show ${entry.label} Flexx`}
              className={cn(
                'min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-full px-1 font-bbh text-[10px] font-semibold !transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                category === entry.type
                  ? 'bg-white text-black'
                  : 'text-card-lighter-3 hover:bg-card-light-50',
              )}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{entry.label}</span>
            </Pressable>
          )
        })}
      </nav>
    </div>
  )
}
