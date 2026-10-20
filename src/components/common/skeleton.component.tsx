import { View } from '@/components/layout/view.component'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
}: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }

  return (
    <div
      aria-hidden="true"
      className={`vybaa-skeleton shrink-0 ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
    />
  )
}

export function SkeletonCard() {
  return (
    <View
      aria-hidden="true"
      className="bg-card-light-50 min-h-[160px] rounded-xl p-5"
    >
      <View className="flex flex-row items-start justify-between gap-4">
        <View className="flex-1 space-y-3">
          <Skeleton width="40%" height={12} rounded="sm" />
          <Skeleton width="80%" height={16} />
          <Skeleton width="60%" height={14} />
        </View>
        <Skeleton width={40} height={40} rounded="full" />
      </View>
    </View>
  )
}

export function SkeletonStatsCard() {
  return (
    <View
      aria-hidden="true"
      className="bg-card-light-50 min-h-[100px] rounded-lg p-4"
    >
      <Skeleton width="60%" height={12} rounded="sm" className="mb-2" />
      <Skeleton width="40%" height={32} />
    </View>
  )
}

export function SkeletonSummaryCard() {
  return (
    <View aria-hidden="true" className="bg-card-light-50 rounded-3xl p-6">
      <View className="flex flex-row items-center justify-between mb-3">
        <Skeleton width={180} height={20} />
        <Skeleton width={80} height={12} rounded="sm" />
      </View>
      <View className="space-y-2">
        <Skeleton width="100%" height={16} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="95%" height={16} />
        <Skeleton width="90%" height={16} />
        <Skeleton width="85%" height={16} />
      </View>
    </View>
  )
}
