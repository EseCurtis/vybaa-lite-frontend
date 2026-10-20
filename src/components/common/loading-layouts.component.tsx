import type { ReactElement } from 'react'

import { Skeleton, SkeletonCard } from './skeleton.component'

export function GoalRowSkeleton(): ReactElement {
  return (
    <div aria-hidden="true" className="flex min-h-20 items-center gap-3 py-4">
      <Skeleton className="size-11" rounded="lg" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-2 w-4/5" rounded="full" />
      </div>
      <Skeleton className="h-3 w-10" />
    </div>
  )
}

export function HomeGoalsSkeleton(): ReactElement {
  return (
    <div
      role="status"
      aria-label="Loading your goals"
      aria-busy="true"
      className="flex min-h-[76px] items-center gap-3 overflow-hidden px-mg py-3"
    >
      <Skeleton className="h-[52px] w-[230px]" rounded="full" />
      <Skeleton className="h-[52px] w-[180px]" rounded="full" />
    </div>
  )
}

export function ScreenSkeleton({
  layout = 'list',
}: {
  layout?: 'auth' | 'home' | 'list'
}): ReactElement {
  return (
    <div
      aria-hidden="true"
      className="mx-auto flex w-full max-w-md flex-col gap-6"
    >
      <div className="flex h-12 items-center gap-3">
        <Skeleton className="size-11" rounded="full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="size-8" rounded="full" />
      </div>
      {layout === 'home' ? (
        <>
          <Skeleton className="h-12 w-4/5" rounded="full" />
          <Skeleton className="my-3 h-24 w-full" rounded="xl" />
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton
                key={item}
                className="aspect-square w-full rounded-[40px]"
              />
            ))}
          </div>
        </>
      ) : null}
      {layout === 'auth' ? (
        <div className="mt-12 flex flex-col gap-5">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-5 h-14 w-full" rounded="full" />
          <Skeleton className="h-14 w-full" rounded="full" />
          <Skeleton className="mt-4 h-12 w-full" rounded="full" />
        </div>
      ) : null}
      {layout === 'list' ? (
        <>
          {[0, 1, 2, 3].map((item) => (
            <SkeletonCard key={item} />
          ))}
        </>
      ) : null}
    </div>
  )
}
