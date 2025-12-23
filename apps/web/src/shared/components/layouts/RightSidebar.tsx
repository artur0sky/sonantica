/**
 * Right Sidebar - Queue
 * 
 * Playback queue management.
 * Shows current track and upcoming tracks.
 */

import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../atoms';

export function RightSidebar() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const { toggleQueue } = useUIStore();

  // TODO: Implement queue store
  const queue: any[] = [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold">Queue</h2>
        <button
          onClick={toggleQueue}
          className="text-text-muted hover:text-text transition-fast"
          aria-label="Close queue"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Now Playing */}
        {currentTrack && (
          <div className="mb-6">
            <h3 className="text-sm text-text-muted mb-3 uppercase tracking-wide">
              Now Playing
            </h3>
            <div className="bg-surface-elevated p-4 rounded-md border border-accent">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-surface rounded flex items-center justify-center text-2xl flex-shrink-0">
                  ▶️
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {currentTrack.metadata?.title || 'Unknown Title'}
                  </div>
                  <div className="text-sm text-text-muted truncate">
                    {currentTrack.metadata?.artist || 'Unknown Artist'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Queue List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-text-muted uppercase tracking-wide">
              Next Up
            </h3>
            {queue.length > 0 && (
              <Button variant="ghost" size="sm">
                Clear
              </Button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-muted text-sm">
                No tracks in queue
              </p>
              <p className="text-text-muted text-xs mt-2">
                Tracks will appear here when you play them
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {queue.map((track: any, index: number) => (
                <li
                  key={track.id}
                  className="flex items-center gap-3 p-3 rounded-md hover:bg-surface-elevated transition-fast cursor-pointer"
                >
                  <span className="text-text-muted text-sm w-6">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate text-sm">
                      {track.metadata?.title}
                    </div>
                    <div className="text-xs text-text-muted truncate">
                      {track.metadata?.artist}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
