import type { CSSProperties, HTMLAttributes } from 'react'

interface IText extends HTMLAttributes<HTMLSpanElement> {
  lines?: number
}

export const Text: React.FC<IText> = ({
  lines,
  className,
  style,
  ...rest
}) => {
  const lineClampStyle: CSSProperties | undefined = lines
    ? {
        display: '-webkit-box',
        WebkitLineClamp: lines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }
    : undefined

  return (
    <span
      className={className}
      style={{
        ...lineClampStyle,
        ...style,
      }}
      {...rest}
    />
  )
}