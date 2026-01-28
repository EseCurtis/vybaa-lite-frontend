import { CalendarBar } from '@/components/tasks/calendar-bar';
import type { FilterTab } from '@/components/tasks/segmented-tabs';
import { SegmentedTabs } from '@/components/tasks/segmented-tabs';

export interface TasksFilterBarProps {
  filterTab: FilterTab
  onTabChange: (tab: FilterTab) => void
  date: Date
  onCalendarOpen: () => void
  onCalendarReset: () => void
}

export function TasksFilterBar({ filterTab, onTabChange, date, onCalendarOpen, onCalendarReset }: TasksFilterBarProps) {
  return (
    <div className="mb-4">
      <SegmentedTabs value={filterTab} onChange={onTabChange} />
      <CalendarBar date={date} onOpen={onCalendarOpen} onReset={onCalendarReset} />
    </div>
  )
}






