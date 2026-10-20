import {
  RiCalendarLine,
  RiFireLine,
  RiFlashlightLine,
  RiRewindLine,
  RiTrophyLine,
} from '@remixicon/react'
import type { CardType } from './flexx-card.component'

export const FLEXX_FEED: Array<{
  type: CardType
  label: string
  title: string
  description: string
  icon: typeof RiCalendarLine
}> = [
  {
    type: 'daily',
    label: 'Daily',
    title: 'Daily discipline',
    description: 'The little things add up.',
    icon: RiFlashlightLine,
  },
  {
    type: 'weekly',
    label: 'Weekly',
    title: 'Your week, in focus',
    description: 'A bigger picture of your progress.',
    icon: RiCalendarLine,
  },
  {
    type: 'streak',
    label: 'Streak',
    title: 'Keep showing up',
    description: 'Consistency deserves a little flex.',
    icon: RiFireLine,
  },
  {
    type: 'rewind',
    label: 'Rewind',
    title: 'A moment for you',
    description: 'Your last seven days of reflection.',
    icon: RiRewindLine,
  },
  {
    type: 'achievement',
    label: 'Badges',
    title: 'You earned this',
    description: 'Pick a milestone. Give it its moment.',
    icon: RiTrophyLine,
  },
]
