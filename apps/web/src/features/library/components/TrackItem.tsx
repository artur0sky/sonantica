/**
 * Track Item Component
 * 
 * Individual track in the library.
 */

import type { Track } from '@sonantica/media-library';
import { cn } from '../../../shared/utils';
import { usePlayerStore } from '../../../shared/store/playerStore';

interface TrackItemProps {
  track: Track;
  onClick: () => void;
}

export function TrackItem({ track, onClick }: TrackItemProps) {
  const currentTrack = usePlayerStore((s: any) => s.currentTrack);
  const isPlaying = currentTrack?.id === track.id;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-md',
        'border border-border bg-surface hover:bg-surface-elevated',
        'transition-fast text-left group',
        isPlaying && 'border-accent bg-surface-elevated'
      )}
    >
      <div className={cn(
        'flex-shrink-0 w-12 h-12 rounded bg-surface-elevated',
        'flex items-center justify-center text-2xl',
        'group-hover:scale-105 transition-transform'
      )}>
        {isPlaying ? '▶️' : '🎵'}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={cn(
          'font-medium truncate',
          isPlaying && 'text-accent'
        )}>
          {track.metadata.title || track.filename}
        </div>
        <div className="text-sm text-text-muted truncate">
          {track.metadata.artist} • {track.metadata.album}
        </div>
      </div>
    </button>
  );
}
