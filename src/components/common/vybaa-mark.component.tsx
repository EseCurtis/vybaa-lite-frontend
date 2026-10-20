import type { ReactElement } from 'react'

export function VybaaMark({
  tone,
  className,
}: {
  tone: 'dark' | 'white'
  className?: string
}): ReactElement {
  return (
    <img
      src={`/assets/brand/vybaa-mark-${tone}.svg`}
      alt="Vybaa"
      className={className}
      width={844}
      height={844}
    />
  )
}
