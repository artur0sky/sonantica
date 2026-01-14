/**
 * Media Session Integration Hook
 * 
 * Integrates Media Session API with the player for Desktop.
 */

import { useEffect } from 'react';
import { usePlayerStore, useQueueStore, mediaSessionService } from '@sonantica/player-core';
import { PlaybackState } from '@sonantica/shared';

export function useMediaSession() {
  const { currentTrack, state, play, pause, stop, seek } = usePlayerStore();
  const { next, previous } = useQueueStore();
  const player = usePlayerStore((s) => s.player);
  
  // Basic media session for desktop browsers/shells
  useEffect(() => {
    mediaSessionService.updateMetadata(currentTrack);
  }, [currentTrack]);

  useEffect(() => {
    let sessionState: 'none' | 'paused' | 'playing' = 'none';

    switch (state) {
      case PlaybackState.PLAYING:
        sessionState = 'playing';
        break;
      case PlaybackState.PAUSED:
        sessionState = 'paused';
        break;
      default:
        sessionState = 'none';
    }

    mediaSessionService.updatePlaybackState(sessionState);
  }, [state]);

  useEffect(() => {
    const audio = player.getAudioElement();
    if (!audio) return;

    const updatePosition = () => {
      mediaSessionService.updatePositionState(
        audio.duration || 0,
        audio.currentTime || 0,
        audio.playbackRate || 1.0
      );
    };

    const interval = setInterval(updatePosition, 1000);
    audio.addEventListener('timeupdate', updatePosition);

    return () => {
      clearInterval(interval);
      audio.removeEventListener('timeupdate', updatePosition);
    };
  }, [player, currentTrack]);

  useEffect(() => {
    mediaSessionService.setActionHandlers({
      onPlay: async () => play(),
      onPause: () => pause(),
      onStop: () => stop(),
      onPreviousTrack: () => previous(),
      onNextTrack: () => next(),
      onSeekTo: (time: number) => seek(time),
    } as any);

    return () => {
      mediaSessionService.clear();
    };
  }, [play, pause, stop, next, previous, seek]);

  return {
    isSupported: mediaSessionService.isMediaSessionSupported(),
  };
}
