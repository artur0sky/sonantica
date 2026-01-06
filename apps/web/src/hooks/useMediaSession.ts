/**
 * Media Session Integration Hook
 * 
 * Integrates Media Session API with the player for:
 * - Lockscreen controls
 * - Media keys
 * - Headset/Bluetooth controls
 * - System notifications
 */

import { useEffect } from 'react';
import { usePlayerStore, useQueueStore, mediaSessionService } from '@sonantica/player-core';
import { PlaybackState } from '@sonantica/shared';

export function useMediaSession() {
  const { currentTrack, state, play, pause, stop, seek } = usePlayerStore();
  const { next, previous } = useQueueStore();
  const player = usePlayerStore((s) => s.player);

  // Update metadata when track changes
  useEffect(() => {
    mediaSessionService.updateMetadata(currentTrack);
  }, [currentTrack]);

  // Update playback state
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

  // Update position state
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

    // Update position every second
    const interval = setInterval(updatePosition, 1000);
    
    // Also update on timeupdate
    audio.addEventListener('timeupdate', updatePosition);

    return () => {
      clearInterval(interval);
      audio.removeEventListener('timeupdate', updatePosition);
    };
  }, [player, currentTrack]);

  // Register action handlers
  useEffect(() => {
    mediaSessionService.setActionHandlers({
      onPlay: async () => {
        console.log('🎵 Media Session: Play');
        await play();
      },
      onPause: () => {
        console.log('⏸️ Media Session: Pause');
        pause();
      },
      onStop: () => {
        console.log('⏹️ Media Session: Stop');
        stop();
      },
      onPreviousTrack: () => {
        console.log('⏮️ Media Session: Previous');
        previous();
      },
      onNextTrack: () => {
        console.log('⏭️ Media Session: Next');
        next();
      },
      onSeekBackward: () => {
        console.log('⏪ Media Session: Seek Backward');
        const audio = player.getAudioElement();
        if (audio) {
          seek(Math.max(0, audio.currentTime - 10));
        }
      },
      onSeekForward: () => {
        console.log('⏩ Media Session: Seek Forward');
        const audio = player.getAudioElement();
        if (audio) {
          seek(Math.min(audio.duration || 0, audio.currentTime + 10));
        }
      },
      onSeekTo: (time: number) => {
        console.log(`⏩ Media Session: Seek to ${time}s`);
        seek(time);
      },
    });

    // Cleanup on unmount
    return () => {
      mediaSessionService.clear();
    };
  }, [play, pause, stop, next, previous, seek, player]);

  return {
    isSupported: mediaSessionService.isMediaSessionSupported(),
  };
}
