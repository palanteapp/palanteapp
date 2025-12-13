import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-light.svg', 'logo-light.png', 'logo-dark.png'],
      manifest: {
        name: 'Palante',
        short_name: 'Palante',
        description: 'Personalized Progress, Delivered Daily',
        theme_color: '#F8F5F2',
        background_color: '#F8F5F2',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'logo-light.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-light.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logo-light.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
