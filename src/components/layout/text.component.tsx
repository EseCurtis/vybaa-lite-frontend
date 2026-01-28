import type { HTMLAttributes } from "react"

interface IText extends HTMLAttributes<HTMLSpanElement> {}

export const Text: React.FC<IText> = ({ ...rest}) => {
  return <span  {...rest}/>
}
