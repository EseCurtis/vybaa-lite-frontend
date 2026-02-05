import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

export default function TaskVirtualList({
  items,
  estimateSize = 76,
  renderItem,
  onEndReached,
  endOffset = 5,
}: {
  items: Array<any>
  estimateSize?: number
  renderItem: (item: any, index: number) => React.JSX.Element
  onEndReached?: () => void
  endOffset?: number
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
    // Enable dynamic size measurement
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  })

  // Trigger end reached when near the bottom
  const virtualItems = virtualizer.getVirtualItems()
  if (onEndReached && virtualItems.length) {
    const last = virtualItems[virtualItems.length - 1]
    if (last.index >= Math.max(0, items.length - endOffset)) {
      onEndReached()
    }
  }
  return (
    <div
      ref={parentRef}
      style={{ height: 600, overflowY: 'auto', position: 'relative' }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index]
          return (
            <div
              key={item.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}






