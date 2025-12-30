import { IOfflineAdapter } from '../contracts';

const CACHE_NAME = 'sonantica-offline-tracks';

export class WebOfflineAdapter implements IOfflineAdapter {
  async isAvailable(trackId: string): Promise<boolean> {
    if (typeof caches === 'undefined') return false;
    try {
      const cache = await caches.open(CACHE_NAME);
      const encodedId = encodeURIComponent(trackId);
      // Use query param to avoid path encoding issues (e.g. %2F decoding)
      const offlineUrl = new URL(`/offline/track?id=${encodedId}`, self.location.origin).href;
      const response = await cache.match(offlineUrl);
      
      if (!response) return false;

      // Strict check: if it's cached but small (< 5KB), it's corrupt/error page
      const sizeHeader = response.headers.get('content-length');
      let size = sizeHeader ? parseInt(sizeHeader, 10) : 0;
      
      if (size > 0 && size < 5 * 1024) {
         console.warn(`🗑️ Found corrupted cache for ${trackId} (${size} bytes). Deleting.`);
         await cache.delete(offlineUrl);
         return false;
      }
      
      return true;
    } catch (e) {
      return false;
    }
  }

  async saveTrack(trackId: string, _url: string, blob: Blob, coverArt?: string): Promise<void> {
    if (typeof caches === 'undefined') throw new Error('Offline storage is only available in secure contexts (HTTPS or localhost)');
    const cache = await caches.open(CACHE_NAME);
    
    const encodedId = encodeURIComponent(trackId);
    // Use query param
    const offlineUrl = new URL(`/offline/track?id=${encodedId}`, self.location.origin).href;
    
    // Create a Response from the blob
    const response = new Response(blob, {
      headers: {
        'Content-Type': blob.type || 'audio/mpeg',
        'Content-Length': blob.size.toString(),
        'Accept-Ranges': 'bytes',
      }
    });
    
    await cache.put(offlineUrl, response);

    // Download cover art if available
    if (coverArt && !coverArt.startsWith('data:')) {
      try {
        const coverResponse = await fetch(coverArt);
        if (coverResponse.ok) {
          await cache.put(`/offline/cover/${trackId}`, coverResponse);
        }
      } catch (error) {
        console.warn(`Failed to cache cover art for ${trackId}:`, error);
      }
    }
  }

  async removeTrack(trackId: string): Promise<void> {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    // Match query param pattern
    const toDelete = keys.filter(request => request.url.includes(`/offline/track?id=${encodeURIComponent(trackId)}`) || request.url.includes(`/offline/cover/${trackId}`));
    
    for (const request of toDelete) {
      await cache.delete(request);
    }
  }

  async getOfflineUrl(trackId: string): Promise<string | undefined> {
    if (typeof caches === 'undefined') return undefined;
    
    const encodedId = encodeURIComponent(trackId);
    const offlineUrl = new URL(`/offline/track?id=${encodedId}`, self.location.origin).href;
    
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(offlineUrl);
    return response ? offlineUrl : undefined;
  }

  async clear(): Promise<void> {
    if (typeof caches === 'undefined') return;
    await caches.delete(CACHE_NAME);
  }

  async getUsage(): Promise<number> {
    if (!navigator.storage || !navigator.storage.estimate) return 0;
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
}
