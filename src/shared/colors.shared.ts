// Color scale type definition
type ColorScale = {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
}

// Extended color scale with custom values
type ExtendedColorScale = ColorScale & {
  850?: string
  950?: string
}

// Main colors interface
interface Colors {
  white: string
  black: string
  'success-green': string
  'warning-yellow': string
  border: string
  card: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
  }
  charcoal: ExtendedColorScale
  neutral: ColorScale
  accent: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
  }
  success: ColorScale
  warning: ColorScale
  danger: ColorScale
}

// Color values with full type safety
export const colors: Colors = {
  white: '#ffffff',
  black: '#060509',
  'success-green': '#16BA81',
  'warning-yellow': '#fb9a24',
  border: '#242424',
  card: {
    50: '#7D7D7D',
    100: '#616161',
    200: '#474747',
    300: '#383838',
    400: '#2E2E2E',
    500: '#1E1E1E',
    600: '#121212',
    700: '#111111',
  },
  charcoal: {
    50: '#F2F2F2',
    100: '#E5E5E5',
    200: '#C9C9C9',
    300: '#B0B0B0',
    400: '#969696',
    500: '#7D7D7D',
    600: '#616161',
    700: '#474747',
    800: '#383838',
    850: '#2E2E2E',
    900: '#1E1E1E',
    950: '#121212',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#F0EFEE',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  accent: {
    50: '#f7ffe6',                // Very light lime for subtle highlights
    100: '#efffd1',               // Light lime for hover states
    200: '#e6ffac',               // Soft lime for backgrounds or accents
    300: '#dffc45',               // Base vibrant lime for primary accents
    400: '#c9e33e',               // Slightly darker for buttons or icons
    500: '#b3c938',               // Medium-dark for active states
    600: '#9cb032',               // Darker lime for depth
    700: '#86972c'                // Deep lime for contrast or borders
  },
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
}

// Export types for external use
export type { Colors, ColorScale, ExtendedColorScale }

