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
    closeToBack,
  }: {
    title: ReactNode
    children: ReactNode
    closeToBack?: ReactNode
  }) => (
    <header>
      {closeToBack}
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
              (design, index) => ({
                ...design,
                likedBy: index % 2 ? [] : ['ella', 'tobi'],
                id: `generated:${category}:${String(cursor ?? 'first')}:${index}`,
              }),
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

function activePost(): HTMLElement {
  const post = screen
    .getAllByRole('article')
    .find((element) => element.getAttribute('aria-current') === 'true')
  if (!post) throw new Error('No active post')
  return post
}

it('renders many borderless posters, icon filters and real stats without counter or captions', async () => {
  showFeed()
  const feed = screen.getByRole('region', { name: 'Your Flexx feed' })
  expect(feed.classList.contains('snap-y')).toBe(true)
  const categories = screen.getByRole('navigation', {
    name: 'Flexx categories',
  })
  expect(feed.nextElementSibling).toBe(categories)
  expect(categories.classList.contains('bg-cardd')).toBe(true)
  expect(screen.getAllByRole('article').length).toBeGreaterThanOrEqual(10)
  expect(
    screen
      .getByRole('navigation', { name: 'Flexx categories' })
      .querySelectorAll('svg'),
  ).toHaveLength(5)
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
  expect(within(activePost()).getByText('42')).toBeDefined()
  expect(screen.queryByRole('button', { name: 'Next Flexx' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Previous Flexx' })).toBeNull()
  fireEvent.keyDown(feed, { key: 'ArrowDown' })
  await waitFor(() => expect(feed.scrollTop).toBe(600))
  fireEvent.click(screen.getByRole('button', { name: 'Show Weekly Flexx' }))
  await waitFor(() =>
    expect(
      screen
        .getByRole('button', { name: 'Show Weekly Flexx' })
        .getAttribute('aria-pressed'),
    ).toBe('true'),
  )
  expect(feed.scrollTop).toBe(0)
  expect(activePost().dataset.flexxPost).toBe('weekly')
  expect(
    activePost().querySelector('[data-flexx-layout]')?.className,
  ).not.toContain('rounded')
})

it('uses a vertical Like/Share rail outside the exported poster and remembers a like after remount', async () => {
  showFeed()
  const post = activePost()
  const like = await within(post).findByRole('button', {
    name: 'Like Daily Flexx',
  })
  await waitFor(() => expect(like.hasAttribute('disabled')).toBe(false))
  const actions = within(post).getByRole('group', {
    name: 'Daily Flexx actions',
  })
  expect(actions.classList.contains('flex-col')).toBe(true)
  expect(actions.querySelectorAll('button')).toHaveLength(2)
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
    'Flexx by Ella, Vybaa AI partner',
    'Flexx by Lyra, Vybaa AI partner',
    'Flexx by Ella & Lyra, Vybaa AI partners',
  ]
  for (const [index, name] of modes.entries()) {
    fireEvent.keyDown(feed, { key: 'Home' })
    act(() => {
      feed.scrollTop = index * 600
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
    expect(screen.getAllByRole('article').length).toBeGreaterThan(10),
  )
  const posts = screen.getAllByRole('article')
  const index = posts.findIndex((post) =>
    post.dataset.designId?.startsWith('generated:'),
  )
  expect(index).toBeGreaterThanOrEqual(10)
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
  fireEvent.click(screen.getByRole('button', { name: 'Show Rewind Flexx' }))
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
  expect(
    screen.getByRole('region', { name: 'Your Flexx feed' }).scrollTop,
  ).toBe(2400)
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
  fireEvent.click(screen.getByRole('button', { name: 'Show Rewind Flexx' }))
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
  expect(
    screen
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
    expect(screen.getAllByRole('article').length).toBeGreaterThan(10),
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

it('animates only the active poster and offers pause/resume without requesting another design batch', async () => {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  showFeed()
  await waitFor(() =>
    expect(activePost().querySelector('[data-flexx-animate]')).not.toBeNull(),
  )
  const feed = screen.getByRole('region', { name: 'Your Flexx feed' })
  expect(feed.querySelectorAll('[data-flexx-animate="true"]')).toHaveLength(1)
  const requests = vi
    .mocked(http.get)
    .mock.calls.filter(([path]) => path === '/api/v1/flexx/designs').length
  fireEvent.click(
    screen.getByRole('button', { name: 'Pause Flexx animations' }),
  )
  expect(feed.querySelectorAll('[data-flexx-animate="true"]')).toHaveLength(0)
  fireEvent.click(
    screen.getByRole('button', { name: 'Resume Flexx animations' }),
  )
  expect(feed.querySelectorAll('[data-flexx-animate="true"]')).toHaveLength(1)
  expect(
    vi
      .mocked(http.get)
      .mock.calls.filter(([path]) => path === '/api/v1/flexx/designs'),
  ).toHaveLength(requests)
})
