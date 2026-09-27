import type { RewindSession } from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'
import { adjustColor } from '@/shared/utils/helpers.util'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'

import type { RewindAccentStyle, RewindDayGroup } from './rewind-history.types'

export function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatSessionTime(value: string): string {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatDayKey(value: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDayLabel(dayKey: string): string {
  const todayKey = formatDayKey(new Date().toISOString())
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = formatDayKey(yesterday.toISOString())

  if (dayKey === todayKey) {
    return 'Today'
  }

  if (dayKey === yesterdayKey) {
    return 'Yesterday'
  }

  return formatSessionDate(dayKey)
}

export function formatRelativeDayLabel(total: number): string {
  return total === 1 ? '1 session' : `${total} sessions`
}

export function getDayKey(session: RewindSession): string {
  return session.sessionDateKey ?? formatDayKey(session.createdAt)
}

export function getRewindSessionStatusPresentation(
  session: Pick<RewindSession, 'completed' | 'status'>,
): { color: string; label: string } {
  if (session.completed || session.status === 'COMPLETED') {
    return { color: colors['success-green'], label: 'Saved' }
  }

  switch (session.status) {
    case 'MISSED':
      return { color: colors.danger[400], label: 'Missed' }
    case 'FINALIZING':
      return { color: colors['warning-yellow'], label: 'Saving' }
    case 'SCHEDULED':
      return { color: colors['card-lighter-3'], label: 'Scheduled' }
    case 'IN_PROGRESS':
      return { color: colors['warning-yellow'], label: 'Open' }
    case 'LEGACY':
      return { color: colors['card-lighter-2'], label: 'Archived' }
  }
}

export function getSessionAccent(personaId: RewindSession['personaId']): {
  accent: string
  accentSoft: string
} {
  const accent = adjustColor(getRewindPersona(personaId).color, {
    lightness: -6,
    saturation: -18,
  })
  const accentSoft = adjustColor(accent, {
    alpha: -0.78,
  })

  return { accent, accentSoft }
}

export function createAccentStyle(
  accent: string,
  accentSoft: string,
): RewindAccentStyle {
  return {
    '--accent': accent,
    '--accent-soft': accentSoft,
  }
}

export function getCenteredTabScrollLeft({
  containerWidth,
  scrollWidth,
  tabOffsetLeft,
  tabWidth,
}: {
  containerWidth: number
  scrollWidth: number
  tabOffsetLeft: number
  tabWidth: number
}): number {
  const centeredOffset = tabOffsetLeft - (containerWidth - tabWidth) / 2
  const maximumScroll = Math.max(scrollWidth - containerWidth, 0)
  return Math.min(Math.max(centeredOffset, 0), maximumScroll)
}

export function groupSessionsByDay(
  sessions: RewindSession[],
): RewindDayGroup[] {
  const groups: RewindDayGroup[] = []

  for (const session of sessions) {
    const dayKey = getDayKey(session)
    const existingGroup = groups.find((group) => group.dayKey === dayKey)

    if (existingGroup) {
      existingGroup.sessions.push(session)
      continue
    }

    groups.push({
      dayKey,
      label: formatDayLabel(dayKey),
      sessions: [session],
    })
  }

  return groups
}
