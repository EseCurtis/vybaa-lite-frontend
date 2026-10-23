// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { isValidElement } from 'react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { goalAPI } from '@/shared/api/goal.api'
import type { Goal } from '@/shared/api/goal.api'
import { TaskDetailsContent } from './task-details-content.component'
import { taskFixture } from './task-test.fixture'

const controls = vi.hoisted(() => ({
  present: vi.fn(),
  dismiss: vi.fn(),
  returnToList: vi.fn(),
}))
vi.mock('@/providers/bottom-sheet.provider', () => ({
  useBottomSheetController: () => controls,
}))
vi.mock('@/providers/toast.provider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))
vi.mock('@/shared/goal/goal-alarm.service', () => ({
  requestGoalAlarmSync: async () => undefined,
}))
vi.mock('./task-subtasks-trigger.component', () => ({
  TaskSubtasksTrigger: () => <button>Subtasks</button>,
}))
vi.mock('./task-timeline.component', () => ({
  TaskTimeline: ({ active }: { active: boolean }) => (
    <section hidden={!active}>Timeline content</section>
  ),
}))

let client: QueryClient
beforeEach(() => {
  vi.clearAllMocks()
  client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
})
afterEach(() => {
  cleanup()
  client.clear()
  vi.restoreAllMocks()
})
function ui(goal = taskFixture): ReactElement {
  return (
    <QueryClientProvider client={client}>
      <TaskDetailsContent goal={goal} onDismiss={controls.returnToList} />
    </QueryClientProvider>
  )
}

it('keeps only the heading above three tabs and opens an entry form instead of recording automatically', () => {
  const record = vi.spyOn(goalAPI, 'recordProgress')
  render(ui())
  for (const tab of ['Overview', 'Timeline', 'Rewards'])
    expect(screen.getByRole('button', { name: tab })).toBeTruthy()
  expect(screen.queryByText('Adherence')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Check in' }))
  expect(record).not.toHaveBeenCalled()
  expect(controls.present).toHaveBeenCalledOnce()
  const node: unknown = controls.present.mock.calls[0]?.[0]
  if (!isValidElement<{ onSaved: (goal: Goal) => void }>(node))
    throw new Error('Missing progress sheet')
  node.props.onSaved(taskFixture)
  expect(controls.returnToList).toHaveBeenCalledOnce()
})

it('hides action/progress from secondary tabs and keeps reward details progressively disclosed', () => {
  const rewards = JSON.stringify(taskFixture.reward)
  render(ui())
  fireEvent.click(screen.getByRole('button', { name: 'Rewards' }))
  expect(screen.queryByRole('progressbar')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Check in' })).toBeNull()
  expect(screen.getByText('0.10 added · 0.25 pending Play Points')).toBeTruthy()
  const details = screen.getByText('Reward details').closest('details')
  expect(details?.open).toBe(false)
  fireEvent.click(screen.getByText('Reward details'))
  expect(details?.open).toBe(true)
  expect(screen.getByText('Quarter way')).toBeTruthy()
  expect(JSON.stringify(taskFixture.reward)).toBe(rewards)
})

it('removes Review without mutating an existing saved conclusion', () => {
  const ended: Goal = {
    ...taskFixture,
    status: 'COMPLETED',
    conclusion: {
      adherenceRate: 100,
      attachments: [
        {
          type: 'image',
          url: 'https://example.test/saved.png',
          name: 'Existing image',
        },
      ],
      completedOccurrences: 10,
      createdAt: '2026-10-21T08:00:00Z',
      currentStreak: 10,
      durationDays: 10,
      earnedPoints: 2.85,
      endedAt: '2026-10-21T08:00:00Z',
      finalProgress: 10,
      forfeitedPoints: 0,
      longestStreak: 10,
      missedOccurrences: 0,
      nextStep: 'Keep reading',
      outcome: 'COMPLETED',
      overTargetAmount: 0,
      rating: 3,
      reflection: 'I found a rhythm',
      releasedPoints: 2.85,
      reviewUpdatedAt: null,
      targetValue: 10,
    },
  }
  const original = JSON.stringify(ended.conclusion)
  const save = vi.spyOn(goalAPI, 'saveReview')
  render(ui(ended))
  expect(screen.queryByRole('button', { name: 'Review' })).toBeNull()
  expect(screen.queryByLabelText('Task review reflection')).toBeNull()
  expect(JSON.stringify(ended.conclusion)).toBe(original)
  expect(save).not.toHaveBeenCalled()
})
