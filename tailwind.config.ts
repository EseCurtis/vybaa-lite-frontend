import type { Config } from 'tailwindcss'
import { colors } from './src/shared/colors.shared'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Spread the colors to avoid circular reference
        ...colors
      },
      spacing: {
        'mg': '17px',
        '05-mg': '7px',
      },
      fontFamily: {
        'mona': ['Mona Sans', 'sans-serif'],
        'sans': ['Mona Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'bbh': ['Mona Sans x', 'sans-serif'],
        'outfit': ['Outfit', 'sans-serif'],
        'mona-sans-x': ['Mona Sans x', 'sans-serif']
      },
    },
  },
  plugins: [],
}

export default config
