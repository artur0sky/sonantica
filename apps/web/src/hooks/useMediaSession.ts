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
import { Capacitor } from '@capacitor/core';
import { usePermissions, useMediaPlayback } from '@sonantica/mobile';

export function useMediaSession() {
  const { currentTrack, state, play, pause, stop, seek, next, previous } = usePlayerStore();
  const { toggleShuffle, toggleRepeat } = useQueueStore();
  const player = usePlayerStore((s) => s.player);
  
  const isNative = Capacitor.isNativePlatform();
  const { startService, stopService } = useMediaPlayback();

  // Request notification permission on mobile when playing starts
  const { requestNotificationPermission } = usePermissions();
  
  useEffect(() => {
    const checkPerms = async () => {
      if (isNative && state === PlaybackState.PLAYING) {
        const granted = await requestNotificationPermission();
        if (granted) {
            // Start native foreground service to keep app alive on Android
            await startService();
            
            // Force refresh of media session controls after permission is granted
            mediaSessionService.updateMetadata(currentTrack);
            mediaSessionService.updatePlaybackState('playing');
        }
      } else if (isNative && state === PlaybackState.STOPPED) {
        // Stop service if explicitly stopped
        await stopService();
      }
    };
    checkPerms();
  }, [isNative, state, requestNotificationPermission, currentTrack, startService, stopService]);

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
        
        // Ensure service is stopped when not playing/paused
        if (isNative) stopService();
    }

    mediaSessionService.updatePlaybackState(sessionState);
  }, [state, isNative, stopService]);

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
      onToggleShuffle: () => {
        console.log('🔀 Media Session: Shuffle toggle');
        toggleShuffle();
      },
      onToggleRepeat: () => {
        console.log('🔁 Media Session: Repeat toggle');
        toggleRepeat();
      },
    } as any);

    // Cleanup on unmount
    return () => {
      mediaSessionService.clear();
    };
  }, [play, pause, stop, next, previous, seek, player, toggleShuffle, toggleRepeat]);

  return {
    isSupported: mediaSessionService.isMediaSessionSupported(),
  };
}
