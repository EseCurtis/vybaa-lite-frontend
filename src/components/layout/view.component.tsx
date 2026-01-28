import { cn } from '@/shared/utils/helpers.util'
import type { HTMLAttributes } from 'react'

interface IView extends HTMLAttributes<HTMLDivElement> {}

export const View: React.FC<IView> = ({ ...rest }) => {
  return <div {...rest} className={cn('flex flex-col', rest.className)} />
}
