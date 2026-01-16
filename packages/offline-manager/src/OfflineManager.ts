import { IOfflineManager, IOfflineAdapter } from './contracts';
import { OfflineStatus, DownloadQuality, Track } from '@sonantica/shared';
import { useOfflineStore } from './stores/offlineStore';

export class OfflineManager implements IOfflineManager {
  private adapter: IOfflineAdapter;
  private isProcessing = false;
  private urlBuilder?: (track: Track) => string;

  constructor(adapter: IOfflineAdapter, urlBuilder?: (track: Track) => string) {
    this.adapter = adapter;
    this.urlBuilder = urlBuilder;
    // Start processing queue if items exist
    this.processQueue();
  }

  /**
   * Download a single track (with deduplication)
   */
  async downloadTrack(track: Track, quality: DownloadQuality = DownloadQuality.ORIGINAL): Promise<void> {
    const store = useOfflineStore.getState();
    
    // Skip if already completed
    if (store.items[track.id]?.status === OfflineStatus.COMPLETED) {
      console.log(`⏭️ Track ${track.title} already downloaded, skipping`);
      return;
    }

    // Skip if already queued or downloading
    if (store.items[track.id]?.status === OfflineStatus.QUEUED || 
        store.items[track.id]?.status === OfflineStatus.DOWNLOADING) {
      console.log(`⏭️ Track ${track.id} already in queue, skipping`);
      return;
    }
    
    // Add to store as Queued with full track data in a single atomic update
    store.setItemStatus(track.id, 'track', OfflineStatus.QUEUED, quality, track);
    
    // Trigger queue processing
    this.processQueue();
  }

  /**
   * Download multiple tracks (album, artist, etc.) with deduplication
   */
  async downloadTracks(tracks: Track[], quality: DownloadQuality = DownloadQuality.ORIGINAL): Promise<void> {
    console.log(`📥 Queueing ${tracks.length} tracks for download`);
    
    for (const track of tracks) {
      await this.downloadTrack(track, quality);
    }
  }

  async removeTrack(trackId: string): Promise<void> {
    const store = useOfflineStore.getState();
    await this.adapter.removeTrack(trackId);
    store.removeItem(trackId);
  }

  getTrackStatus(trackId: string): OfflineStatus {
    const store = useOfflineStore.getState();
    return store.items[trackId]?.status || OfflineStatus.NONE;
  }

  getOfflineTracks(): string[] {
    const store = useOfflineStore.getState();
    return Object.values(store.items)
      .filter(item => item.status === OfflineStatus.COMPLETED)
      .map(item => item.id);
  }

  setDefaultQuality(quality: DownloadQuality): void {
    console.log(`Default quality set to: ${quality}`);
  }

  /**
   * Process download queue (one at a time to avoid overwhelming the network)
   */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (true) {
        const store = useOfflineStore.getState();
        const nextItem = Object.values(store.items).find(
          item => item.status === OfflineStatus.QUEUED
        );

        if (!nextItem) break;

        // Start downloading
        store.setItemStatus(nextItem.id, nextItem.type, OfflineStatus.DOWNLOADING, nextItem.quality);
        store.setItemProgress(nextItem.id, 0);
        
        try {
          if (!this.urlBuilder) {
            throw new Error('URL builder not configured');
          }

          if (!nextItem.track) {
            throw new Error('Track data not available');
          }

          const track = nextItem.track;
          const url = this.urlBuilder(track);
          
          console.log(`📥 Downloading track: ${track.title} from ${url}`);
          
          // Fetch the audio file
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const contentType = response.headers.get('content-type');
          console.log(`📡 Response type: ${contentType}, length: ${response.headers.get('content-length')}`);

          if (contentType) {
            if (contentType.includes('text/html')) {
              throw new Error('Invalid content type: text/html. Possibly a 404 fallback page.');
            }
            if (contentType.includes('application/json')) {
              // It might be a JSON error response despite 200 OK (some misconfigured servers)
              // Or it's definitely not an audio file
              throw new Error('Invalid content type: application/json. Likely an API error.');
            }
          }

          // Get content length for progress tracking
          const contentLength = response.headers.get('content-length');
          const total = contentLength ? parseInt(contentLength, 10) : 0;
          
          // Validation: suspiciously small files (e.g. < 5KB) are likely errors
          // Exception: allow if we can't determine size (total=0)
          if (total > 0 && total < 5 * 1024) { 
             throw new Error(`File too small (${total} bytes). Likely an error message or corrupt file.`);
          }
          
          let loaded = 0;
          const reader = response.body?.getReader();
          const chunks: Uint8Array[] = [];

          if (!reader) {
            throw new Error('Response body is not readable');
          }

          // Read the stream with progress tracking
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            chunks.push(value);
            loaded += value.length;
            
            // Update progress
            if (total > 0) {
              const progress = Math.round((loaded / total) * 100);
              store.setItemProgress(nextItem.id, progress);
            }
          }

          // Combine chunks into a single blob
          const mimeType = response.headers.get('content-type') || 'audio/mpeg';
          const blob = new Blob(chunks as BlobPart[], { type: mimeType });
          
          console.log(`💾 Downloaded ${blob.size} bytes, Type: ${mimeType}`);

          // Strict validation: Reject HTML/Text masquerading as audio
          if (mimeType.includes('text/html') || mimeType.includes('application/json')) {
             throw new Error(`Invalid content type: ${mimeType}. Download is likely an error page.`);
          }

          // Strict validation: Reject small files
          if (blob.size < 10 * 1024) { 
             throw new Error(`Downloaded file is too small (${blob.size} bytes). Invalid audio file.`);
          }

          // Verify integrity if content-length was available
          if (total > 0 && blob.size !== total) {
             throw new Error(`Download incomplete: expected ${total} bytes, got ${blob.size}`);
          }

          console.log(`💾 Saving track to cache: ${track.title} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
          
          // Save to cache using adapter
          await this.adapter.saveTrack(track.id, url, blob, track.coverArt);
          
          // Mark as completed
          store.setItemStatus(nextItem.id, nextItem.type, OfflineStatus.COMPLETED, nextItem.quality);
          store.setItemProgress(nextItem.id, 100);
          
          console.log(`✅ Downloaded track: ${track.title}`);
        } catch (error) {
          console.error(`❌ Failed to download track ${nextItem.id}:`, error);
          store.setItemError(nextItem.id, error instanceof Error ? error.message : 'Download failed');
          
          // Auto-clear error after 15 seconds so it doesn't stay permanent in the session
          const trackId = nextItem.id;
          setTimeout(() => {
            useOfflineStore.getState().clearError(trackId);
          }, 15000);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Set URL builder for constructing streaming URLs
   */
  setUrlBuilder(builder: (track: Track) => string) {
    this.urlBuilder = builder;
  }

  /**
   * Verified integrity of offline store against actual cache
   * Removes "zombie" tracks that think they are downloaded but are missing/corrupt in cache
   */
  async verifyIntegrity(): Promise<void> {
    const store = useOfflineStore.getState();
    
    // 1. Clear Errors and reset stuck Downloading items
    Object.values(store.items).forEach(item => {
      if (item.status === OfflineStatus.ERROR) {
        // Errors are session-only: clear them on integrity check (startup)
        console.log(`🧹 Clearing session error for track: ${item.id}`);
        store.removeItem(item.id);
      } else if (item.status === OfflineStatus.DOWNLOADING) {
        // If it was stuck in downloading (e.g. page crash), reset to QUEUED
        console.log(`🔄 Resetting stuck downloading track to queued: ${item.id}`);
        store.setItemStatus(item.id, item.type, OfflineStatus.QUEUED, item.quality);
      }
    });

    const offlineItems = Object.values(store.items).filter(item => item.status === OfflineStatus.COMPLETED);
    
    if (offlineItems.length === 0) {
      this.processQueue();
      return;
    }

    console.log(`🔍 Verifying integrity of ${offlineItems.length} offline tracks...`);
    let fixedCount = 0;

    for (const item of offlineItems) {
      const isAvailable = await this.adapter.isAvailable(item.id);
      
      if (!isAvailable) {
        console.warn(`⚠️ Track ${item.id} is marked as downloaded but missing/corrupt in cache. Resetting status.`);
        store.removeItem(item.id); 
        fixedCount++;
      }
    }

    if (fixedCount > 0) {
      console.log(`✅ Integrity check complete: Fixed ${fixedCount} inconsistencies.`);
    } else {
      console.log(`✅ Integrity check complete: All tracks valid.`);
    }

    this.processQueue();
  }
}
