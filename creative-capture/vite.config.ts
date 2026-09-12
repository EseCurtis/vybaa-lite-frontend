import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const fixture = fileURLToPath(new URL('./fixtures.ts', import.meta.url))
const runtime = fileURLToPath(new URL('./runtime.tsx', import.meta.url))
const fixtures = ['@/hooks/use-rewind.hook', '@/hooks/use-goals.hook']
const runtimeModules = [
  '@tanstack/react-router',
  '@/providers/auth.provider',
  '@/providers/notification.provider',
  '@/providers/bottom-sheet.provider',
  '@/providers/toast.provider',
  '@/hooks/use-pro-access.hook',
  '@/hooks/use-safe-area-insets.hook',
  '@/components/layout/keyboard-avoiding-view.component',
  '@/shared/haptic.util',
  '@/shared/api/auth.api',
  '@/shared/api/http',
  '@/shared/goal/goal-alarm.service',
]

export default defineConfig({
  root,
  envDir: fileURLToPath(new URL('./', import.meta.url)),
  plugins: [react()],
  optimizeDeps: { entries: ['creative-capture/index.html'] },
  server: { host: '127.0.0.1', port: 3016, strictPort: true },
  resolve: {
    alias: [
      ...fixtures.map((find) => ({ find, replacement: fixture })),
      ...runtimeModules.map((find) => ({ find, replacement: runtime })),
      {
        find: '@',
        replacement: fileURLToPath(new URL('../src', import.meta.url)),
      },
    ],
  },
})
