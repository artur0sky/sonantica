/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { RangeRequestsPlugin } from 'workbox-range-requests';

declare let self: ServiceWorkerGlobalScope;

// Take over immediately
self.skipWaiting();
clientsClaim();

// Clean old caches
cleanupOutdatedCaches();

// Precache manifest assets
precacheAndRoute(self.__WB_MANIFEST);

// ---------------------------------------------------------------------------
// OFFLINE TRACKS HANDLING (The core fix)
// ---------------------------------------------------------------------------

// 1. Offline Tracks - Served from 'sonantica-offline-tracks' cache
// Supports Range Requests for scrubbing/seeking
console.log('Service Worker: v3 - Query Params Support');

registerRoute(
  ({ url }) => {
    // Match /offline/track (from query params) OR /offline/track/ (legacy)
    const isMatch = url.pathname === '/offline/track' || url.pathname.startsWith('/offline/track/');
    if (isMatch) console.log(`SW: Intercepting offline track: ${url.href}`);
    return isMatch;
  },
  new CacheFirst({
    cacheName: 'sonantica-offline-tracks',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new RangeRequestsPlugin(), // Enable seeking in cached audio
    ],
  })
);

// 2. Offline Covers
registerRoute(
  ({ url }) => url.pathname.startsWith('/offline/cover/'),
  new CacheFirst({
    cacheName: 'sonantica-offline-tracks',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// ---------------------------------------------------------------------------
// CACHING STRATEGIES
// ---------------------------------------------------------------------------

// 3. Audio Cache (Runtime/Streaming)
registerRoute(
  ({ request, url }) => 
    request.destination === 'audio' || 
    url.pathname.match(/\.(?:mp3|flac|m4a|aac|ogg|opus|wav|aiff)$/i),
  new CacheFirst({
    cacheName: 'audio-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
      new RangeRequestsPlugin(),
    ],
  })
);

// 4. Images
registerRoute(
  ({ request, url }) => 
    request.destination === 'image' ||
    url.pathname.match(/\.(?:png|jpg|jpeg|webp|gif|svg)$/i),
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// 5. Fonts (Google Fonts)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// 6. API Calls (Network First)
registerRoute(
  ({ url }) => url.pathname.includes('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
    networkTimeoutSeconds: 10,
  })
);

// Fallback to index.html for SPA navigation
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  ({ request, url }) => {
    // If it's a navigation request and not a file
    if (request.mode !== 'navigate') {
      return false;
    } 
    if (url.pathname.startsWith('/_')) {
      return false;
    }
    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    }
    return true;
  },
  createHandlerBoundToURL('index.html')
);
