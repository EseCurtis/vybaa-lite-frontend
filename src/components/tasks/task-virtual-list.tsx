import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

export default function TaskVirtualList({
  items,
  rowHeight = 76,
  renderItem,
  onEndReached,
  endOffset = 5,
}: {
  items: Array<any>
  rowHeight?: number
  renderItem: (item: any, index: number) => React.JSX.Element
  onEndReached?: () => void
  endOffset?: number
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
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
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                height: rowHeight,
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






