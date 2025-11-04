import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Posture AI',
        short_name: 'PostureAI',
        description: 'DIT 자세 분석 AI (한국어)',
        theme_color: '#6C63FF',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/posture-ai-kor/',
        scope: '/posture-ai-kor/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  base: '/posture-ai-kor/',
})
