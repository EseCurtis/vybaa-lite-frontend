import { useTabBarController } from '@/providers/tab-bar.provider'
import { useEffect } from 'react'

/**
 * Hook to control tab bar visibility
 * 
 * @example
 * // Simple usage
 * const { hide, show } = useTabBar()
 * 
 * // Auto-hide on mount, show on unmount
 * useTabBar({ hideOnMount: true })
 * 
 * // Manual control
 * const tabBar = useTabBar()
 * tabBar.hide() // Hide tab bar
 * tabBar.show() // Show tab bar
 * tabBar.toggle() // Toggle visibility
 */
export function useTabBar(options?: { hideOnMount?: boolean; showOnUnmount?: boolean }) {
  const { isVisible, show, hide, toggle } = useTabBarController()

  useEffect(() => {
    if (options?.hideOnMount) {
      hide()
    }

    return () => {
      if (options?.showOnUnmount !== false) {
        show()
      }
    }
  }, [hide, show, options?.hideOnMount, options?.showOnUnmount])

  return {
    isVisible,
    show,
    hide,
    toggle,
  }
}
