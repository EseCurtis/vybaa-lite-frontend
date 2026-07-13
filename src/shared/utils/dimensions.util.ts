type DimensionsValue = {
  readonly bottomSafePadding: number
  readonly screenHeight: number
  readonly screenWidth: number
  readonly tabBarHeight: number
}

const fallbackScreenHeight = 800
const fallbackScreenWidth = 400

function getViewportHeight(): number {
  if (typeof window === 'undefined') {
    return fallbackScreenHeight
  }

  return window.visualViewport?.height ?? window.innerHeight
}

function getViewportWidth(): number {
  if (typeof window === 'undefined') {
    return fallbackScreenWidth
  }

  return window.visualViewport?.width ?? window.innerWidth
}

export const Dimensions: DimensionsValue = {
  bottomSafePadding: 24,
  get screenHeight() {
    return getViewportHeight()
  },
  get screenWidth() {
    return getViewportWidth()
  },
  tabBarHeight: 76,
}
