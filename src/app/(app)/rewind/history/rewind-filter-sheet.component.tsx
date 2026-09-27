import { RiCalendarLine, RiUserVoiceLine } from '@remixicon/react'
import type { ReactElement } from 'react'
import { useEffect, useRef, useState } from 'react'

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

function getPartnerFilterLabel(partner: PartnerFilter): string {
  if (partner === ALL_PARTNERS_FILTER) {
    return 'All partners'
  }

  return getRewindPersona(partner).name
}

function getDayFilterLabel(day: DayFilter): string {
  if (day === ALL_DAYS_FILTER) {
    return 'All days'
  }

  return formatDayLabel(day)
}

function getActiveFilterCount(partner: PartnerFilter, day: DayFilter): number {
  let count = 0

  if (partner !== ALL_PARTNERS_FILTER) {
    count += 1
  }

  if (day !== ALL_DAYS_FILTER) {
    count += 1
  }

  return count
}

function RewindFilterSectionHeader({
  count,
  icon,
  title,
  value,
}: {
  count: number
  icon: ReactElement
  title: string
  value: string
}): ReactElement {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="min-w-0 flex-1 flex-row items-center gap-2">
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: colors['card-light-50'] }}
        >
          {icon}
        </View>
        <View className="min-w-0 gap-0.5">
          <Text
            className="font-bbh text-sm font-bold"
            style={{ color: colors.white }}
          >
            {title}
          </Text>
          <Text
            className="truncate font-bbh text-[11px]"
            style={{ color: colors['card-lighter-3'] }}
          >
            {count} {count === 1 ? 'option' : 'options'}
          </Text>
        </View>
      </View>
      <Text
        className="max-w-[42%] truncate text-right font-bbh text-[11px] font-bold uppercase tracking-[0.1em]"
        style={{ color: colors['card-lighter-2'] }}
      >
        {value}
      </Text>
    </View>
  )
}

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
  const [isApplying, setIsApplying] = useState(false)
  const applyTimeoutRef = useRef<number | undefined>(undefined)
  const dismissTimeoutRef = useRef<number | undefined>(undefined)
  const activeFilterCount = getActiveFilterCount(draftPartner, draftDay)
  const hasDraftFilters = activeFilterCount > 0
  const hasDraftChanges =
    draftPartner !== activePartner || draftDay !== activeDay
  const isApplyDisabled = isApplying || (!hasDraftFilters && !hasDraftChanges)
  const partnerLabel = getPartnerFilterLabel(draftPartner)
  const dayLabel = getDayFilterLabel(draftDay)

  useEffect(() => {
    return () => {
      if (typeof applyTimeoutRef.current === 'number') {
        window.clearTimeout(applyTimeoutRef.current)
      }

      if (typeof dismissTimeoutRef.current === 'number') {
        window.clearTimeout(dismissTimeoutRef.current)
      }
    }
  }, [])

  function handleClear(): void {
    if (isApplying) {
      return
    }

    setDraftPartner(ALL_PARTNERS_FILTER)
    setDraftDay(ALL_DAYS_FILTER)
  }

  function handleApply(): void {
    if (isApplying || isApplyDisabled) {
      return
    }

    setIsApplying(true)

    applyTimeoutRef.current = window.setTimeout(() => {
      onApply({ day: draftDay, partner: draftPartner })

      dismissTimeoutRef.current = window.setTimeout(() => {
        onDismiss()
      }, 120)
    }, 80)
  }

  return (
    <View className="gap-5 relative overflow-hidden pb-[120px]">
      <View className="overflow-scroll h-[70vh] gap-5 ">
        <View className="gap-3">
          <RewindFilterSectionHeader
            count={REWIND_PERSONAS.length + 1}
            icon={
              <RiUserVoiceLine
                size={17}
                style={{ color: colors['card-lighter-2'] }}
              />
            }
            title="Partner"
            value={partnerLabel}
          />
          <View className="flex-row flex-wrap gap-2.5">
            <RewindFilterPill
              active={draftPartner === ALL_PARTNERS_FILTER}
              label="All"
              count={allPartnerCount}
              onPress={() => {
                if (!isApplying) {
                  setDraftPartner(ALL_PARTNERS_FILTER)
                }
              }}
            />
            {REWIND_PERSONAS.map((persona) => (
              <RewindFilterPill
                key={persona.id}
                active={draftPartner === persona.id}
                label={persona.name}
                count={partnerCounts.get(persona.id) ?? 0}
                disabled={
                  (partnerCounts.get(persona.id) ?? 0) === 0 &&
                  draftPartner !== persona.id
                }
                onPress={() => {
                  if (!isApplying) {
                    setDraftPartner(persona.id)
                  }
                }}
              />
            ))}
          </View>
        </View>

        <View className="gap-3">
          <RewindFilterSectionHeader
            count={dayOptions.length + 1}
            icon={
              <RiCalendarLine
                size={17}
                style={{ color: colors['card-lighter-2'] }}
              />
            }
            title="Day"
            value={dayLabel}
          />
          <View className="max-h-[220px] flex-row flex-wrap gap-2.5 overflow-y-auto pr-1">
            <RewindFilterPill
              active={draftDay === ALL_DAYS_FILTER}
              label="All days"
              count={allDayCount}
              onPress={() => {
                if (!isApplying) {
                  setDraftDay(ALL_DAYS_FILTER)
                }
              }}
            />
            {dayOptions.map((dayKey) => (
              <RewindFilterPill
                key={dayKey}
                active={draftDay === dayKey}
                label={formatDayLabel(dayKey)}
                count={dayCounts.get(dayKey) ?? 0}
                disabled={
                  (dayCounts.get(dayKey) ?? 0) === 0 && draftDay !== dayKey
                }
                onPress={() => {
                  if (!isApplying) {
                    setDraftDay(dayKey)
                  }
                }}
              />
            ))}
          </View>
        </View>
      </View>

      <View
        className="gap-3 border-t pt-4 absolute bottom-0 left-0 w-full"
        style={{ borderColor: colors['card-light'] }}
      >
        <Text
          className="font-bbh text-[11px] uppercase tracking-[0.12em]"
          style={{ color: colors['card-lighter-3'] }}
        >
          {hasDraftFilters
            ? `${activeFilterCount} ${activeFilterCount === 1 ? 'filter' : 'filters'} active`
            : 'Showing every Rewind'}
        </Text>
        <View className="w-full  flex-row gap-3">
          {
            <View className="w-full">
              <Button
                label={'Apply filters'}
                loading={isApplying}
                disabled={isApplyDisabled}
                fullWidth
                buttonClassName="flex-1"
                onClick={handleApply}
              />
            </View>
          }
          <Button
            label="Clear"
            variant="secondary"
            disabled={isApplying || !hasDraftFilters}
            buttonClassName="flex-1"
            onClick={handleClear}
          />
        </View>
      </View>
    </View>
  )
}
