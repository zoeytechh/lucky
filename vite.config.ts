import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt', not 'autoUpdate' — autoUpdate reloads silently the
      // moment a new service worker takes over, which only happens to be
      // noticeable if the reload happens to land while nothing's being
      // typed/mid-flow. An explicit "update available" banner (see
      // UpdatePrompt.tsx) makes it visible and lets the viewer choose
      // when to take it, instead of an invisible mechanism whose timing
      // depends on exactly when the browser happens to re-check the SW.
      registerType: 'prompt',
      // injectManifest, not generateSW — needed so the service worker
      // can carry its own push/notificationclick handlers (see src/sw.ts)
      // for background notifications. The navigateFallbackDenylist
      // behavior that used to live in the workbox option below now lives
      // directly in sw.ts instead, since generateSW's config surface
      // doesn't apply once there's a custom worker source.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        // Matches generateSW's default precache globbing — keeps the
        // same set of build assets precached as before the switch.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Lucky You',
        short_name: 'Lucky You',
        description: 'Enter the draw, win real cash.',
        theme_color: '#0b3d24',
        background_color: '#0b3d24',
        display: 'standalone',
        start_url: '/',
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
          // A dedicated maskable source (generated with safe-zone padding
          // via @vite-pwa/assets-generator), not the same file as the
          // 'any'-purpose icon above — Android crops a maskable icon to
          // whatever shape the OS theme uses (circle, squircle, ...), so
          // reusing an unpadded icon for both purposes risks the ring
          // motif getting clipped.
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
