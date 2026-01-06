import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  resolve: {
      alias: {
        'react': path.resolve(__dirname, './node_modules/react'),
        'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
        // Force resolution to the source to avoid double-bundling issues if symlinks are weird
        '@sonantica/mobile': path.resolve(__dirname, '../mobile/src/index.ts'),
      },
  },
  define: {
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'icon-maskable.png'],
      manifest: {
        name: 'Sonántica',
        short_name: 'Sonántica',
        description: 'Audio-first multimedia player. Respect the intention of the sound and the freedom of the listener.',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['music', 'entertainment', 'multimedia'],
        shortcuts: [
          {
            name: 'Library',
            short_name: 'Library',
            description: 'Browse your music library',
            url: '/library',
            icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Now Playing',
            short_name: 'Playing',
            description: 'View current playback',
            url: '/player',
            icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
});
