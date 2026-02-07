import { View } from '@/components/layout/view.component'
import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Skeleton({ className = '', width, height, rounded = 'md' }: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }

  return (
    <motion.div
      className={`bg-white/10 ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <View className="bg-card-700/40 rounded-2xl p-4 border border-white/10">
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
    <View className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl p-4 border border-cyan-500/30">
      <Skeleton width="60%" height={12} rounded="sm" className="mb-2" />
      <Skeleton width="40%" height={32} />
    </View>
  )
}

export function SkeletonSummaryCard() {
  return (
    <View className="bg-gradient-to-br from-card-700/60 to-card-light/40 rounded-3xl p-6 border border-white/10">
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
