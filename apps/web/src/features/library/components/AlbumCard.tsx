/**
 * Album Card Component
 */

import type { Album } from '@sonantica/media-library';
import { cn } from '../../../shared/utils';

interface AlbumCardProps {
  album: Album;
  onClick: () => void;
}

export function AlbumCard({ album, onClick }: AlbumCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-md',
        'border border-border bg-surface hover:bg-surface-elevated',
        'transition-fast text-left group'
      )}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded bg-surface-elevated flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
        💿
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{album.name}</div>
        <div className="text-sm text-text-muted truncate">
          {album.artist} • {album.tracks.length} track{album.tracks.length !== 1 ? 's' : ''}
        </div>
      </div>
    </button>
  );
}
