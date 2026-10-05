import type { Transition } from 'framer-motion'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const shouldAnimate = !prefersReducedMotion()

export const getAnimationProps = () => {
  if (!shouldAnimate) {
    return {
      initial: false,
      animate: false,
      exit: false,
      transition: { duration: 0 },
    }
  }
  return {}
}

export function getTransitionProps(
  defaultTransition?: Transition,
): Transition | undefined {
  return shouldAnimate ? defaultTransition : { duration: 0 }
}

export const getAnimationDuration = (defaultDuration: number = 250): number => {
  return shouldAnimate ? defaultDuration : 0
}
