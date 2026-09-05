import { describe, expect, it } from 'vitest'

import {
  getCenteredTabScrollLeft,
  getRewindSessionStatusPresentation,
} from './rewind-history.utils'

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
