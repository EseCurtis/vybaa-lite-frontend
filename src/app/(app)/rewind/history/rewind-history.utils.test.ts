import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { RewindSession } from '@/shared/api/rewind.api'

import {
  getCenteredTabScrollLeft,
  getRewindSessionStatusPresentation,
  formatDayKey,
  formatDayLabel,
  formatSessionDate,
  groupSessionsByDay,
} from './rewind-history.utils'

function session(
  id: string,
  day: string | null,
  createdAt: string,
): RewindSession {
  return {
    id,
    sessionDateKey: day,
    createdAt,
    updatedAt: '2026-10-18T20:00:00Z',
    userId: 'history-user',
    personaId: 'ella',
    status: 'COMPLETED',
    completed: true,
    scheduledFor: null,
    windowEndsAt: null,
    startedAt: null,
    completedAt: null,
    checkInAt: null,
    summary: id,
    emotionalInsight: null,
    emotionalTags: [],
    nextStepNote: null,
    comparisonInsight: null,
    journalDraft: null,
    wellbeingSignals: null,
    journalId: null,
    journalSavedAt: null,
  }
}

describe('reflection chronology', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-18T12:00:00'))
  })
  afterEach(() => vi.useRealTimers())

  it('orders scattered day groups newest first, independent of API arrival or updates', () => {
    const input = [
      session('yesterday', '2026-10-17', '2026-10-17T08:00:00Z'),
      session('old', '2026-10-09', '2026-10-09T08:00:00Z'),
      session('today-morning', '2026-10-18', '2026-10-18T08:00:00Z'),
      session('today-evening', '2026-10-18', '2026-10-18T18:00:00Z'),
    ]
    const groups = groupSessionsByDay(input)
    expect(groups.map((group) => group.dayKey)).toEqual([
      '2026-10-18',
      '2026-10-17',
      '2026-10-09',
    ])
    expect(groups.slice(0, 2).map((group) => group.label)).toEqual([
      'Today',
      'Yesterday',
    ])
    expect(groups[0].sessions.map((entry) => entry.id)).toEqual([
      'today-evening',
      'today-morning',
    ])
    expect(input.map((entry) => entry.id)).toEqual([
      'yesterday',
      'old',
      'today-morning',
      'today-evening',
    ])
  })

  it('merges entries from additional pages into one correctly ordered day', () => {
    const pageOne = [
      session('older', '2026-09-30', '2026-09-30T08:00:00Z'),
      session('today-one', '2026-10-18', '2026-10-18T08:00:00Z'),
    ]
    const pageTwo = [
      session('yesterday', '2026-10-17', '2026-10-17T08:00:00Z'),
      session('today-two', '2026-10-18', '2026-10-18T18:00:00Z'),
    ]
    const groups = groupSessionsByDay([...pageOne, ...pageTwo])
    expect(groups.map((group) => group.dayKey)).toEqual([
      '2026-10-18',
      '2026-10-17',
      '2026-09-30',
    ])
    expect(groups[0].sessions).toHaveLength(2)
  })

  it('groups legacy dates with matching explicit days using a canonical key', () => {
    const timestamp = '2026-10-18T12:00:00'
    const key = formatDayKey(timestamp)
    expect(key).toBe('2026-10-18')
    expect(
      groupSessionsByDay([
        session('legacy', null, timestamp),
        session('modern', key, timestamp),
      ]),
    ).toHaveLength(1)
  })

  it('does not shift date-only labels to the previous day', () => {
    expect(formatDayKey('2026-10-18')).toBe('2026-10-18')
    expect(formatDayLabel('2026-10-18')).toBe('Today')
    expect(formatDayLabel('2026-10-17')).toBe('Yesterday')
    expect(formatSessionDate('2026-09-30')).toBe('Sep 30, 2026')
  })

  it('handles empty history without creating a date group', () => {
    expect(groupSessionsByDay([])).toEqual([])
  })
})

describe('getRewindSessionStatusPresentation', () => {
  it('never labels an elapsed missed Rewind as pending', () => {
    expect(
      getRewindSessionStatusPresentation({
        completed: false,
        status: 'MISSED',
      }).label,
    ).toBe('Missed')
  })

  it('keeps future and active Rewinds distinct from saved reflections', () => {
    expect(
      getRewindSessionStatusPresentation({
        completed: false,
        status: 'SCHEDULED',
      }).label,
    ).toBe('Scheduled')
    expect(
      getRewindSessionStatusPresentation({
        completed: false,
        status: 'IN_PROGRESS',
      }).label,
    ).toBe('Open')
    expect(
      getRewindSessionStatusPresentation({
        completed: true,
        status: 'COMPLETED',
      }).label,
    ).toBe('Saved')
  })
})

describe('getCenteredTabScrollLeft', () => {
  it('centers overflowed tabs and clamps both edges', () => {
    expect(
      getCenteredTabScrollLeft({
        containerWidth: 280,
        scrollWidth: 520,
        tabOffsetLeft: 250,
        tabWidth: 100,
      }),
    ).toBe(160)
    expect(
      getCenteredTabScrollLeft({
        containerWidth: 280,
        scrollWidth: 520,
        tabOffsetLeft: 0,
        tabWidth: 100,
      }),
    ).toBe(0)
    expect(
      getCenteredTabScrollLeft({
        containerWidth: 280,
        scrollWidth: 520,
        tabOffsetLeft: 480,
        tabWidth: 100,
      }),
    ).toBe(240)
  })
})
