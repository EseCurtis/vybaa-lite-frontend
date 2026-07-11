import type { ReactElement } from 'react'
import { useState } from 'react'

import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { colors } from '@/shared/colors.shared'
import {
  REWIND_PERSONAS,
  type RewindPersonaId,
  getRewindPersona,
} from '@/shared/rewind/rewind-personas'

import { RewindFilterPill } from './rewind-history-primitives.component'
import {
  ALL_DAYS_FILTER,
  ALL_PARTNERS_FILTER,
} from './rewind-history.constants'
import type { DayFilter, PartnerFilter } from './rewind-history.types'
import { formatDayLabel } from './rewind-history.utils'

export function RewindFilterSheet({
  activeDay,
  activePartner,
  allDayCount,
  allPartnerCount,
  dayCounts,
  dayOptions,
  onApply,
  onDismiss,
  partnerCounts,
}: {
  activeDay: DayFilter
  activePartner: PartnerFilter
  allDayCount: number
  allPartnerCount: number
  dayCounts: Map<string, number>
  dayOptions: string[]
  onApply: (filters: { day: DayFilter; partner: PartnerFilter }) => void
  onDismiss: () => void
  partnerCounts: Map<RewindPersonaId, number>
}): ReactElement {
  const [draftPartner, setDraftPartner] = useState<PartnerFilter>(activePartner)
  const [draftDay, setDraftDay] = useState<DayFilter>(activeDay)

  function handleClear(): void {
    setDraftPartner(ALL_PARTNERS_FILTER)
    setDraftDay(ALL_DAYS_FILTER)
  }

  function handleApply(): void {
    onApply({ day: draftDay, partner: draftPartner })
    onDismiss()
  }

  return (
    <View className="gap-6 pb-4">
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text
            className="font-bbh text-sm font-bold"
            style={{ color: colors.white }}
          >
            Partners
          </Text>
          <Text
            className="font-bbh text-[11px] uppercase tracking-[0.14em]"
            style={{ color: colors['card-lighter-3'] }}
          >
            {draftPartner === ALL_PARTNERS_FILTER
              ? 'All'
              : getRewindPersona(draftPartner).name}
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          <RewindFilterPill
            active={draftPartner === ALL_PARTNERS_FILTER}
            label="All"
            count={allPartnerCount}
            onPress={() => {
              setDraftPartner(ALL_PARTNERS_FILTER)
            }}
          />
          {REWIND_PERSONAS.map((persona) => (
            <RewindFilterPill
              key={persona.id}
              active={draftPartner === persona.id}
              label={persona.name}
              count={partnerCounts.get(persona.id) ?? 0}
              onPress={() => {
                setDraftPartner(persona.id)
              }}
            />
          ))}
        </View>
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text
            className="font-bbh text-sm font-bold"
            style={{ color: colors.white }}
          >
            Days
          </Text>
          <Text
            className="font-bbh text-[11px] uppercase tracking-[0.14em]"
            style={{ color: colors['card-lighter-3'] }}
          >
            {draftDay === ALL_DAYS_FILTER
              ? 'All days'
              : formatDayLabel(draftDay)}
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          <RewindFilterPill
            active={draftDay === ALL_DAYS_FILTER}
            label="All days"
            count={allDayCount}
            onPress={() => {
              setDraftDay(ALL_DAYS_FILTER)
            }}
          />
          {dayOptions.map((dayKey) => (
            <RewindFilterPill
              key={dayKey}
              active={draftDay === dayKey}
              label={formatDayLabel(dayKey)}
              count={dayCounts.get(dayKey) ?? 0}
              onPress={() => {
                setDraftDay(dayKey)
              }}
            />
          ))}
        </View>
      </View>

      <View className="flex-row w-full bg-red-500 gap-3 pt-1">
        <Button
          label="Clear"
          variant="secondary"
          fullWidth
          className="flex-1"
          onClick={handleClear}
        />
        <Button
          label="Apply"
          variant="secondary"
          fullWidth
          className="flex-1"
          onClick={handleApply}
        />
      </View>
    </View>
  )
}
