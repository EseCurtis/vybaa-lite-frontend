import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// import outray from '@outray/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ['vybaa-lite.outray.app', 'localhost'],
  },
  plugins: [
    // outray({
    //   subdomain: 'vybaa-lite',
    // }),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    viteReact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Vybaa',
        short_name: 'Vybaa',
        description: 'Vybaa – goals, communities, and Play Points',
        start_url: '/app/home',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#020617',
        icons: [
          {
            src: '/assets/icons/icon-192.webp',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/assets/icons/icon-512.webp',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/assets/icons/icon-512.webp',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    chunkSizeWarningLimit: 1600, // Value in KiB
  },
})
