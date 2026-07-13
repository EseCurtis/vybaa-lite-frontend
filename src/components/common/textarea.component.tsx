import { cn } from '@/shared/utils/helpers.util'
import React, { useEffect, useRef } from 'react'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autosize?: boolean
  maxWidth?: number | string
  containerClassName?: string
}

export const TextArea: React.FC<TextAreaProps> = ({
  autosize = true,
  maxWidth,
  className,
  containerClassName,
  style,
  ...props
}) => {
  const ref = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!autosize || !ref.current) return
    const el = ref.current
    const resize = () => {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
    resize()
    const handler = () => resize()
    el.addEventListener('input', handler)
    return () => el.removeEventListener('input', handler)
  }, [autosize, props.value])

  return (
    <div
      className={cn('w-full ', containerClassName)}
      style={maxWidth ? { maxWidth, ...style } : style}
    >
      <textarea
        ref={ref}
        rows={1}
        className={cn(
          'w-full bg-transparent !p-3 text-white font-bbh text-[17px] outline-none resize-none  placeholder:text-card-lighter-3/40',
          className,
        )}
        {...props}
      />
    </div>
  )
}
