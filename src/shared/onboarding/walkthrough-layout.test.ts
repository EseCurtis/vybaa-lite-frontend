import { describe, expect, it } from 'vitest'

import {
  intersectWalkthroughRects,
  walkthroughLayout,
} from './walkthrough-layout'
import type { WalkthroughRect } from './walkthrough-layout'

function rect(
  left: number,
  top: number,
  width: number,
  height: number,
): WalkthroughRect {
  return { bottom: top + height, height, left, right: left + width, top, width }
}

describe('walkthrough screen bounds', () => {
  it('uses the measured height rather than assuming a short explanation', () => {
    const viewport = rect(0, 0, 320, 568)
    const { tooltip } = walkthroughLayout(rect(20, 250, 200, 44), viewport, 400)
    expect(tooltip.width).toBe(288)
    expect(tooltip.top).toBeGreaterThanOrEqual(16)
    expect(tooltip.top + 400).toBeLessThanOrEqual(552)
    expect(tooltip.left + tooltip.width).toBeLessThanOrEqual(304)
  })

  it('puts the explanation below or above the target when it fits', () => {
    const viewport = rect(0, 0, 390, 844)
    expect(
      walkthroughLayout(rect(30, 40, 100, 44), viewport, 260).tooltip.top,
    ).toBe(100)
    expect(
      walkthroughLayout(rect(30, 760, 100, 44), viewport, 260).tooltip.top,
    ).toBe(484)
  })

  it.each([180, 280, 568])(
    'bounds tall content and full-screen targets in a %spx viewport',
    (height) => {
      const viewport = rect(0, 0, 320, height)
      const { spotlight, tooltip } = walkthroughLayout(viewport, viewport, 700)
      expect(spotlight).toEqual(viewport)
      expect(tooltip.top).toBe(16)
      expect(tooltip.maxHeight).toBe(height - 32)
    },
  )

  it('uses the offset visual viewport after the keyboard opens or the page zooms', () => {
    const viewport = rect(12, 240, 320, 300)
    const { tooltip } = walkthroughLayout(
      rect(290, 480, 150, 44),
      viewport,
      260,
    )
    expect(tooltip.left).toBe(28)
    expect(tooltip.top).toBeGreaterThanOrEqual(256)
    expect(tooltip.top + 260).toBeLessThanOrEqual(524)
    expect(tooltip.left + tooltip.width).toBeLessThanOrEqual(316)
  })

  it('intersects targets with scroll-container boundaries and rejects off-screen regions', () => {
    expect(
      intersectWalkthroughRects(
        rect(-30, 50, 500, 600),
        rect(20, 100, 220, 300),
      ),
    ).toEqual(rect(20, 100, 220, 300))
    expect(
      intersectWalkthroughRects(rect(0, 900, 40, 40), rect(0, 0, 320, 568)),
    ).toBeNull()
  })

  it('keeps the explanation reachable while an off-screen target is being revealed', () => {
    const { spotlight, tooltip } = walkthroughLayout(
      null,
      rect(0, 0, 320, 568),
      400,
    )
    expect(spotlight).toBeNull()
    expect(tooltip.top).toBeGreaterThanOrEqual(16)
    expect(tooltip.top + 400).toBeLessThanOrEqual(552)
  })
})
