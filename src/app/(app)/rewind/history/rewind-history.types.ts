import type { CSSProperties } from 'react'

import type { RewindSession } from '@/shared/api/rewind.api'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'

export type RewindAccentStyle = CSSProperties & {
  '--accent'?: string
  '--accent-soft'?: string
}

export type PartnerFilter = RewindPersonaId | 'all'
export type DayFilter = string | 'all'

export type RewindDayGroup = {
  dayKey: string
  label: string
  sessions: RewindSession[]
}
