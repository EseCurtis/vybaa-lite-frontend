// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EdgeSwipeBack } from './edge-swipe-back.component'

vi.mock('@/shared/haptic.util', () => ({
  hapticFeedback: { light: vi.fn() },
}))

class TestPointerEvent extends MouseEvent {
  public readonly isPrimary = true
  public readonly pointerId = 1
  public readonly pointerType = 'touch'
}

describe('EdgeSwipeBack', () => {
  beforeEach(() => {
    vi.stubGlobal('PointerEvent', TestPointerEvent)
    HTMLElement.prototype.setPointerCapture = vi.fn()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('navigates back after a deliberate swipe from the left edge', () => {
    const onBack = vi.fn()
    render(
      <EdgeSwipeBack onBack={onBack}>
        <div>Conversation</div>
      </EdgeSwipeBack>,
    )
    const surface = screen.getByTestId('edge-swipe-back')

    fireEvent.pointerDown(surface, { clientX: 12, clientY: 120 })
    fireEvent.pointerMove(surface, { clientX: 96, clientY: 124 })
    fireEvent.pointerUp(surface, { clientX: 96, clientY: 124 })

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('ignores horizontal swipes that begin away from the edge', () => {
    const onBack = vi.fn()
    render(
      <EdgeSwipeBack onBack={onBack}>
        <div>Conversation</div>
      </EdgeSwipeBack>,
    )
    const surface = screen.getByTestId('edge-swipe-back')

    fireEvent.pointerDown(surface, { clientX: 80, clientY: 120 })
    fireEvent.pointerMove(surface, { clientX: 180, clientY: 122 })
    fireEvent.pointerUp(surface, { clientX: 180, clientY: 122 })

    expect(onBack).not.toHaveBeenCalled()
  })

  it('leaves vertical scrolling alone at the screen edge', () => {
    const onBack = vi.fn()
    render(
      <EdgeSwipeBack onBack={onBack}>
        <div>Conversation</div>
      </EdgeSwipeBack>,
    )
    const surface = screen.getByTestId('edge-swipe-back')

    fireEvent.pointerDown(surface, { clientX: 12, clientY: 80 })
    fireEvent.pointerMove(surface, { clientX: 18, clientY: 130 })
    fireEvent.pointerUp(surface, { clientX: 18, clientY: 130 })

    expect(onBack).not.toHaveBeenCalled()
  })
})
