/**
 * Expanded Player Component
 * 
 * Full-screen player view.
 * "Intentional minimalism" - focus on the listening experience.
 */

import { usePlayerStore } from '../../../shared/store/playerStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { Slider } from '../../../shared/components/atoms';
import { formatTime, PlaybackState } from '@sonantica/shared';
import { 
  IconX, 
  IconPlayerSkipBack, 
  IconPlayerPlay, 
  IconPlayerPause, 
  IconPlayerSkipForward, 
  IconVolume, 
  IconVolume2, 
  IconVolume3,
  IconVolumeOff,
  IconMusic
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ExpandedPlayer() {
  const {
    currentTrack,
    state,
    currentTime,
    duration,
    volume,
    play,
    pause,
    seek,
    setVolume,
  } = usePlayerStore();

  const { setPlayerExpanded } = useUIStore();

  if (!currentTrack) {
    setPlayerExpanded(false);
    return null;
  }

  const isPlaying = state === PlaybackState.PLAYING;

  const getVolumeIcon = () => {
    if (volume === 0) return IconVolumeOff;
    if (volume < 0.3) return IconVolume3;
    if (volume < 0.7) return IconVolume2;
    return IconVolume;
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-surface via-bg to-surface p-8 relative overflow-hidden"
    >
      {/* Background Ambience (Optional) */}
      <div className="absolute inset-0 bg-accent/5 pointer-events-none" />

      {/* Close Button */}
      <motion.button
        onClick={() => setPlayerExpanded(false)}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-elevated hover:bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text transition-colors z-10"
        aria-label="Close player"
      >
        <IconX size={20} stroke={1.5} />
      </motion.button>

      {/* Album Art / Visualization */}
      <motion.div 
        layoutId="player-artwork"
        className="w-80 h-80 max-w-[80vw] max-h-[80vw] bg-surface-elevated rounded-2xl flex items-center justify-center text-text-muted mb-8 shadow-2xl border border-border overflow-hidden relative"
      >
        {currentTrack.metadata?.coverArt ? (
          <motion.img 
            src={currentTrack.metadata.coverArt} 
            alt="Cover" 
            className="w-full h-full object-cover"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        ) : (
          <IconMusic size={80} stroke={1} className="opacity-20" />
        )}
      </motion.div>

      {/* Track Info */}
      <div className="text-center mb-10 max-w-2xl px-4 z-10 w-full">
        <motion.h1 
          layoutId="player-title"
          className="text-3xl md:text-4xl font-bold mb-3 text-balance tracking-tight"
        >
          {currentTrack.metadata?.title || 'Unknown Title'}
        </motion.h1>
        <motion.p 
          layoutId="player-artist"
          className="text-xl text-text-muted mb-2 font-medium"
        >
          {currentTrack.metadata?.artist || 'Unknown Artist'}
        </motion.p>
        
        <AnimatePresence>
          {currentTrack.metadata?.album && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg text-text-muted/60"
            >
              {currentTrack.metadata.album}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Timeline */}
      <div className="w-full max-w-2xl mb-10 z-10 px-4">
        <Slider
          value={currentTime}
          min={0}
          max={duration || 0}
          step={0.1}
          onChange={(e) => seek(parseFloat(e.target.value))}
          disabled={!duration}
          className="mb-3 h-2"
        />
        <div className="flex justify-between text-sm text-text-muted tabular-nums px-1 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-8 mb-12 z-10">
        <motion.button
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.9 }}
          className="text-text-muted hover:text-text transition-colors p-2"
        >
          <IconPlayerSkipBack size={32} stroke={1.5} />
        </motion.button>

        <motion.button
          onClick={isPlaying ? pause : play}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-20 h-20 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center shadow-xl transition-colors"
        >
          <AnimatePresence mode="wait">
             <motion.div
                key={isPlaying ? 'pause' : 'play'}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                {isPlaying ? (
                  <IconPlayerPause size={36} className="fill-current" stroke={0} />
                ) : (
                  <IconPlayerPlay size={36} className="fill-current pl-1" stroke={0} />
                )}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, x: 2 }}
          whileTap={{ scale: 0.9 }}
          className="text-text-muted hover:text-text transition-colors p-2"
        >
          <IconPlayerSkipForward size={32} stroke={1.5} />
        </motion.button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-4 w-72 z-10">
        <motion.button
          onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="text-text-muted hover:text-text transition-colors"
          aria-label={volume > 0 ? 'Mute' : 'Unmute'}
        >
          <VolumeIcon size={24} stroke={1.5} />
        </motion.button>
        <Slider
          value={volume}
          min={0}
          max={1}
          step={0.01}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="text-sm text-text-muted tabular-nums w-12 text-right font-mono">
          {Math.round(volume * 100)}%
        </span>
      </div>

      {/* Philosophy Quote */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 text-center z-10"
      >
        <p className="text-sm text-text-muted/40 italic font-serif">
          "Listening is not passive."
        </p>
      </motion.div>
    </motion.div>
  );
}
