import { useEffect, useState } from 'react'

export function useSafeAreaInsets() {
  const [top, setTop] = useState('')
  const [bottom, ] = useState('')

  useEffect(() => {
    const x = document.documentElement.style.getPropertyValue(
      '--statusbar-clearfix',
    )
    setTop(x)
  }, [])

  return {
    top,
    bottom,
  }
}
