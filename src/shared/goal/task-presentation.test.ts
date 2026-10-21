import { expect, it } from 'vitest'

import { taskFixture } from '@/components/custom/goal/task-test.fixture'
import {
  taskDateLabel,
  taskProgressLabel,
  taskRewardSummary,
  taskStatus,
} from './task-presentation'

it('uses semantic status precedence instead of treating every active task as overdue', () => {
  expect(taskStatus(taskFixture)).toEqual({
    label: 'Due today',
    tone: 'text-warning-400',
  })
  expect(taskStatus({ ...taskFixture, isOverdue: true }).tone).toBe(
    'text-danger-400',
  )
  expect(
    taskStatus({
      ...taskFixture,
      isOverdue: true,
      nextOccurrence: { ...taskFixture.nextOccurrence!, status: 'GRACE' },
    }).tone,
  ).toBe('text-warning-400')
  expect(
    taskStatus({ ...taskFixture, status: 'COMPLETED', isOverdue: true }).tone,
  ).toBe('text-success-400')
  expect(taskStatus({ ...taskFixture, status: 'PAUSED' }).label).toBe('Paused')
  expect(taskStatus({ ...taskFixture, isDue: false }).label).toBe('Upcoming')
})

it('shows actual released and pending Play Points without counting pending as added', () => {
  expect(taskRewardSummary(taskFixture.reward)).toBe(
    '0.10 added · 0.25 pending Play Points',
  )
  expect(
    taskRewardSummary({
      ...taskFixture.reward,
      releasedPoints: 0,
      pendingPoints: 0,
    }),
  ).toBe('Up to 2.85 Play Points')
  expect(
    taskRewardSummary({
      ...taskFixture.reward,
      eligible: false,
      releasedPoints: 0,
      pendingPoints: 0,
    }),
  ).toBe('No Play Points for this task')
})

it('keeps the existing target modes and renders calendar dates in plain language', () => {
  expect(taskProgressLabel(taskFixture)).toBe('2 / 10 check-ins')
  expect(
    taskProgressLabel({
      ...taskFixture,
      target: { type: 'QUANTITY', amount: 20, unit: 'pages' },
    }),
  ).toBe('2 / 20 pages')
  expect(taskDateLabel('2026-10-21', new Date(2026, 9, 21, 12))).toBe('Today')
  expect(taskDateLabel('2026-10-22', new Date(2026, 9, 21, 12))).toBe(
    'Tomorrow',
  )
})
