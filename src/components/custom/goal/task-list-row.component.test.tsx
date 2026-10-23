// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { TaskListRow } from './task-list-row.component'
import { taskFixture } from './task-test.fixture'

const { present } = vi.hoisted(() => ({ present: vi.fn() }))
vi.mock('@/providers/bottom-sheet.provider', () => ({
  useBottomSheetController: () => ({ present }),
}))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

it('preserves the manual check-in sheet for normal tasks', () => {
  render(<TaskListRow goal={taskFixture} onOpen={vi.fn()} />)
  fireEvent.click(
    screen.getByRole('button', {
      name: `Record progress for ${taskFixture.title}`,
    }),
  )
  expect(present).toHaveBeenCalledTimes(1)
})
