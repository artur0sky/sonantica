/**
 * Analytics Playback Integration
 * 
 * Integrates playback tracking with the player store.
 * Automatically tracks all playback events.
 */

import { useMemo } from 'react';
import { usePlaybackTracking } from '@sonantica/analytics';
import { usePlayerStore } from '@sonantica/player-core';
import { PlaybackState } from '@sonantica/shared';

/**
 * Hook to integrate playback analytics with the player
 * - Tracks play, pause, resume, stop, skip, complete
 * - Tracks progress every 10 seconds
 * - Tracks seek events
 */
export function usePlaybackAnalytics() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const state = usePlayerStore((state) => state.state);
  const duration = usePlayerStore((state) => state.duration);
  const volume = usePlayerStore((state) => state.volume);
  
  const playerState = useMemo(() => ({
    isPlaying: state === PlaybackState.PLAYING,
    getPosition: () => usePlayerStore.getState().currentTime,
    volume: volume,
  }), [state, volume]);

  const trackOptions = useMemo(() => ({
    trackId: currentTrack?.id || '',
    albumId: currentTrack?.metadata?.albumId || '',
    artistId: Array.isArray(currentTrack?.metadata?.artistId) 
      ? currentTrack.metadata.artistId[0] 
      : currentTrack?.metadata?.artistId || '',
    duration: duration || currentTrack?.metadata?.duration || 0,
    codec: currentTrack?.metadata?.format || 'unknown',
    bitrate: currentTrack?.metadata?.bitrate || 0,
    sampleRate: currentTrack?.metadata?.sampleRate || 0,
    source: 'library' as const,
    eqEnabled: false,
    dspEffects: [],
  }), [currentTrack, duration]);

  // The hook handles progress and auto-start/pause tracking automatically
  usePlaybackTracking(trackOptions, playerState);
}
