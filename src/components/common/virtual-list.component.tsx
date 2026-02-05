import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef, type ReactNode } from 'react';

/**
 * Generic virtualized list using react-virtual for web with dynamic height support.
 *
 * @template T
 * @param items Array of items to render
 * @param renderItem Render callback receiving (item, index)
 * @param estimateSize Estimated height of each row in px (default 100) - used for initial layout before measurement
 * @param height List viewport height in px (default 600)
 * @param itemKey Function to derive React key for items (default: uses item.id)
 * @param overscan Number of items to render outside visible area (default 5)
 * @example
 *   <VirtualList
 *      items={data}
 *      renderItem={(item, i) => <MyRow item={item} />}
 *      estimateSize={150}
 *   />
 */
export interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  height?: number;
  itemKey?: (item: T, index: number) => string | number;
  footer?: ReactNode;
  overscan?: number;
}

export function VirtualList<T extends { id?: string | number }>({
  items,
  renderItem,
  estimateSize = 100,
  height = 600,
  itemKey = (item, i) => (item.id != null ? item.id : i),
  footer,
  overscan = 5,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    // Enable dynamic size measurement
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  });

  return (
    <div
      ref={parentRef}
      style={{ height, overflowY: 'auto', position: 'relative' }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={itemKey(item, virtualRow.index)}
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
          );
        })}
      </div>
      {footer}
    </div>
  );
}






