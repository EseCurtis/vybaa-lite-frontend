import { SafeArea } from 'capacitor-plugin-safe-area'
import { useEffect, useState } from 'react'

export function useSafeAreaInsets() {
  const [top, setTop] = useState('')
  const [bottom, setBottom] = useState('')

  useEffect(() => {
    const top = document.documentElement.style.getPropertyValue(
      '--safe-area-inset-top',
    )

    SafeArea.getSafeAreaInsets().then(({ insets }) => {
      // alert(JSON.stringify(insets));
      for (const [key, value] of Object.entries(insets)) {
        if (key == 'top') {
          setTop(value)
        }

        if (key == 'bottom') {
          setBottom(value)
        }
      }
    })
    setTop(top)
  }, [])

  return {
    top,
    bottom,
  }
}
