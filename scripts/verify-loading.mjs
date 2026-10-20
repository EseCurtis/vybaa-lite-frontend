import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

// Supply a local Playwright module path if it is not installed in this project.
const { chromium } = await import(process.argv[2] ?? 'playwright')
const base = process.argv[3] ?? 'http://127.0.0.1:3017'
const output = process.argv[4] ?? '/tmp/vybaa-loading-qa'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
  timezoneId: 'Africa/Lagos',
})
const page = await context.newPage()
const errors = []
const requests = []
page.on('pageerror', (error) => errors.push(error.message))

const user = {
  id: 'loading-qa',
  email: 'loading@example.test',
  firstName: 'Ada',
  lastName: 'Test',
  username: 'loading_qa',
  isConfirmed: true,
  isFirstTime: false,
  rewindPersona: 'ella',
  timezone: 'Africa/Lagos',
  createdAt: '',
  updatedAt: '',
}
let releaseSession
let releaseGoals
let releaseAchievements
const session = new Promise((resolve) => {
  releaseSession = resolve
})
const goals = new Promise((resolve) => {
  releaseGoals = resolve
})
const achievements = new Promise((resolve) => {
  releaseAchievements = resolve
})
let failSession = false
const goal = {
  id: 'goal-qa',
  title: 'Read for ten minutes',
  status: 'ACTIVE',
  target: { type: 'CHECK_IN_COUNT', count: 21 },
  progress: {
    completedOccurrences: 2,
    value: 2,
    percentage: 10,
    adherenceRate: 100,
    currentStreak: 2,
    longestStreak: 2,
    missedOccurrences: 0,
  },
  schedule: {
    type: 'DAILY',
    startDate: '2026-10-16',
    weekdays: [],
    endDate: null,
  },
  nextOccurrence: {
    id: 'occurrence',
    dueDate: '2026-10-16',
    status: 'PENDING',
    closesAt: '',
  },
  isDue: true,
  isOverdue: false,
  reward: { totalPotential: 0, milestones: [] },
}

await context.addInitScript(() => {
  localStorage.setItem('authToken', 'qa-not-a-real-token')
  localStorage.setItem('refreshToken', 'qa-not-a-real-refresh-token')
  for (const id of ['home-main', 'goals-library', 'rewind-main'])
    localStorage.setItem(`vybaa:walkthrough:v1:${id}:loading-qa`, 'true')
})
await context.route(
  (url) => /^\/api\/v[12]\//.test(url.pathname),
  async (route) => {
    const url = new URL(route.request().url())
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        },
      })
      return
    }
    requests.push(url.pathname + url.search)
    let response = { msg: 'ok', data: {} }
    let status = 200
    if (url.pathname.endsWith('/auth/session')) {
      await session
      response = { msg: 'ok', data: { user, isFirstTime: false } }
      if (failSession) {
        status = 503
        response = { msg: 'Temporary outage' }
      }
    } else if (url.pathname === '/api/v2/goals') {
      if (url.searchParams.get('filter') === 'DUE') await goals
      response = {
        msg: 'ok',
        data: [goal],
        pagination: { hasMore: false, nextCursor: null },
      }
    } else if (url.pathname === '/api/v1/insights') {
      response = {
        msg: 'ok',
        data: {
          summary: {
            totalGoals: 3,
            totalCheckIns: 7,
            completedDays: 7,
            totalDays: 10,
            averageProgress: 70,
            longestStreak: 7,
            completionRate: 70,
            currentStreak: 7,
          },
          chartData: [],
        },
      }
    } else if (url.pathname === '/api/v1/achievements') {
      await achievements
      response = { msg: 'ok', data: [] }
    } else if (url.pathname.endsWith('/rewind/insights')) {
      response = {
        msg: 'ok',
        data: {
          range: '7d',
          coverage: { completedDays: 0, completedSessions: 0, days: 7 },
          hasSufficientData: false,
          signals: null,
          deltas: null,
          progress: null,
          contextualInsight: null,
        },
      }
    } else if (url.pathname.endsWith('/rewind/home-greeting')) {
      response = {
        msg: 'ok',
        data: {
          personaId: 'ella',
          chatId: 'ella-qa',
          message: 'A little room for your day.',
          title: 'Hello',
          sourceTypes: [],
          date: null,
        },
      }
    } else if (url.pathname.endsWith('/rewind/chats')) {
      response = { msg: 'ok', data: { chats: [] } }
    } else if (url.pathname.endsWith('/rewind/routine')) {
      response = {
        msg: 'ok',
        data: {
          timezone: 'Africa/Lagos',
          routine: { id: 'routine', enabled: true, times: ['20:00'] },
          currentSession: null,
          latestSession: null,
          nextSession: {
            id: 'next',
            status: 'SCHEDULED',
            scheduledFor: new Date(Date.now() + 7200000).toISOString(),
            windowEndsAt: new Date(Date.now() + 10800000).toISOString(),
          },
        },
      }
    } else if (url.pathname.endsWith('/notifications/unread-count')) {
      response = { msg: 'ok', data: { count: 0 } }
    }
    await route
      .fulfill({
        status,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify(response),
      })
      .catch((error) => {
        if (!route.request().failure()) throw error
      })
  },
)

try {
  const sessionRequest = page.waitForRequest((request) =>
    request.url().endsWith('/auth/session'),
  )
  await page.goto(`${base}/app/home`, { waitUntil: 'domcontentloaded' })
  await sessionRequest
  assert.equal(
    await page
      .locator('body')
      .evaluate((body) => body.classList.contains('loaded')),
    false,
  )
  await page.screenshot({ path: `${output}/01-startup.png` })
  releaseSession()
  await page
    .locator('[data-testid="home-action-rewind"]')
    .waitFor({ state: 'visible' })
  await page.waitForFunction(() => document.body.classList.contains('loaded'))
  assert.equal(await page.getByText('Clean slate, mate!').count(), 0)
  assert.equal(
    await page.getByRole('status', { name: 'Loading your goals' }).count(),
    1,
  )
  assert.equal(
    await page
      .locator('.vybaa-skeleton')
      .first()
      .evaluate((element) => getComputedStyle(element).animationName),
    'none',
  )
  await page.screenshot({ path: `${output}/02-progressive-home.png` })
  const before = await page
    .locator('[data-testid="home-action-rewind"]')
    .boundingBox()
  releaseGoals()
  await page
    .getByRole('button', { name: 'Read for ten minutes', exact: true })
    .waitFor()
  const after = await page
    .locator('[data-testid="home-action-rewind"]')
    .boundingBox()
  assert.ok(
    Math.abs(before.y - after.y) <= 2,
    `Goal replacement shifted the CTA by ${after.y - before.y}px`,
  )
  const goalRequestCount = requests.filter(
    (url) => url.includes('/api/v2/goals?') && url.includes('filter=DUE'),
  ).length
  await page.getByRole('button', { name: 'See all', exact: true }).click()
  await page.waitForURL(/\/app\/goal(?:\?|$)/)
  await page.goBack()
  await page
    .locator('[data-testid="home-action-rewind"]')
    .waitFor({ state: 'visible' })
  assert.equal(
    requests.filter(
      (url) => url.includes('/api/v2/goals?') && url.includes('filter=DUE'),
    ).length,
    goalRequestCount,
  )
  assert.equal(
    await page
      .locator('#startup-splash')
      .evaluate((element) => getComputedStyle(element).visibility),
    'hidden',
  )
  assert.equal(
    requests.filter((url) => url.endsWith('/api/v2/rewind/chats')).length,
    0,
  )
  await page.locator('[data-testid="home-action-flexx"]').click()
  await page
    .getByText("Today's Discipline", { exact: true })
    .waitFor({ state: 'visible' })
  assert.equal(
    await page
      .getByRole('status', { name: 'Loading achievement card' })
      .count(),
    1,
  )
  await page.screenshot({ path: `${output}/05-progressive-flexx.png` })
  releaseAchievements()
  await page.goBack()
  await page
    .locator('[data-testid="home-action-rewind"]')
    .waitFor({ state: 'visible' })
  await context.setOffline(true)
  await page
    .getByText('Offline · Saved content is still available', { exact: true })
    .waitFor()
  assert.equal(
    await page
      .getByRole('button', { name: 'Read for ten minutes', exact: true })
      .count(),
    1,
  )
  await context.setOffline(false)
  await page.screenshot({ path: `${output}/03-cached-home.png` })
  failSession = true
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page
    .getByText("Couldn't restore your session", { exact: true })
    .waitFor()
  assert.ok(
    await page.evaluate(() => Boolean(localStorage.getItem('authToken'))),
  )
  await page.screenshot({ path: `${output}/04-startup-recovery.png` })
  failSession = false
  await page.getByRole('button', { name: 'Retry loading this section' }).click()
  await page
    .locator('[data-testid="home-action-rewind"]')
    .waitFor({ state: 'visible' })
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify(
      {
        passed: [
          'startup-only splash',
          'progressive home while goals are pending',
          'no false empty state',
          'no CTA layout shift',
          'cached return without another goals request',
          'deferred redundant chat-list fetch',
          'Flexx cards render independently of slow achievements',
          'reduced-motion skeletons are static',
          'offline content retention',
          'retryable startup failure without token loss',
        ],
        screenshots: output,
        goalRequestCount,
      },
      null,
      2,
    ),
  )
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png` })
  console.error(
    JSON.stringify(
      {
        url: page.url(),
        errors,
        requests,
        body: (await page.locator('body').innerText()).slice(0, 600),
      },
      null,
      2,
    ),
  )
  throw error
} finally {
  await browser.close()
}
