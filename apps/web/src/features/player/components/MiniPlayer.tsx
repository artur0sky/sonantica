/**
 * Mini Player Component
 * 
 * Sticky bottom player inspired by SoundCloud.
 * "Functional elegance" - minimal but complete controls.
 */

import { usePlayerStore } from '../../../shared/store/playerStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { Slider } from '../../../shared/components/atoms';
import { formatTime, PlaybackState } from '@sonantica/shared';
import { cn } from '../../../shared/utils';

export function MiniPlayer() {
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

  const { togglePlayerExpanded, toggleQueue } = useUIStore();

  if (!currentTrack) return null;

  const isPlaying = state === PlaybackState.PLAYING;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-surface-elevated">
      {/* Progress Bar */}
      <div className="h-1 bg-surface relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-accent transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Seek"
        />
      </div>

      {/* Player Controls */}
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Track Info - Clickable to expand */}
        <button
          onClick={togglePlayerExpanded}
          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-fast text-left"
        >
          <div className="w-14 h-14 bg-surface rounded flex items-center justify-center text-2xl flex-shrink-0">
            🎵
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">
              {currentTrack.metadata?.title || 'Unknown Title'}
            </div>
            <div className="text-sm text-text-muted truncate">
              {currentTrack.metadata?.artist || 'Unknown Artist'}
            </div>
          </div>
        </button>

        {/* Center Controls */}
        <div className="flex items-center gap-3">
          <button
            className="text-text-muted hover:text-text transition-fast"
            aria-label="Previous"
          >
            ⏮️
          </button>

          <button
            onClick={isPlaying ? pause : play}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-white transition-fast',
              'bg-accent hover:bg-accent-hover hover:scale-105'
            )}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <span className="text-xl">{isPlaying ? '⏸️' : '▶️'}</span>
          </button>

          <button
            className="text-text-muted hover:text-text transition-fast"
            aria-label="Next"
          >
            ⏭️
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          {/* Time Display */}
          <div className="text-sm text-text-muted tabular-nums hidden md:block">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Volume Control */}
          <div className="hidden lg:flex items-center gap-2 w-32">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
              className="text-text-muted hover:text-text transition-fast"
              aria-label={volume > 0 ? 'Mute' : 'Unmute'}
            >
              {volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔇'}
            </button>
            <Slider
              value={volume}
              min={0}
              max={1}
              step={0.01}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1"
            />
          </div>

          {/* Queue Toggle */}
          <button
            onClick={toggleQueue}
            className="text-text-muted hover:text-accent transition-fast"
            aria-label="Toggle queue"
          >
            📋
          </button>
        </div>
      </div>
    </div>
  );
}
