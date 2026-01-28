import { View } from '@/components/layout/view.component'

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <View className={`animate-pulse bg-white/10 rounded-md ${className}`} />
  )
}

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <View className={`gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <View
          key={i}
          className={`animate-pulse bg-white/10 rounded ${i === lines - 1 ? 'w-3/5' : 'w-full'} h-3`}
        />
      ))}
    </View>
  )
}

export function SkeletonCircle({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <View
      style={{ width: size, height: size }}
      className={`animate-pulse bg-white/10 rounded-full ${className}`}
    />
  )
}


