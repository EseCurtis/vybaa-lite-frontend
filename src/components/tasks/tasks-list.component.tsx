import { VirtualList } from '@/components/common/virtual-list.component'
import React from 'react'

export interface TasksListProps<T> {
  items: T[]
  rowHeight: number
  renderRow: (item: T, index: number) => React.ReactNode
  /**
   * Callback fired when the user scrolls near or reaches the end of the list. Used for infinite scroll.
   */
  onReachEnd?: () => void
}

export function TasksList<T>({ items, rowHeight, renderRow, onReachEnd }: TasksListProps<T>) {
  // Listen for when user scrolls within last 3 rows and trigger onReachEnd
  const handleRender = (item: T, i: number) => {
    if (onReachEnd && i >= items.length - 3) onReachEnd()
    return renderRow(item, i)
  }
  //@ts-ignore
  return <VirtualList items={items} rowHeight={rowHeight} renderItem={handleRender} />
}
