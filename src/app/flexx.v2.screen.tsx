import { RiCheckLine, RiFilter3Line, RiShuffleLine } from '@remixicon/react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
import { useFlexxBackgroundAudio } from '@/hooks/use-flexx-background-audio.hook'
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
import { meaningfulFlexxDesigns } from '@/shared/flexx/flexx-feed-content'
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

function FlexxFilterSheet({
  selectedCategory,
  onSelect,
}: {
  selectedCategory: FlexxCategory
  onSelect: (category: FlexxCategory) => void
}): ReactElement {
  return (
    <div
      role="group"
      aria-label="Flexx feed categories"
      className="grid grid-cols-2 gap-2 pb-3"
    >
      <Pressable
        type="button"
        aria-pressed={selectedCategory === 'all'}
        accessibilityLabel="Show mixed Flexx feed"
        onPress={() => onSelect('all')}
        className={cn(
          'min-h-14 flex-row items-center justify-between gap-2 rounded-2xl px-3 py-3 font-bbh text-sm font-semibold',
          selectedCategory === 'all'
            ? 'bg-white text-black'
            : 'bg-card-light-50 text-white',
        )}
      >
        <span className="flex items-center gap-2">
          <RiShuffleLine size={18} aria-hidden="true" />
          <span>Mix</span>
        </span>
        {selectedCategory === 'all' ? (
          <RiCheckLine size={18} aria-hidden="true" />
        ) : null}
      </Pressable>
      {FLEXX_FEED.map((entry) => {
        const Icon = entry.icon
        const selected = selectedCategory === entry.type
        return (
          <Pressable
            key={entry.type}
            type="button"
            aria-pressed={selected}
            accessibilityLabel={`Show ${entry.label} Flexx`}
            onPress={() => onSelect(entry.type)}
            className={cn(
              'min-h-14 flex-row items-center justify-between gap-2 rounded-2xl px-3 py-3 font-bbh text-sm font-semibold',
              selected ? 'bg-white text-black' : 'bg-card-light-50 text-white',
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Icon size={18} aria-hidden="true" />
              <span>{entry.label}</span>
            </span>
            {selected ? <RiCheckLine size={18} aria-hidden="true" /> : null}
          </Pressable>
        )
      })}
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
  const insightsQuery = useInsights()
  const rewindQuery = useRewindInsights('7d')
  const achievementsQuery = useAchievements()
  const achievements = achievementsQuery.data ?? []
  const displayedAchievement = selectedAchievement ?? achievements[0] ?? null
  const designQuery = useFlexxDesigns(user?.id, category, seed)
  const designs = useMemo(
    () =>
      meaningfulFlexxDesigns(
        designQuery.designs,
        insightsQuery.data?.summary,
        rewindQuery.data,
        achievementsQuery.data ? Boolean(displayedAchievement) : undefined,
      ),
    [
      designQuery.designs,
      insightsQuery.data?.summary,
      rewindQuery.data,
      achievementsQuery.data,
      displayedAchievement,
    ],
  )
  const recommendedCategory = flexxCards[recommendedSelection.cardIndex]
  const postIds = useMemo(() => designs.map((design) => design.id), [designs])
  const recommendedIndex =
    recommendedSelection.cardIndex > 0
      ? Math.max(
          0,
          designs.findIndex(
            (design) => design.category === recommendedCategory,
          ),
        )
      : 0
  const { activeIndex, feedRef, goTo, onKeyDown, onScroll } = useFlexxFeed(
    designs.length,
    category === 'all' ? recommendedIndex : 0,
    category,
    flexxMotion.reducedMotion,
    postIds,
  )
  const cardRefs = useRef(new Map<string, HTMLDivElement>())
  const lastPrefetch = useRef('')
  const { exportCardFromElement } = useFlexxExport()
  const { present, dismiss } = useBottomSheet()
  const cardQueries = {
    daily: insightsQuery,
    weekly: insightsQuery,
    streak: insightsQuery,
    rewind: rewindQuery,
    achievement: achievementsQuery,
  }
  const activeDesign = designs[activeIndex]
  const flexxAudio = useFlexxBackgroundAudio(activeDesign?.id)
  const selectedFilterLabel =
    category === 'all'
      ? 'Mix'
      : (FLEXX_FEED.find((entry) => entry.type === category)?.label ?? 'Mix')

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
      !designs.length ||
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
  function openFilters(): void {
    present(
      <FlexxFilterSheet
        selectedCategory={category}
        onSelect={(selected) => {
          setCategory(selected)
          dismiss()
        }}
      />,
      { title: 'Choose your feed' },
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
        canGoBack={false}
        title={
          <span className="font-display text-2xl font-extrabold tracking-tight">
            Flexx<span className="text-accent-400">.</span>
          </span>
        }
        className="!py-3"
      >
        <Pressable
          type="button"
          onPress={openFilters}
          accessibilityLabel={`Choose Flexx filter. Current selection: ${selectedFilterLabel}`}
          className="min-h-11 max-w-36 flex-row items-center gap-2 rounded-full bg-card-light-50 px-3 font-bbh text-xs font-semibold text-white"
        >
          <RiFilter3Line size={17} aria-hidden="true" />
          <span className="truncate">{selectedFilterLabel}</span>
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
        {!designs.length ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="font-bbh text-card-lighter-3">
              {category === 'all'
                ? 'Fresh posts will appear here as you go.'
                : 'Nothing to share in this view yet.'}
            </p>
            {category !== 'all' ? (
              <Pressable
                type="button"
                onPress={() => setCategory('all')}
                className="min-h-11 rounded-full bg-white px-5 text-black"
              >
                Explore Mix
              </Pressable>
            ) : null}
            {designQuery.hasNextPage || designQuery.isError ? (
              <Pressable
                type="button"
                disabled={designQuery.isFetching}
                onPress={() => {
                  if (designQuery.isError && !designQuery.data)
                    void designQuery.refetch()
                  else void designQuery.fetchNextPage({ cancelRefetch: false })
                }}
                className="min-h-11 rounded-full bg-card-light-50 px-5 text-white"
              >
                {designQuery.isFetching ? 'Loading posts…' : 'Load more posts'}
              </Pressable>
            ) : null}
          </div>
        ) : null}
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
                                ? displayedAchievement
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
                    soundEnabled={flexxAudio.enabled}
                    ready={Boolean(query.data) || Boolean(design.questionnaire)}
                    likeEnabled={Boolean(user?.id)}
                    liked={isLiked(design)}
                    onLike={() => toggleLike(design)}
                    onShare={() => openShare(index)}
                    onToggleSound={flexxAudio.toggle}
                    achievement={
                      design.category === 'achievement'
                        ? {
                            label: displayedAchievement
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
      <div
        aria-hidden="true"
        data-testid="flexx-tab-bar-space"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 100px)',
        }}
      />
    </div>
  )
}
