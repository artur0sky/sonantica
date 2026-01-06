/**
 * BufferManager - Advanced audio buffering service
 * 
 * Responsibilities:
 * - Pre-fetching audio data for upcoming tracks
 * - Managing memory/cache for buffered audio
 * - Providing secure Blob URLs for the player engine
 * - Implementing high-performance buffering strategies
 * 
 * "Respect the intention of the sound and the freedom of the listener."
 */

import {
  BufferStrategy,
  type BufferConfig,
  type MediaSource,
  clamp,
} from '@sonantica/shared';

/**
 * Default buffer configuration
 */
const DEFAULT_BUFFER_CONFIG: BufferConfig = {
  strategy: BufferStrategy.BALANCED,
  maxCacheSize: 100, // 100 MB
  prebufferSeconds: 30,
  interruptOnSwitch: true,
};

interface CachedBuffer {
  id: string;
  blob: Blob;
  url: string;
  lastUsed: number;
}

export class BufferManager {
  private config: BufferConfig;
  private cache: Map<string, CachedBuffer> = new Map();
  private activeFetches: Map<string, AbortController> = new Map();
  private totalCacheSize: number = 0;

  constructor(config: Partial<BufferConfig> = {}) {
    this.config = { ...DEFAULT_BUFFER_CONFIG, ...config };
    console.log('🛡️  Buffer Manager initialized');
  }

  /**
   * Update buffer configuration
   */
  updateConfig(config: Partial<BufferConfig>): void {
    this.config = { ...this.config, ...config };
    this.enforceCacheLimits();
  }

  /**
   * Get an audio URL for a source. 
   * Pre-fetches if necessary or returns from cache.
   */
  async getBufferUrl(source: MediaSource): Promise<string> {
    const cached = this.cache.get(source.id);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached.url;
    }

    // Cancel other loads if strategy says so
    if (this.config.interruptOnSwitch) {
      this.cancelAllFetches();
    }

    return this.fetchAndCache(source);
  }

  /**
   * Pre-buffer a list of upcoming sources
   */
  async prebuffer(sources: MediaSource[]): Promise<void> {
    if (this.config.strategy === BufferStrategy.CONSERVATIVE) return;

    const limit = this.config.strategy === BufferStrategy.AGGRESSIVE ? 3 : 1;
    const toBuffer = sources.slice(0, limit);

    for (const source of toBuffer) {
      if (!this.cache.has(source.id) && !this.activeFetches.has(source.id)) {
        // We don't await here to allow parallel pre-buffering
        this.fetchAndCache(source).catch(err => 
          console.warn(`⚠️ Pre-buffering failed for ${source.id}:`, err)
        );
      }
    }
  }

  /**
   * Cancel loading a specific track
   */
  cancelFetch(trackId: string): void {
    const controller = this.activeFetches.get(trackId);
    if (controller) {
      controller.abort();
      this.activeFetches.delete(trackId);
    }
  }

  /**
   * Cancel all ongoing fetch operations
   */
  cancelAllFetches(): void {
    for (const controller of this.activeFetches.values()) {
      controller.abort();
    }
    this.activeFetches.clear();
  }

  /**
   * Fetch audio data and store it in cache
   */
  private async fetchAndCache(source: MediaSource): Promise<string> {
    if (this.activeFetches.has(source.id)) {
      // Return a promise that waits for the existing fetch? 
      // For simplicity, let's just wait for metadata if it's already fetching
      // but usually getBufferUrl will be called once per track.
    }

    const controller = new AbortController();
    this.activeFetches.set(source.id, controller);

    try {
      const response = await fetch(source.url, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Update cache size tracker
      this.totalCacheSize += blob.size;
      this.enforceCacheLimits();

      const url = URL.createObjectURL(blob);
      const cachedBuffer: CachedBuffer = {
        id: source.id,
        blob,
        url,
        lastUsed: Date.now(),
      };

      this.cache.set(source.id, cachedBuffer);
      return url;
    } finally {
      this.activeFetches.delete(source.id);
    }
  }

  /**
   * Enforce cache size limits using LRU strategy
   */
  private enforceCacheLimits(): void {
    const maxSize = this.config.maxCacheSize * 1024 * 1024; // MB to bytes
    
    if (this.totalCacheSize <= maxSize) return;

    // Convert to array and sort by lastUsed
    const sorted = Array.from(this.cache.values()).sort((a, b) => a.lastUsed - b.lastUsed);

    while (this.totalCacheSize > maxSize && sorted.length > 0) {
      const oldest = sorted.shift();
      if (oldest) {
        this.totalCacheSize -= oldest.blob.size;
        URL.revokeObjectURL(oldest.url);
        this.cache.delete(oldest.id);
      }
    }
  }

  /**
   * Full cleanup
   */
  dispose(): void {
    this.cancelAllFetches();
    for (const cached of this.cache.values()) {
      URL.revokeObjectURL(cached.url);
    }
    this.cache.clear();
    this.totalCacheSize = 0;
  }
}
