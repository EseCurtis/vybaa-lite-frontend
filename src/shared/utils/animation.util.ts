import { IS_ANDROID } from '@/shared/constants.shared'

/**
 * Utility to disable animations on Android
 * Returns animation props that skip animations when on Android platform
 */

export const getAnimationProps = () => {
  if (IS_ANDROID) {
    return {
      initial: false,
      animate: false,
      exit: false,
      transition: { duration: 0 },
    }
  }
  return {}
}

/**
 * Returns transition props that disable transitions on Android
 */
export const getTransitionProps = (defaultTransition?: any) => {
  if (IS_ANDROID) {
    return { duration: 0 }
  }
  return defaultTransition
}

/**
 * Returns animation duration (0 on Android, otherwise the provided duration)
 */
export const getAnimationDuration = (defaultDuration: number = 250): number => {
  if (IS_ANDROID) {
    return 0
  }
  return defaultDuration
}

/**
 * Conditional AnimatePresence wrapper that skips animations on Android
 */
export const shouldAnimate = !IS_ANDROID




