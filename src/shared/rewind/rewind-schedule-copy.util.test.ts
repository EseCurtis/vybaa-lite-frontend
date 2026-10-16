import { expect, it } from 'vitest'

import type { RewindRoutineOverview } from '@/shared/api/rewind.api'
import {
  getRewindScheduleCopy,
  formatRewindCountdown,
} from './rewind-schedule-copy.util'

const now = Date.parse('2026-10-16T09:00:00Z')
const overview: RewindRoutineOverview = {
  timezone: 'Africa/Lagos',
  currentSession: null,
  latestSession: {
    id: 'yesterday',
    status: 'COMPLETED',
    scheduledFor: '2026-10-15T11:00:00Z',
    windowEndsAt: '2026-10-15T12:00:00Z',
  },
  nextSession: {
    id: 'today-noon',
    status: 'SCHEDULED',
    scheduledFor: '2026-10-16T11:00:00Z',
    windowEndsAt: '2026-10-16T12:00:00Z',
  },
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
}

it('uses the scheduled timezone, real remaining time, and the selected partner’s voice', () => {
  const tobi = getRewindScheduleCopy({
    overview,
    now,
    personaId: 'tobi',
    seed: 'user',
  })
  const lyra = getRewindScheduleCopy({
    overview,
    now,
    personaId: 'lyra',
    seed: 'user',
  })
  expect(tobi.text).toContain('12pm')
  expect(tobi.text).toContain('2hrs')
  expect(tobi.text).not.toEqual(lyra.text)
  expect(tobi.available).toBe(false)
})

it('keeps phrasing stable while occasional countdowns tick down to opening', () => {
  const seed = Array.from({ length: 20 }, (_, index) => `user-${index}`).find(
    (candidate) =>
      getRewindScheduleCopy({
        overview,
        now,
        personaId: 'ella',
        seed: candidate,
      }).countdown,
  )
  expect(seed).toBeDefined()
  const first = getRewindScheduleCopy({
    overview,
    now,
    personaId: 'ella',
    seed: seed ?? '',
  })
  const next = getRewindScheduleCopy({
    overview,
    now: now + 1000,
    personaId: 'ella',
    seed: seed ?? '',
  })
  expect(first.text).toEqual(next.text)
  expect(first.countdown).toBe('02:00:00')
  expect(next.countdown).toBe('01:59:59')
  expect(formatRewindCountdown(-1000)).toBe('00:00:00')
})

it('opens on time even before the routine refetch returns and closes after the window', () => {
  expect(
    getRewindScheduleCopy({
      overview,
      now: Date.parse('2026-10-16T11:00:00Z'),
      personaId: 'neeja',
      seed: 'user',
    }).available,
  ).toBe(true)
  expect(
    getRewindScheduleCopy({
      overview,
      now: Date.parse('2026-10-16T12:00:00Z'),
      personaId: 'neeja',
      seed: 'user',
    }).available,
  ).toBe(false)
})

it('keeps half-hour timezones and tomorrow wording accurate', () => {
  const tomorrow = {
    ...overview,
    timezone: 'Asia/Kolkata',
    nextSession: {
      id: 'tomorrow',
      status: 'SCHEDULED' as const,
      windowEndsAt: '2026-10-17T08:00:00Z',
      scheduledFor: '2026-10-17T07:00:00Z',
    },
  }
  const message = getRewindScheduleCopy({
    overview: tomorrow,
    now,
    personaId: 'ariel',
    seed: 'user',
  })
  expect(message.text).toContain('tomorrow at 12:30pm')
})
