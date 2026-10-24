import {
  RiAwardLine,
  RiBookOpenLine,
  RiChat3Line,
  RiLayoutMasonryLine,
  RiTaskLine,
} from '@remixicon/react'
import type { ReactElement } from 'react'

import { colors } from '@/shared/colors.shared'
import type {
  ReflectionActivity,
  ReflectionSourceSymbol,
  ReflectionTone,
} from '@/shared/rewind/daily-reflection-story'

export const REFLECTION_TONE_CLASS: Readonly<Record<ReflectionTone, string>> = {
  amber: 'text-warning-400',
  green: 'text-success-400',
  muted: 'text-card-lighter-3',
  pink: 'text-accent-300',
}
const TONE_COLOR: Readonly<Record<ReflectionTone, string>> = {
  amber: colors.warning[400],
  green: colors.success[400],
  muted: colors['card-lighter-3'],
  pink: colors.accent[300],
}

export function ReflectionActivityIcon({
  symbol,
  tone,
}: Pick<ReflectionActivity, 'symbol' | 'tone'>): ReactElement {
  const icons: Record<ReflectionSourceSymbol, typeof RiAwardLine> = {
    award: RiAwardLine,
    book: RiBookOpenLine,
    chat: RiChat3Line,
    feed: RiLayoutMasonryLine,
    task: RiTaskLine,
  }
  const Icon = icons[symbol]
  return (
    <Icon
      size={19}
      aria-hidden="true"
      className={REFLECTION_TONE_CLASS[tone]}
    />
  )
}

export function DailyReflectionActivity({
  activities,
}: {
  activities: ReflectionActivity[]
}): ReactElement | null {
  if (!activities.length) return null
  let total = 0
  for (const activity of activities) total += activity.count
  let offset = 0
  const segments = activities.map((activity) => {
    const share = (activity.count / total) * 100
    const arc = Math.max(share - 1, share * 0.7)
    const segment = { ...activity, share, offset, arc }
    offset += share
    return segment
  })
  return (
    <section aria-label="Included activity" className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          Your day’s mix
        </h2>
        <RiLayoutMasonryLine
          size={20}
          aria-hidden="true"
          className="text-accent-300"
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-5 rounded-[28px] bg-card-light-50 p-5">
        <div
          role="img"
          aria-label={`${total} moments included. ${activities.map((activity) => `${activity.label}: ${activity.count}`).join(', ')}`}
          className="relative mx-auto size-32 shrink-0"
        >
          <svg
            viewBox="0 0 120 120"
            className="size-full -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={colors['card-light']}
              strokeWidth="8"
            />
            {segments.map((segment) => (
              <circle
                key={segment.label}
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={TONE_COLOR[segment.tone]}
                strokeWidth="8"
                pathLength="100"
                strokeDasharray={`${segment.arc} ${100 - segment.arc}`}
                strokeDashoffset={-segment.offset}
              />
            ))}
          </svg>
          <div
            aria-hidden="true"
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <span className="text-3xl font-semibold tabular-nums tracking-tight text-white">
              {total}
            </span>
            <span className="mt-1 text-[11px] text-card-lighter-3">
              moments included
            </span>
          </div>
        </div>
        <div className="min-w-[150px] flex-1 space-y-4">
          {segments.map((activity) => (
            <div key={activity.label} className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <ReflectionActivityIcon
                  symbol={activity.symbol}
                  tone={activity.tone}
                />
                <span className="min-w-0 flex-1 break-words text-card-lighter-3">
                  {activity.label}
                </span>
                <span className="font-semibold tabular-nums text-white">
                  {activity.count}
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-card-light"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${activity.share}%`,
                    backgroundColor: TONE_COLOR[activity.tone],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
