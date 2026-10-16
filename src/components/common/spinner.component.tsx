import { Skeleton } from './skeleton.component'

export function Spinner({ size = 10 }: { size?: number | 'lg' | 'md' | 'sm' }) {
  const dimension = typeof size === 'number' ? size : { sm: 16, md: 24, lg: 32 }[size]
  return (
    <span role="status" aria-label="Working" className="inline-flex shrink-0">
      <Skeleton width={dimension} height={dimension} rounded="sm" />
    </span>
  )
}
