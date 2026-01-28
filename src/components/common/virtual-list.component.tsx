import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef } from 'react';

/**
 * Generic virtualized list using react-virtual for web.
 *
 * @template T
 * @param items Array of items to render
 * @param renderItem Render callback receiving (item, index)
 * @param rowHeight Height of each row in px (default 72)
 * @param height List viewport height in px (default 600)
 * @param itemKey Function to derive React key for items (default: uses item.id)
 * @example
 *   <VirtualList
 *      items={data}
 *      renderItem={(item, i) => <MyRow item={item} />}
 *   />
 */
export interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  rowHeight?: number;
  height?: number;
  itemKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T extends { id?: string | number }>({
  items,
  renderItem,
  rowHeight = 72,
  height = 600,
  itemKey = (item, i) => (item.id != null ? item.id : i),
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
  });
  return (
    <div
      ref={parentRef}
      style={{ height, overflowY: 'auto', position: 'relative' }}
    >
      <div className='' style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={itemKey(item, virtualRow.index)}
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
          );
        })}
      </div>
    </div>
  );
}






