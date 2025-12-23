/**
 * Tracks Page
 * 
 * Main library view showing all tracks.
 * Default landing page.
 */

import { Button } from '../../../shared/components/atoms';
import { SearchBar } from '../../../shared/components/molecules';
import { useLibraryStore } from '../../../shared/store/libraryStore';
import { usePlayerStore } from '../../../shared/store/playerStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { TrackItem } from '../components/TrackItem';

export function TracksPage() {
  const {
    stats,
    scanning,
    scanProgress,
    searchQuery,
    scan,
    setSearchQuery,
    getFilteredTracks,
  } = useLibraryStore();

  const { loadTrack, play } = usePlayerStore();
  const { setQueueOpen } = useUIStore();

  const filteredTracks = getFilteredTracks();

  const handleScan = async () => {
    try {
      await scan(['/media/']);
    } catch (error) {
      console.error('Scan failed:', error);
    }
  };

  const handleTrackClick = async (track: any) => {
    try {
      await loadTrack({
        id: track.id,
        url: track.path,
        mimeType: track.mimeType,
        metadata: track.metadata,
      });
      await play();
      setQueueOpen(true); // Open queue when playing
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Tracks</h1>
            {stats.totalTracks > 0 && (
              <p className="text-sm text-text-muted mt-1">
                {stats.totalTracks} track{stats.totalTracks !== 1 ? 's' : ''} in library
              </p>
            )}
          </div>

          <Button
            onClick={handleScan}
            disabled={scanning}
            variant="primary"
          >
            {scanning ? `🔄 Scanning... (${scanProgress})` : '🔄 Scan Library'}
          </Button>
        </div>

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search tracks..."
        />
      </div>

      {/* Content */}
      {stats.totalTracks === 0 ? (
        <div className="text-center py-20 bg-surface border border-border rounded-lg">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-xl font-semibold mb-2">No music found</h2>
          <p className="text-text-muted mb-6">
            Click "Scan Library" to index your music files
          </p>
          <Button onClick={handleScan} variant="primary" disabled={scanning}>
            {scanning ? 'Scanning...' : 'Scan Library'}
          </Button>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-muted">
            No tracks found matching "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTracks.map((track: any) => (
            <TrackItem
              key={track.id}
              track={track}
              onClick={() => handleTrackClick(track)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
