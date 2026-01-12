# Offline Mode Implementation

## Overview

Sonántica now supports offline playback, allowing users to download tracks, albums, or artists for offline listening. This feature follows Spotify Premium's approach with intelligent deduplication.

## Architecture

### Packages

- **`@sonantica/offline-manager`**: Core offline management logic
  - `OfflineManager`: Handles download queue and deduplication
  - `WebOfflineAdapter`: Web implementation using Cache API
  - `useOfflineStore`: Zustand store for offline state

### Key Features

1. **Smart Deduplication**: If you download a single track, then download the entire album, the track won't be downloaded twice
2. **Quality Selection**: Users can choose download quality (Original, High, Normal, Low)
3. **Visual Indicators**: Tracks show their offline status with icons
4. **Offline Mode**: Toggle to only show/play offline-available tracks
5. **Hide Unavailable**: Option to hide tracks that aren't downloaded when in offline mode

## User Interface

### Settings (Settings → Offline)

- **Offline Mode**: Toggle to enable offline-only playback
- **Hide Unavailable Tracks**: Hide non-downloaded tracks in offline mode
- **Download Quality**: Select quality for downloads
  - Original (Lossless)
  - High (320kbps)
  - Normal (192kbps)
  - Low (128kbps)

### Track List Indicators

- ✅ **Green Check**: Track is available offline
- 🔄 **Spinning Cloud**: Track is currently downloading
- ⏸️ **Pulsing Cloud**: Track is queued for download
- ❌ **Red Exclamation**: Download error

### Offline Mode Behavior

When offline mode is enabled:
- Tracks not available offline appear grayed out (40% opacity, grayscale)
- If "Hide Unavailable" is enabled, non-downloaded tracks are hidden completely
- Queue items follow the same behavior

## Implementation Details

### Download Flow

1. User selects track/album/artist to download
2. `OfflineManager.downloadTrack()` or `downloadTracks()` is called
3. Manager checks if track is already downloaded/queued
4. If not, adds to queue with selected quality
5. Queue processes one track at a time
6. Track data (audio + metadata + cover + lyrics) is saved to Cache API
7. Status updates in real-time via Zustand store

### Deduplication Logic

```typescript
// Example: Download album after downloading a single track
await offlineManager.downloadTrack(track1, 'original'); // Downloads
await offlineManager.downloadTracks(albumTracks, 'original'); // Skips track1, downloads rest
```

### Storage

- **Audio Files**: Cache API (`sonantica-offline-tracks` cache)
- **Metadata**: Stored with audio in cache
- **State**: Zustand store persisted to localStorage

## Future Enhancements

1. **Progress Tracking**: Show download progress percentage
2. **Batch Operations**: Download all tracks by artist/genre
3. **Storage Management**: View storage usage, clear cache
4. **Sync Status**: Indicate when offline tracks are out of sync
5. **Quality Conversion**: Re-download at different quality
6. **Mobile Native**: Use native filesystem on Capacitor

## Technical Notes

### SOLID Principles

- **Single Responsibility**: Each class has one job
- **Open/Closed**: Extensible via `IOfflineAdapter` interface
- **Dependency Inversion**: Manager depends on abstractions, not concrete implementations

### Clean Architecture

- Core logic in `packages/offline-manager` (platform-agnostic)
- Web-specific implementation in `WebOfflineAdapter`
- UI components consume via hooks
- No direct coupling between layers

## Usage Example

```typescript
import { OfflineManager, WebOfflineAdapter } from '@sonantica/offline-manager';

// Initialize
const adapter = new WebOfflineAdapter();
const manager = new OfflineManager(adapter, buildTrackStreamingUrl);

// Download single track
await manager.downloadTrack(track, 'original');

// Download album (with deduplication)
await manager.downloadTracks(albumTracks, 'high');

// Check status
const status = manager.getTrackStatus(trackId);

// Remove from offline
await manager.removeTrack(trackId);
```

## Testing

To test offline functionality:

1. Go to Settings → Offline
2. Set download quality to "Original"
3. Right-click a track → "Download for Offline" (to be implemented in context menu)
4. Watch the download indicator
5. Enable "Offline Mode"
6. Verify only downloaded tracks are playable

---

**Philosophy**: "Respect the intention of the sound and the freedom of the listener."
