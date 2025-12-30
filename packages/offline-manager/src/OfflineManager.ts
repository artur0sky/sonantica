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
          if (contentType && contentType.includes('text/html')) {
            throw new Error('Invalid content type: text/html. Possibly a 404 fallback page.');
          }

          // Get content length for progress tracking
          const contentLength = response.headers.get('content-length');
          const total = contentLength ? parseInt(contentLength, 10) : 0;
          
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
          const blob = new Blob(chunks as BlobPart[], { type: response.headers.get('content-type') || 'audio/mpeg' });
          
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
}
