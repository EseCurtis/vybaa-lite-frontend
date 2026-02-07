import type { PropsWithChildren } from 'react'
import { View } from '../layout/view.component'

export function NoiseComponent({ children }: PropsWithChildren) {
  return (
    <>
      <div
        style={{
          background: 'url(/assets/framernoise.png)',
          opacity: 0.9,
          mixBlendMode: 'multiply',
          filter: `contrast(70%) brightness(.7) saturate(0.9) invert(100%)`,
        }}
        className="top-0 zoomie left-0 size-full absolute mix-blend-multiply "
      />
      <View className="z-10 flex-1 relative">{children}</View>
    </>
  )
}
