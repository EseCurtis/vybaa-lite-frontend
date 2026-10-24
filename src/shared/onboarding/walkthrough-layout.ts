export type WalkthroughRect = Pick<
  DOMRect,
  'bottom' | 'height' | 'left' | 'right' | 'top' | 'width'
>

const EDGE_GAP = 16
const TARGET_GAP = 16
const TARGET_PADDING = 8
const TOOLTIP_WIDTH = 336

export function intersectWalkthroughRects(
  rect: WalkthroughRect,
  bounds: WalkthroughRect,
): WalkthroughRect | null {
  const left = Math.max(rect.left, bounds.left)
  const right = Math.min(rect.right, bounds.right)
  const top = Math.max(rect.top, bounds.top)
  const bottom = Math.min(rect.bottom, bounds.bottom)
  if (right <= left || bottom <= top) return null
  return { bottom, height: bottom - top, left, right, top, width: right - left }
}

export function walkthroughLayout(
  target: WalkthroughRect | null,
  viewport: WalkthroughRect,
  measuredHeight: number,
) {
  const width = Math.max(
    0,
    Math.min(TOOLTIP_WIDTH, viewport.width - EDGE_GAP * 2),
  )
  const maxHeight = Math.max(0, viewport.height - EDGE_GAP * 2)
  const height = Math.min(measuredHeight, maxHeight)
  const topEdge = viewport.top + EDGE_GAP
  const bottomEdge = viewport.bottom - EDGE_GAP
  const anchor = target ?? {
    bottom: viewport.top + viewport.height / 2,
    height: 0,
    left: viewport.left + viewport.width / 2,
    right: viewport.left + viewport.width / 2,
    top: viewport.top + viewport.height / 2,
    width: 0,
  }
  const left = Math.max(
    viewport.left + EDGE_GAP,
    Math.min(
      anchor.left + anchor.width / 2 - width / 2,
      viewport.right - EDGE_GAP - width,
    ),
  )
  let top = anchor.bottom + TARGET_GAP
  if (top + height > bottomEdge) top = anchor.top - TARGET_GAP - height
  top = Math.max(topEdge, Math.min(top, bottomEdge - height))

  const spotlight = target
    ? intersectWalkthroughRects(
        {
          bottom: target.bottom + TARGET_PADDING,
          height: target.height + TARGET_PADDING * 2,
          left: target.left - TARGET_PADDING,
          right: target.right + TARGET_PADDING,
          top: target.top - TARGET_PADDING,
          width: target.width + TARGET_PADDING * 2,
        },
        viewport,
      )
    : null

  return { spotlight, tooltip: { left, maxHeight, top, width } }
}
