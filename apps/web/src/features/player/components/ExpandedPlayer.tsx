/**
 * Expanded Player Component
 * 
 * Full-screen player view.
 * "Intentional minimalism" - focus on the listening experience.
 */

import { usePlayerStore } from '../../../shared/store/playerStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { Button, Slider } from '../../../shared/components/atoms';
import { formatTime, PlaybackState } from '@sonantica/shared';

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

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-surface via-bg to-surface p-8 relative">
      {/* Close Button */}
      <button
        onClick={() => setPlayerExpanded(false)}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-elevated hover:bg-accent text-text-muted hover:text-white flex items-center justify-center transition-fast"
        aria-label="Close player"
      >
        <span className="text-xl">✕</span>
      </button>

      {/* Album Art / Visualization */}
      <div className="w-80 h-80 bg-surface-elevated rounded-lg flex items-center justify-center text-9xl mb-8 shadow-2xl border border-border">
        🎵
      </div>

      {/* Track Info */}
      <div className="text-center mb-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-3 text-balance">
          {currentTrack.metadata?.title || 'Unknown Title'}
        </h1>
        <p className="text-2xl text-text-muted mb-2">
          {currentTrack.metadata?.artist || 'Unknown Artist'}
        </p>
        {currentTrack.metadata?.album && (
          <p className="text-lg text-text-muted">
            {currentTrack.metadata.album}
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="w-full max-w-3xl mb-8">
        <Slider
          value={currentTime}
          min={0}
          max={duration || 0}
          step={0.1}
          onChange={(e) => seek(parseFloat(e.target.value))}
          disabled={!duration}
          className="mb-3"
        />
        <div className="flex justify-between text-sm text-text-muted tabular-nums px-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-6 mb-8">
        <Button
          variant="ghost"
          size="lg"
          className="text-text-muted hover:text-text"
        >
          <span className="text-2xl">⏮️</span>
        </Button>

        <Button
          onClick={isPlaying ? pause : play}
          variant="primary"
          size="lg"
          className="w-20 h-20 rounded-full text-3xl shadow-lg hover:scale-105"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="text-text-muted hover:text-text"
        >
          <span className="text-2xl">⏭️</span>
        </Button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-4 w-80">
        <button
          onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
          className="text-2xl text-text-muted hover:text-text transition-fast"
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
        <span className="text-sm text-text-muted tabular-nums w-12 text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>

      {/* Philosophy Quote */}
      <div className="absolute bottom-6 text-center">
        <p className="text-sm text-text-muted italic">
          "Listening is not passive."
        </p>
      </div>
    </div>
  );
}
