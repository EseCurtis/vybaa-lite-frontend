// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { isValidElement } from 'react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import type {
  AchievementSelectorProps,
  ShareBottomSheetContentProps,
} from '@/components/custom/flexx/flexx-share-sheet.component'
import type { Achievement } from '@/shared/api/achievement.api'
import { http } from '@/shared/api/http'
import {
  FLEXX_CATEGORIES,
  parseFlexxDesign,
  starterFlexxDesigns,
} from '@/shared/flexx/flexx-design'
import { FlexxV2AppScreen } from './flexx.v2.screen'

const controls = vi.hoisted(() => ({
  present: vi.fn<(content: ReactNode, options: { title: string }) => void>(),
  dismiss: vi.fn(),
  exportCard: vi.fn(),
}))
vi.mock('@/components/common/tab-header.component', () => ({
  TabHeader: ({
    title,
    children,
    canGoBack = true,
    closeToBack,
  }: {
    title: ReactNode
    children: ReactNode
    canGoBack?: boolean
    closeToBack?: ReactNode
  }) => (
    <header>
      {canGoBack ? <button data-testid="tab-header-back" /> : null}
      {canGoBack ? closeToBack : null}
      {title}
      {children}
    </header>
  ),
}))
vi.mock('@/hooks/use-bottom-sheet.hook', () => ({
  useBottomSheet: () => controls,
}))
vi.mock('@/hooks/use-flexx-export.hook', () => ({
  useFlexxExport: () => ({ exportCardFromElement: controls.exportCard }),
}))
vi.mock('@/providers/auth.provider', () => ({
  useAuth: () => ({ user: { id: 'owner', username: 'ada' } }),
}))
vi.mock('@/providers/subscription.provider', () => ({
  useSubscription: () => ({ isPro: false }),
}))
vi.mock('@/shared/api/http', () => ({ http: { get: vi.fn(), post: vi.fn() } }))
const badge: Achievement = {
  id: 'badge',
  userId: 'owner',
  type: 'streak_milestone',
  milestone: 14,
  title: 'Two weeks strong',
  description: 'Fourteen days of showing up.',
  badgeIcon: '🔥',
  earnedAt: '2026-10-19T08:00:00Z',
}
const scheduledQuestionTexts = [
  'What felt most present today?',
  'What small moment do you want to remember?',
  'What would make tomorrow feel kinder?',
  'What did you need more of today?',
]
const scheduledQuestionIndices: readonly number[] = [3, 4, 7, 8]
const generatedHeadlines = [
  'A fresh start.',
  'A quiet win.',
  'In your rhythm.',
  'A moment kept.',
  'Small steps count.',
  'A little further.',
  'Still becoming.',
  'Room to reflect.',
  'Keep going softly.',
  'Your week, held.',
]
const originalScrollTo = Object.getOwnPropertyDescriptor(
  Element.prototype,
  'scrollTo',
)
let client: QueryClient
beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  localStorage.clear()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      disconnect(): void {}
    },
  )
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(600)
  Object.defineProperty(Element.prototype, 'scrollTo', {
    configurable: true,
    value(this: Element, options: ScrollToOptions): void {
      this.scrollTop = options.top ?? 0
      this.dispatchEvent(new Event('scroll'))
    },
  })
  vi.mocked(http.get).mockImplementation(async (path, options) => {
    if (path === '/api/v1/flexx/designs') {
      const value: unknown = options?.params?.category
      const category =
        FLEXX_CATEGORIES.find((entry) => entry === value) ?? 'all'
      const cursor: unknown = options?.params?.cursor
      return {
        data: {
          data: {
            version: 1,
            source: 'ai',
            designs: starterFlexxDesigns(category, cursor ? 13 : 7).map(
              (design, index) => {
                let questionIndex = -1
                if (category === 'all')
                  questionIndex = scheduledQuestionIndices.indexOf(index)
                else if (category === 'rewind' && index < 4)
                  questionIndex = index
                const generated = generatedHeadlines[index]
                const question = scheduledQuestionTexts[questionIndex]
                const id = `generated:${category}:${String(cursor ?? 'first')}:${index}`
                const generatedDesign = question
                  ? parseFlexxDesign({
                      ...design,
                      id,
                      headline: generated ?? design.headline,
                      category: 'rewind',
                      layout: 'questionnaire',
                      symbol: 'rewind',
                      blocks: [],
                      editorial: null,
                      questionnaire: {
                        question,
                        options: [
                          'I felt grounded',
                          'I need a little space',
                          'Not sure yet',
                        ],
                      },
                    })
                  : { ...design, headline: generated ?? design.headline, id }
                return {
                  ...generatedDesign,
                  likedBy: index % 2 ? [] : ['ella', 'tobi'],
                }
              },
            ),
            nextCursor: cursor ? null : 'page-two',
          },
        },
      }
    }
    if (path === '/api/v1/achievements') return { data: { data: [badge] } }
    if (String(path).includes('/rewind/insights'))
      return {
        data: {
          data: {
            coverage: { completedSessions: 6 },
            progress: { consistency: 86 },
          },
        },
      }
    return {
      data: {
        data: {
          summary: {
            totalGoals: 8,
            totalCheckIns: 42,
            currentStreak: 14,
            longestStreak: 21,
            completionRate: 88,
            averageProgress: 72,
          },
        },
      },
    }
  })
  vi.mocked(http.post).mockResolvedValue({ data: {} })
  controls.exportCard.mockResolvedValue(true)
})
afterEach(() => {
  cleanup()
  client.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (originalScrollTo)
    Object.defineProperty(Element.prototype, 'scrollTo', originalScrollTo)
  else Reflect.deleteProperty(Element.prototype, 'scrollTo')
})

function showFeed(): void {
  render(
    <QueryClientProvider client={client}>
      <FlexxV2AppScreen />
    </QueryClientProvider>,
  )
}

function openFlexxFilters(): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name: /Choose Flexx filter/ }))
  const lastCall = controls.present.mock.calls.at(-1)
  const sheetContent = lastCall?.[0]
  if (!isValidElement(sheetContent))
    throw new Error('Missing Flexx filter sheet')
  render(sheetContent)
  return screen.getByRole('group', { name: 'Flexx feed categories' })
}

function selectFlexxCategory(label: string): void {
  const options = openFlexxFilters()
  const accessibleName =
    label === 'Mix' ? 'Show mixed Flexx feed' : `Show ${label} Flexx`
  fireEvent.click(within(options).getByRole('button', { name: accessibleName }))
}

function activePost(): HTMLElement {
  const post = screen
    .getAllByRole('article')
    .find((element) => element.getAttribute('aria-current') === 'true')
  if (!post) throw new Error('No active post')
  return post
}

it('renders the feed with real stats and useful editorial copy instead of a counter', async () => {
  showFeed()
  expect(screen.queryByTestId('tab-header-back')).toBeNull()
  const feed = screen.getByRole('region', { name: 'Your Flexx feed' })
  expect(feed.classList.contains('snap-y')).toBe(true)
  const filterCta = screen.getByRole('button', {
    name: 'Choose Flexx filter. Current selection: Mix',
  })
  expect(filterCta.closest('header')).not.toBeNull()
  expect(screen.queryByRole('group', { name: 'Flexx feed filters' })).toBeNull()
  const tabBarSpace = screen.getByTestId('flexx-tab-bar-space')
  expect(feed.nextElementSibling).toBe(tabBarSpace)
  expect(tabBarSpace.getAttribute('aria-hidden')).toBe('true')
  expect(tabBarSpace.getAttribute('style')).toContain('100px')
  expect(screen.getAllByRole('article').length).toBeGreaterThanOrEqual(10)
  expect(screen.queryByText(/\/ 05/)).toBeNull()
  expect(screen.queryByText('Scroll to explore')).toBeNull()
  expect(screen.queryByText('The little things add up.')).toBeNull()
  await waitFor(() =>
    expect(
      within(activePost())
        .getByRole('button', { name: 'Share Daily Flexx' })
        .hasAttribute('disabled'),
    ).toBe(false),
  )
  expect(
    within(activePost()).getByText(/42 check-ins|14 days|21 days|8 tasks/),
  ).toBeDefined()
  expect(
    activePost().querySelector('[data-flexx-post-kind="partner-note"]'),
  ).not.toBeNull()
  expect(activePost().querySelector('[data-flexx-editorial]')).not.toBeNull()
  expect(
    within(activePost()).getByText(
      'A check-in can be a reset, not a report card.',
    ),
  ).toBeDefined()
  expect(screen.queryByRole('button', { name: 'Next Flexx' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Previous Flexx' })).toBeNull()
  fireEvent.keyDown(feed, { key: 'ArrowDown' })
  await waitFor(() => expect(feed.scrollTop).toBe(600))
  const filterOptions = openFlexxFilters()
  expect(filterOptions.querySelectorAll('button')).toHaveLength(6)
  expect(
    within(filterOptions).getByRole('button', { name: 'Show Daily Flexx' }),
  ).toBeDefined()
  fireEvent.click(
    within(filterOptions).getByRole('button', { name: 'Show Weekly Flexx' }),
  )
  expect(controls.dismiss).toHaveBeenCalledOnce()
  await waitFor(() =>
    expect(
      screen.getByRole('button', {
        name: 'Choose Flexx filter. Current selection: Weekly',
      }),
    ).toBeDefined(),
  )
  expect(feed.scrollTop).toBe(0)
  expect(activePost().dataset.flexxPost).toBe('weekly')
  expect(
    activePost().querySelector('[data-flexx-layout]')?.className,
  ).not.toContain('rounded')
})

it('starts quiet and crossfades to a different soundtrack for the next slide after opt-in', async () => {
  const playedSources: string[] = []
  const players: HTMLMediaElement[] = []
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement,
  ): Promise<void> {
    playedSources.push(this.src)
    players.push(this)
    return Promise.resolve()
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  showFeed()
  expect(playedSources).toHaveLength(0)
  await waitFor(() =>
    expect(activePost().dataset.designId).toBe('generated:all:first:0'),
  )

  const feed = screen.getByRole('region', { name: 'Your Flexx feed' })
  const soundButton = within(activePost()).getByRole('button', {
    name: 'Turn on Flexx music',
  })
  fireEvent.click(soundButton)
  await waitFor(() => expect(playedSources).toHaveLength(1))
  expect(soundButton.getAttribute('aria-pressed')).toBe('true')

  fireEvent.keyDown(feed, { key: 'ArrowDown' })
  await waitFor(() => expect(playedSources).toHaveLength(2))
  expect(playedSources[0]).toContain('/audio/flexx/')
  expect(playedSources[1]).not.toBe(playedSources[0])
  await waitFor(() => expect(players[1]?.volume).toBe(0.12))
  expect(players[0]?.volume).toBe(0)
  expect(
    within(activePost()).getByRole('button', { name: 'Mute Flexx music' }),
  ).toBeDefined()
})

it('mixes persisted questions into the first published page without a wall of starters', async () => {
  showFeed()
  const posts = await waitFor(() => {
    const currentPosts = screen.getAllByRole('article')
    if (!currentPosts[0]?.dataset.designId?.startsWith('generated:'))
      throw new Error('Scheduled swipe batch has not loaded')
    return currentPosts
  })
  expect(
    posts.some((post) => post.dataset.designId?.startsWith('starter:')),
  ).toBe(false)
  expect(
    [3, 4, 7, 8].map((index) =>
      posts.findIndex(
        (post) => post.dataset.designId === `generated:all:first:${index}`,
      ),
    ),
  ).toEqual([2, 4, 6, 8])
})

it('uses a vertical Like/Share/Sound rail outside the poster and remembers a like after remount', async () => {
  showFeed()
  await waitFor(() =>
    expect(activePost().dataset.designId).toBe('generated:all:first:0'),
  )
  const post = activePost()
  const like = await within(post).findByRole('button', {
    name: 'Like Daily Flexx',
  })
  await waitFor(() => expect(like.hasAttribute('disabled')).toBe(false))
  const actions = within(post).getByRole('group', {
    name: 'Daily Flexx actions',
  })
  expect(actions.classList.contains('flex-col')).toBe(true)
  expect(actions.querySelectorAll('button')).toHaveLength(3)
  expect(post.querySelector('[data-flexx-layout]')?.contains(actions)).toBe(
    false,
  )
  expect(like.getAttribute('aria-pressed')).toBe('false')
  fireEvent.click(like)
  expect(
    within(post)
      .getByRole('button', { name: 'Unlike Daily Flexx' })
      .getAttribute('aria-pressed'),
  ).toBe('true')
  cleanup()
  showFeed()
  const unlike = await within(activePost()).findByRole('button', {
    name: 'Unlike Daily Flexx',
  })
  fireEvent.click(unlike)
  expect(
    within(activePost())
      .getByRole('button', { name: 'Like Daily Flexx' })
      .getAttribute('aria-pressed'),
  ).toBe('false')
})

it('places only partner authors and overlapping partner groups above Like', async () => {
  showFeed()
  const feed = screen.getByRole('region', { name: 'Your Flexx feed' })
  const modes = [
    'Flexx by Lyra, Vybaa AI partner',
    'Flexx by Jake, Vybaa AI partner',
    'Flexx by Ella & Lyra, Vybaa AI partners',
  ]
  for (const [index, name] of modes.entries()) {
    await waitFor(() =>
      expect(screen.getAllByRole('article')[0]?.dataset.designId).toBe(
        'generated:all:first:0',
      ),
    )
    const position = index === 2 ? 3 : index
    fireEvent.keyDown(feed, { key: 'Home' })
    act(() => {
      feed.scrollTop = position * 600
      fireEvent.scroll(feed)
    })
    await waitFor(() =>
      expect(activePost().dataset.flexxPost).toBe(FLEXX_CATEGORIES[index]),
    )
    const author = within(activePost()).getByRole('img', { name })
    const like = within(activePost()).getByRole('button', { name: /^Like / })
    expect(
      author.compareDocumentPosition(like) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(author.textContent).not.toMatch(/You|ada/)
    if (index === 2) expect(author.querySelectorAll('img')).toHaveLength(2)
  }
})

it('shows AI partner reactions without popularity numbers and does not regenerate on liking', async () => {
  showFeed()
  await waitFor(() =>
    expect(screen.getAllByRole('article')[0]?.dataset.designId).toBe(
      'generated:all:first:0',
    ),
  )
  const posts = screen.getAllByRole('article')
  const index = posts.findIndex((post) =>
    post.dataset.designId?.startsWith('generated:'),
  )
  expect(index).toBe(0)
  const feed = screen.getByRole('region', { name: 'Your Flexx feed' })
  act(() => {
    feed.scrollTop = index * 600
    fireEvent.scroll(feed)
  })
  await waitFor(() =>
    expect(activePost().dataset.designId).toBe(posts[index].dataset.designId),
  )
  const like = within(activePost()).getByRole('button', { name: /^Like / })
  expect(
    within(activePost()).getByRole('img', {
      name: 'Liked by Ella, Tobi, AI partners',
    }),
  ).toBeDefined()
  expect(within(activePost()).queryByText('simulated')).toBeNull()
  const requests = vi.mocked(http.get).mock.calls.length
  fireEvent.click(like)
  expect(like.getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(like)
  expect(like.getAttribute('aria-pressed')).toBe('false')
  expect(vi.mocked(http.get).mock.calls.length).toBe(requests)
})

it('loads Daily independently of a stalled Rewind request', async () => {
  const original = vi.mocked(http.get).getMockImplementation()
  vi.mocked(http.get).mockImplementation((path, options) => {
    if (String(path).includes('/rewind/insights')) return new Promise(() => {})
    if (!original) throw new Error('Missing HTTP fixture')
    return original(path, options)
  })
  showFeed()
  await waitFor(() =>
    expect(
      within(activePost())
        .getByRole('button', { name: 'Share Daily Flexx' })
        .hasAttribute('disabled'),
    ).toBe(false),
  )
  selectFlexxCategory('Rewind')
  expect(
    within(activePost()).getByRole('status', { name: 'Loading rewind card' }),
  ).toBeDefined()
  expect(
    within(activePost())
      .getByRole('button', { name: 'Share Rewind Flexx' })
      .hasAttribute('disabled'),
  ).toBe(true)
})

it('preserves the recommended card and achievement selection', async () => {
  sessionStorage.setItem(
    'rewind:flexx-recommendation',
    JSON.stringify({ cardType: 'achievement', achievementId: badge.id }),
  )
  showFeed()
  await screen.findByText('Two weeks strong')
  await waitFor(() =>
    expect(activePost().dataset.designId).toBe('generated:all:first:9'),
  )
  expect(
    screen.getByRole('region', { name: 'Your Flexx feed' }).scrollTop,
  ).toBe(5400)
  expect(sessionStorage.getItem('rewind:flexx-recommendation')).toBeNull()
  fireEvent.click(
    within(activePost()).getByRole('button', {
      name: 'Change achievement to Flexx',
    }),
  )
  const picker = controls.present.mock.calls[0]?.[0]
  if (!isValidElement<AchievementSelectorProps>(picker))
    throw new Error('Missing achievement picker')
  act(() =>
    picker.props.onSelect({
      ...badge,
      id: 'another',
      title: 'Another milestone',
    }),
  )
  expect(screen.getByText('Another milestone')).toBeDefined()
  expect(controls.dismiss).toHaveBeenCalledOnce()
})

it('keeps other cards usable while a failed Rewind section retries independently', async () => {
  const original = vi.mocked(http.get).getMockImplementation()
  let fail = true
  vi.mocked(http.get).mockImplementation((path, options) => {
    if (String(path).includes('/rewind/insights') && fail)
      return Promise.reject(new Error('Offline'))
    if (!original) throw new Error('Missing HTTP fixture')
    return original(path, options)
  })
  showFeed()
  await waitFor(() =>
    expect(
      within(activePost())
        .getByRole('button', { name: 'Share Daily Flexx' })
        .hasAttribute('disabled'),
    ).toBe(false),
  )
  expect(
    within(activePost())
      .getByRole('button', { name: 'Share Daily Flexx' })
      .hasAttribute('disabled'),
  ).toBe(false)
  selectFlexxCategory('Rewind')
  const rewind = activePost()
  await within(rewind).findByText("This design couldn't load.")
  fail = false
  fireEvent.click(
    within(rewind).getByRole('button', { name: 'Retry loading this section' }),
  )
  await waitFor(() =>
    expect(
      within(activePost())
        .getByRole('button', { name: 'Share Rewind Flexx' })
        .hasAttribute('disabled'),
    ).toBe(false),
  )
})

it('ignores malformed recommendations without changing the default card', () => {
  sessionStorage.setItem('rewind:flexx-recommendation', '{not json')
  showFeed()
  const filters = openFlexxFilters()
  expect(
    within(filters)
      .getByRole('button', { name: 'Show mixed Flexx feed' })
      .getAttribute('aria-pressed'),
  ).toBe('true')
})

it('exports the selected post and records activity only after successful sharing', async () => {
  showFeed()
  await waitFor(() =>
    expect(
      within(activePost())
        .getByRole('button', { name: 'Share Daily Flexx' })
        .hasAttribute('disabled'),
    ).toBe(false),
  )
  fireEvent.click(
    within(activePost()).getByRole('button', { name: 'Share Daily Flexx' }),
  )
  const share = controls.present.mock.calls[0]?.[0]
  if (!isValidElement<ShareBottomSheetContentProps>(share))
    throw new Error('Missing share sheet')
  expect(share.props.cardType).toBe('daily')
  expect(share.props.cardRef.closest('article')?.dataset.flexxPost).toBe(
    'daily',
  )
  controls.exportCard.mockResolvedValueOnce(false)
  await share.props.onShare(share.props.cardRef)
  expect(http.post).not.toHaveBeenCalled()
  await share.props.onShare(share.props.cardRef)
  expect(controls.exportCard).toHaveBeenCalledWith(share.props.cardRef)
  expect(http.post).toHaveBeenCalledWith(
    '/api/v1/rewind/activity',
    expect.objectContaining({ eventType: 'FLEXX_SHARED' }),
  )
})

it('appends cached batches near the end without refetching per swipe or mounting every poster', async () => {
  showFeed()
  const feed = screen.getByRole('region', { name: 'Your Flexx feed' })
  await waitFor(() =>
    expect(screen.getAllByRole('article')[0]?.dataset.designId).toBe(
      'generated:all:first:0',
    ),
  )
  const before = screen.getAllByRole('article').length
  const requests = (): number =>
    vi
      .mocked(http.get)
      .mock.calls.filter(([path]) => path === '/api/v1/flexx/designs').length
  expect(requests()).toBe(1)
  act(() => {
    feed.scrollTop = (before - 3) * 600
    fireEvent.scroll(feed)
  })
  await waitFor(() => expect(requests()).toBe(2))
  await waitFor(() =>
    expect(screen.getAllByRole('article').length).toBeGreaterThan(before),
  )
  expect(feed.scrollTop).toBe((before - 3) * 600)
  expect(
    feed.querySelectorAll('[data-flexx-layout]').length,
  ).toBeLessThanOrEqual(5)
  fireEvent.scroll(feed)
  await new Promise((resolve) => setTimeout(resolve, 30))
  expect(requests()).toBe(2)
})

it('animates only the active poster without a manual playback button', async () => {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  showFeed()
  await waitFor(() =>
    expect(activePost().querySelector('[data-flexx-animate]')).not.toBeNull(),
  )
  const feed = screen.getByRole('region', { name: 'Your Flexx feed' })
  expect(feed.querySelectorAll('[data-flexx-animate="true"]')).toHaveLength(1)
  expect(screen.queryByRole('button', { name: /Flexx animations/ })).toBeNull()
})

it('keeps saved questions usable for a new user without displaying zero stats or empty badges', async () => {
  const original = vi.mocked(http.get).getMockImplementation()
  vi.mocked(http.get).mockImplementation((path, options) => {
    if (String(path).includes('/rewind/insights'))
      return Promise.resolve({
        data: { data: { coverage: { completedSessions: 0 }, progress: null } },
      })
    if (path === '/api/v1/achievements')
      return Promise.resolve({ data: { data: [] } })
    if (path !== '/api/v1/flexx/designs')
      return Promise.resolve({
        data: {
          data: {
            summary: {
              totalGoals: 0,
              totalCheckIns: 0,
              currentStreak: 0,
              longestStreak: 0,
              completionRate: 0,
              averageProgress: 0,
            },
          },
        },
      })
    if (!original) throw new Error('Missing HTTP fixture')
    return original(path, options)
  })
  showFeed()
  await waitFor(() =>
    expect(activePost().dataset.designId).toContain('generated:'),
  )
  expect(
    screen
      .getAllByRole('article')
      .every((post) => post.dataset.flexxPost === 'rewind'),
  ).toBe(true)
  expect(screen.queryByText('0%')).toBeNull()
  expect(screen.queryByText('Choose an achievement')).toBeNull()
  expect(screen.getByText('What felt most present today?')).toBeTruthy()
})

it('shows an honest empty category and does not automatically scan every saved page', async () => {
  const original = vi.mocked(http.get).getMockImplementation()
  vi.mocked(http.get).mockImplementation((path, options) => {
    if (
      String(path).includes('/insights') &&
      !String(path).includes('/rewind/')
    )
      return Promise.resolve({
        data: {
          data: {
            summary: {
              totalGoals: 0,
              totalCheckIns: 0,
              currentStreak: 0,
              longestStreak: 0,
              completionRate: 0,
              averageProgress: 0,
            },
          },
        },
      })
    if (!original) throw new Error('Missing HTTP fixture')
    return original(path, options)
  })
  showFeed()
  selectFlexxCategory('Daily')
  await screen.findByText('Nothing to share in this view yet.')
  expect(screen.queryAllByRole('article')).toHaveLength(0)
  expect(screen.getByRole('button', { name: 'Explore Mix' })).toBeTruthy()
  await waitFor(() =>
    expect(
      vi
        .mocked(http.get)
        .mock.calls.filter(
          ([path, options]) =>
            path === '/api/v1/flexx/designs' &&
            options?.params?.category === 'daily',
        ),
    ).toHaveLength(1),
  )
})
