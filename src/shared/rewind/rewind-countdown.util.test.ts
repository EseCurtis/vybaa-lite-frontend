import { expect, it } from 'vitest'

import type { RewindRoutineOverview } from '@/shared/api/rewind.api'
import { getRewindCountdownState } from './rewind-countdown.util'

const target = Date.parse('2026-10-16T11:00:00Z')
const overview = {
  timezone: 'Africa/Lagos',
  routine: {
    id: 'routine',
    frequency: 'JUST_MORNINGS',
    times: ['12:00'],
    intent: 'SPOT_PATTERNS',
    customIntent: null,
    enabled: true,
    createdAt: '',
    updatedAt: '',
  },
  currentSession: null,
  latestSession: {
    id: 'yesterday',
    status: 'COMPLETED',
    scheduledFor: '2026-10-15T11:00:00Z',
    windowEndsAt: '2026-10-15T12:00:00Z',
  },
  nextSession: {
    id: 'today',
    status: 'SCHEDULED',
    scheduledFor: '2026-10-16T11:00:00Z',
    windowEndsAt: '2026-10-16T12:00:00Z',
  },
} satisfies RewindRoutineOverview

it('Flexible is ready at any hour without a fake countdown or expiry', () => {
  const routine = {
    ...overview.routine,
    frequency: 'FLEXIBLE',
    times: [],
  } as const
  const flexible: RewindRoutineOverview = {
    ...overview,
    routine: { ...routine, times: [] },
    nextSession: null,
  }
  for (const time of [target, target + 86_400_000, target - 86_400_000]) {
    expect(getRewindCountdownState(flexible, time)).toEqual({
      status: 'ready',
      boundary: null,
      resume: false,
    })
  }
  expect(
    getRewindCountdownState(
      {
        ...flexible,
        currentSession: {
          id: 'active',
          status: 'IN_PROGRESS',
          scheduledFor: null,
          windowEndsAt: null,
        },
      },
      target,
    ),
  ).toEqual({ status: 'ready', boundary: null, resume: true })
  expect(
    getRewindCountdownState(
      {
        ...flexible,
        routine: { ...routine, times: [], enabled: false },
      },
      target,
    ),
  ).toEqual({ status: 'idle', boundary: null })
})

it('ticks the actual countdown without drifting', () => {
  expect(getRewindCountdownState(overview, target - 12 * 3_600_000)).toEqual({
    status: 'waiting',
    boundary: target,
    label: '12:00:00',
  })
  const later = getRewindCountdownState(
    overview,
    target - 12 * 3_600_000 + 1000,
  )
  expect(later.status).toBe('waiting')
  if (later.status !== 'waiting') throw new Error('Expected countdown')
  expect(later.label).toBe('11:59:59')
})

it('switches to ready precisely at opening and stops advertising expired windows', () => {
  expect(getRewindCountdownState(overview, target)).toEqual({
    status: 'ready',
    boundary: target + 3_600_000,
    resume: false,
  })
  expect(getRewindCountdownState(overview, target + 3_600_000)).toEqual({
    status: 'idle',
    boundary: null,
  })
})

it('shows resume for an active session, not for a completed session', () => {
  const current = {
    ...overview,
    currentSession: {
      id: 'active',
      status: 'IN_PROGRESS',
      scheduledFor: '2026-10-16T10:00:00Z',
      windowEndsAt: '2026-10-16T11:00:00Z',
    },
  } satisfies RewindRoutineOverview
  expect(getRewindCountdownState(current, target - 1000)).toEqual({
    status: 'ready',
    boundary: target,
    resume: true,
  })
  expect(
    getRewindCountdownState(
      {
        ...current,
        currentSession: { ...current.currentSession, status: 'COMPLETED' },
      },
      target - 1000,
    ).status,
  ).toBe('waiting')
})

it('counts down to the next configured session even without previous occurrences', () => {
  const twiceDaily: RewindRoutineOverview = {
    ...overview,
    latestSession: null,
    routine: {
      ...overview.routine,
      frequency: 'MORNINGS_AND_EVENINGS',
      times: ['08:00', '20:00'],
    },
    nextSession: {
      id: 'evening',
      status: 'SCHEDULED',
      scheduledFor: '2026-10-16T19:00:00Z',
      windowEndsAt: '2026-10-16T20:00:00Z',
    },
  }
  const result = getRewindCountdownState(
    twiceDaily,
    Date.parse('2026-10-16T13:00:00Z'),
  )
  expect(result.status).toBe('waiting')
  if (result.status !== 'waiting') throw new Error('Expected countdown')
  expect(result.label).toBe('06:00:00')
})

it('does not invent a countdown for missing, disabled, invalid, or completed schedules', () => {
  const idle = { status: 'idle', boundary: null }
  expect(getRewindCountdownState(undefined, target)).toEqual(idle)
  expect(
    getRewindCountdownState({ ...overview, routine: null }, target),
  ).toEqual(idle)
  expect(
    getRewindCountdownState(
      { ...overview, routine: { ...overview.routine, enabled: false } },
      target,
    ),
  ).toEqual(idle)
  expect(
    getRewindCountdownState(
      {
        ...overview,
        nextSession: {
          id: 'bad',
          status: 'SCHEDULED',
          scheduledFor: 'invalid',
          windowEndsAt: null,
        },
      },
      target,
    ),
  ).toEqual(idle)
  expect(
    getRewindCountdownState(
      {
        ...overview,
        nextSession: { ...overview.nextSession, status: 'COMPLETED' },
      },
      target - 1000,
    ),
  ).toEqual(idle)
})
