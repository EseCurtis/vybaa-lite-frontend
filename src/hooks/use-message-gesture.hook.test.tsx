// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useMessageGesture } from './use-message-gesture.hook'

vi.mock('@/shared/haptic.util', () => ({
  hapticFeedback: { selection: vi.fn() },
}))

class TestPointerEvent extends MouseEvent {
  public readonly isPrimary = true
  public readonly pointerId = 1
}

function Message({
  onReply,
  onHold,
}: {
  onReply: () => void
  onHold: () => void
}) {
  const gesture = useMessageGesture(onReply, onHold)
  return <button {...gesture.handlers}>Message</button>
}

describe('chat message gestures', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('PointerEvent', TestPointerEvent)
    HTMLElement.prototype.setPointerCapture = vi.fn()
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('opens actions on hold without selecting a reply', () => {
    const onReply = vi.fn()
    const onHold = vi.fn()
    render(<Message onReply={onReply} onHold={onHold} />)
    fireEvent.pointerDown(screen.getByRole('button'), {
      clientX: 100,
      clientY: 100,
    })
    act(() => vi.advanceTimersByTime(450))
    fireEvent.pointerUp(screen.getByRole('button'))
    expect(onHold).toHaveBeenCalledTimes(1)
    expect(onReply).not.toHaveBeenCalled()
  })

  it('lets vertical scrolling cancel the hold and reply', () => {
    const onReply = vi.fn()
    const onHold = vi.fn()
    render(<Message onReply={onReply} onHold={onHold} />)
    const bubble = screen.getByRole('button')
    fireEvent.pointerDown(bubble, { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(bubble, { clientX: 104, clientY: 140 })
    act(() => vi.advanceTimersByTime(600))
    fireEvent.pointerUp(bubble)
    expect(onHold).not.toHaveBeenCalled()
    expect(onReply).not.toHaveBeenCalled()
  })

  it('replies once after a deliberate right swipe', () => {
    const onReply = vi.fn()
    const onHold = vi.fn()
    render(<Message onReply={onReply} onHold={onHold} />)
    const bubble = screen.getByRole('button')
    fireEvent.pointerDown(bubble, { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(bubble, { clientX: 165, clientY: 104 })
    fireEvent.pointerUp(bubble)
    act(() => vi.advanceTimersByTime(600))
    expect(onReply).toHaveBeenCalledTimes(1)
    expect(onHold).not.toHaveBeenCalled()
  })

  it('does nothing on ordinary taps and exposes actions through keyboard activation', () => {
    const onReply = vi.fn()
    const onHold = vi.fn()
    render(<Message onReply={onReply} onHold={onHold} />)
    const bubble = screen.getByRole('button')
    fireEvent.pointerDown(bubble)
    fireEvent.pointerUp(bubble)
    fireEvent.click(bubble, { detail: 1 })
    expect(onReply).not.toHaveBeenCalled()
    expect(onHold).not.toHaveBeenCalled()
    fireEvent.click(bubble, { detail: 0 })
    expect(onHold).toHaveBeenCalledTimes(1)
  })
})
