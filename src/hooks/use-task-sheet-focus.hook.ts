import { useEffect } from 'react'
import type { RefObject } from 'react'

export function useTaskSheetFocus(
  content: RefObject<HTMLElement | null>,
  dismiss: () => void,
  returnFocus?: HTMLElement | null,
): void {
  useEffect(() => {
    const dialog = content.current?.closest<HTMLElement>('[role="dialog"]')
    if (!dialog) return
    function handleKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.preventDefault()
        dismiss()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const controls = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        ),
      ).filter((element) => element.getClientRects().length)
      const first = controls[0],
        last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    dialog.addEventListener('keydown', handleKey)
    return () => {
      dialog.removeEventListener('keydown', handleKey)
      queueMicrotask(() => {
        if (
          returnFocus?.isConnected &&
          !document.querySelector('[role="dialog"]')
        )
          returnFocus.focus({ preventScroll: true })
      })
    }
  }, [content, dismiss, returnFocus])
}
