import { cn } from '@/shared/utils/helpers.util'
import type { PropsWithChildren } from 'react'
import { View } from '../layout/view.component'

export function NoiseComponent({ children, className }: PropsWithChildren & { className?: string}) {
  return (
    <>
      <div
        style={{
          background: 'url(/assets/framernoise.png)',
          opacity: 0.9,
          mixBlendMode: 'multiply',
          filter: `contrast(70%) brightness(.7) saturate(0.9) invert(100%)`,
        }}
        className={cn( "top-0  left-0 size-full absolute mix-blend-multiply ")}
      />
      <View className={cn("z-10 flex-1 relative")}>{children}</View>
    </>
  )
}
