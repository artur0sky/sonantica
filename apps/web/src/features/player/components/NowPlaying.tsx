/**
 * Now Playing Component
 * 
 * Displays current track information.
 */

import { Badge } from '../../../shared/components/atoms';
import { usePlayerStore } from '../../../shared/store/playerStore';

export function NowPlaying() {
  const { currentTrack, state } = usePlayerStore();

  if (!currentTrack) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted italic text-lg">
          "Every file has an intention."
        </p>
        <p className="text-text-muted text-sm mt-2">
          Load a track from the library or use the demo
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-elevated rounded-lg p-6 text-center">
      <Badge variant="accent" className="mb-4">
        {state}
      </Badge>
      
      <h2 className="text-2xl font-bold mb-2">
        {currentTrack.metadata?.title || 'Unknown Title'}
      </h2>
      
      <p className="text-lg text-text-muted mb-1">
        {currentTrack.metadata?.artist || 'Unknown Artist'}
      </p>
      
      <p className="text-sm text-text-muted">
        {currentTrack.metadata?.album || 'Unknown Album'}
      </p>
    </div>
  );
}
