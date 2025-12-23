/**
 * Track Item Component
 * 
 * Individual track row in lists.
 */

import { IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '../../../shared/utils';
import { usePlayerStore } from '../../../shared/store/playerStore';
import { PlaybackState } from '@sonantica/shared';

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
      {/* Icon / Action */}
      <div className="w-10 h-10 flex items-center justify-center relative">
        {/* Default Icon */}
        <div className={cn(
          "transition-opacity duration-200 absolute inset-0 flex items-center justify-center",
          "group-hover:opacity-0"
        )}>
          {isCurrentTrack ? (
             <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
          ) : (
            <span className="text-text-muted text-sm font-mono opacity-50">
              {track.metadata?.trackNumber || "•"}
            </span>
          )}
        </div>

        {/* Play Action (Hover) */}
        <div className={cn(
          "transition-opacity duration-200 absolute inset-0 flex items-center justify-center opacity-0",
          "group-hover:opacity-100"
        )}>
          {isPlaying ? (
            <IconPlayerPause size={18} className="text-accent fill-current" />
          ) : (
            <IconPlayerPlay size={18} className="text-text fill-current" />
          )}
        </div>
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
          <span>{track.metadata?.artist || 'Unknown Artist'}</span>
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
