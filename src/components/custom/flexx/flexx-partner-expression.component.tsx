import { useState } from 'react'
import type { ReactElement } from 'react'

import { rewindExpressionAsset } from '@/shared/rewind/rewind-expressions'
import type { RewindExpression } from '@/shared/rewind/rewind-expressions'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'
import { cn } from '@/shared/utils/helpers.util'

export function FlexxPartnerExpression({
  partnerId,
  expression,
  className,
}: {
  partnerId: RewindPersonaId
  expression: RewindExpression
  className?: string
}): ReactElement {
  const src = rewindExpressionAsset(partnerId, expression)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  return (
    <div
      aria-hidden="true"
      data-flexx-expression={`${partnerId}:${expression}`}
      className={cn('pointer-events-none aspect-square shrink-0', className)}
    >
      {failedSource !== src ? (
        <img
          key={src}
          src={src}
          alt=""
          width={480}
          height={480}
          decoding="async"
          draggable={false}
          onError={() => setFailedSource(src)}
          data-flexx-loop="partner"
          className="size-full object-contain"
        />
      ) : null}
    </div>
  )
}
