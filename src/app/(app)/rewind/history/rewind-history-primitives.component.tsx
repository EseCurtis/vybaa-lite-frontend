import { RiCloseLine, RiRefreshLine, RiUserVoiceLine } from '@remixicon/react'
import type { ReactElement } from 'react'

import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { colors } from '@/shared/colors.shared'

import { formatRelativeDayLabel } from './rewind-history.utils'

export function RewindSkeletonRow(): ReactElement {
  return (
    <View
      className="gap-3 rounded-[22px] px-4 py-4"
      style={{ backgroundColor: colors['card-light-50'] }}
    >
      <View
        className="h-3 w-28 animate-pulse rounded-full"
        style={{ backgroundColor: colors['card-lighter'] }}
      />
      <View
        className="h-5 w-44 max-w-full animate-pulse rounded-full"
        style={{ backgroundColor: colors['card-lighter'] }}
      />
      <View
        className="h-3 w-full animate-pulse rounded-full"
        style={{ backgroundColor: colors.card[300] }}
      />
      <View
        className="h-3 w-2/3 animate-pulse rounded-full"
        style={{ backgroundColor: colors.card[300] }}
      />
    </View>
  )
}

export function RewindFilterPill({
  active,
  count,
  label,
  onPress,
}: {
  active: boolean
  count?: number
  label: string
  onPress: () => void
}): ReactElement {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-[40px] flex-row items-center gap-2 rounded-full px-3.5 py-2"
      style={{
        backgroundColor: active
          ? colors['card-light']
          : colors['card-light-50'],
      }}
    >
      <Text
        className="font-bbh text-xs font-bold uppercase tracking-[0.12em]"
        style={{ color: active ? colors.white : colors['card-lighter-2'] }}
      >
        {label}
      </Text>
      {typeof count === 'number' ? (
        <Text
          className="font-bbh text-[11px] font-bold"
          style={{
            color: active ? colors.white : colors['card-lighter-3'],
            opacity: active ? 0.88 : 1,
          }}
        >
          {count}
        </Text>
      ) : null}
    </Pressable>
  )
}

export function RewindEmptyState({
  isFiltered,
  onReset,
}: {
  isFiltered: boolean
  onReset?: () => void
}): ReactElement {
  return (
    <View
      className="items-center gap-3 rounded-[24px] px-6 py-12"
      style={{ backgroundColor: colors['card-light-50'] }}
    >
      <View
        className="h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: colors['card-light'] }}
      >
        <RiUserVoiceLine
          size={22}
          style={{ color: colors['card-lighter-2'] }}
        />
      </View>
      <Text
        className="font-bbh text-base font-bold"
        style={{ color: colors.white }}
      >
        {isFiltered ? 'No matches' : 'No rewind sessions yet'}
      </Text>
      <Text
        className="max-w-[260px] text-center font-bbh text-sm"
        style={{ color: colors['card-lighter-2'] }}
      >
        {isFiltered
          ? 'Try another partner or day.'
          : 'Start a Rewind conversation and the saved reflections will collect here.'}
      </Text>
      {isFiltered && onReset ? (
        <Button
          label="Clear filters"
          variant="secondary"
          size="sm"
          className="mt-1"
          leftIcon={<RiCloseLine size={16} className="text-white" />}
          onClick={onReset}
        />
      ) : null}
    </View>
  )
}

export function RewindErrorState({
  onRetry,
}: {
  onRetry: () => void
}): ReactElement {
  return (
    <View
      className="items-center gap-3 rounded-[24px] px-6 py-12"
      style={{ backgroundColor: colors['card-light-50'] }}
    >
      <Text
        className="font-bbh text-base font-bold"
        style={{ color: colors.white }}
      >
        Couldn&apos;t load rewinds
      </Text>
      <Button
        label="Retry"
        variant="secondary"
        size="sm"
        className="mt-1"
        leftIcon={<RiRefreshLine size={18} className="text-white" />}
        onClick={onRetry}
      />
    </View>
  )
}

export function RewindDaySection({
  children,
  label,
  total,
}: {
  children: ReactElement | ReactElement[]
  label: string
  total: number
}): ReactElement {
  return (
    <View className="gap-2">
      <View className="flex-row items-end justify-between px-1">
        <Text
          className="font-bbh text-sm font-bold"
          style={{ color: colors.white }}
        >
          {label}
        </Text>
        <Text
          className="font-bbh  text-[11px] uppercase tracking-[0.14em]"
          style={{ color: colors['card-lighter-3'] }}
        >
          {formatRelativeDayLabel(total)}
        </Text>
      </View>
      <View className="gap-2 ">{children}</View>
    </View>
  )
}
