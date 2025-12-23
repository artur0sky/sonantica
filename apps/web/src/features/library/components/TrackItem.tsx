/**
 * Track Item Component
 * 
 * Individual track row in lists.
 */

import { IconPlayerPlay, IconPlayerPause, IconMusic } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '../../../shared/utils';
import { usePlayerStore } from '../../../shared/store/playerStore';
import { PlaybackState } from '@sonantica/shared';
import { formatArtists } from '../../../shared/utils/metadata';

interface TrackItemProps {
  track: any;
  onClick: () => void;
}

export function TrackItem({ track, onClick }: TrackItemProps) {
  const { currentTrack, state } = usePlayerStore();
  
  const isCurrentTrack = currentTrack?.id === track.id;
  const isPlaying = isCurrentTrack && state === PlaybackState.PLAYING;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.01, 
        backgroundColor: "var(--color-surface-elevated)",
        transition: { duration: 0.1 }
      }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors group border border-transparent",
        isCurrentTrack ? "bg-surface-elevated border-accent/20" : "hover:bg-surface-elevated/50"
      )}
    >
      {/* Album Art / Icon */}
      <div className="w-12 h-12 flex-shrink-0 relative rounded-md overflow-hidden bg-surface-elevated border border-border">
        {/* Cover Art or Music Icon */}
        {track.metadata?.coverArt ? (
          <img 
            src={track.metadata.coverArt} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IconMusic size={20} className="text-text-muted/30" stroke={1.5} />
          </div>
        )}

        {/* Play/Pause Overlay (Hover) */}
        <div className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center",
          "transition-opacity duration-200",
          "opacity-0 group-hover:opacity-100"
        )}>
          {isPlaying ? (
            <IconPlayerPause size={24} className="text-white fill-current drop-shadow-lg" />
          ) : (
            <IconPlayerPlay size={24} className="text-white fill-current drop-shadow-lg" />
          )}
        </div>

        {/* Current Track Indicator */}
        {isCurrentTrack && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent" />
        )}
      </div>

      {/* Track Details */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium truncate transition-colors",
          isCurrentTrack ? "text-accent" : "text-text"
        )}>
          {track.metadata?.title || track.filename}
        </div>
        <div className="text-sm text-text-muted truncate flex items-center gap-2">
          <span>{formatArtists(track.metadata?.artist)}</span>
          {track.metadata?.album && (
            <>
              <span className="opacity-40">•</span>
              <span className="opacity-80">{track.metadata.album}</span>
            </>
          )}
        </div>
      </div>

      {/* Duration (if available) - Optional */}
      {track.metadata?.duration && (
        <div className="text-sm text-text-muted font-mono variant-numeric-tabular">
          {Math.floor(track.metadata.duration / 60)}:
          {(track.metadata.duration % 60).toString().padStart(2, '0')}
        </div>
      )}
    </motion.div>
  );
}
