/**
 * usePlaybackTracking Hook
 * 
 * Specialized hook for tracking playback events.
 * Integrates with player-core to automatically track playback lifecycle.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAnalyticsStore } from '../store/analyticsStore';
import type { PlaybackEventData } from '../types';

interface PlaybackTrackingOptions {
  trackId: string;
  albumId?: string;
  artistId?: string;
  duration: number;
  codec?: string;
  bitrate?: number;
  sampleRate?: number;
  source?: 'library' | 'playlist' | 'queue' | 'recommendation' | 'search';
  sourceId?: string;
  eqEnabled?: boolean;
  eqPreset?: string;
  dspEffects?: string[];
}

interface PlaybackState {
  isPlaying: boolean;
  position: number;
  volume: number;
}

/**
 * Hook for tracking playback events
 * Automatically tracks start/pause/resume based on state changes
 */
export function usePlaybackTracking(
  options: PlaybackTrackingOptions,
  state: PlaybackState
) {
  const trackEvent = useAnalyticsStore(s => s.trackEvent);
  const startPlaybackTracking = useAnalyticsStore(s => s.startPlaybackTracking);
  const updatePlaybackPosition = useAnalyticsStore(s => s.updatePlaybackPosition);
  const endPlaybackTracking = useAnalyticsStore(s => s.endPlaybackTracking);
  const enabled = useAnalyticsStore(s => s.config.enabled);
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressRef = useRef<number>(0);
  const lastStateRef = useRef<boolean>(false);
  const lastTrackIdRef = useRef<string | null>(null);
  const isCompletedRef = useRef<boolean>(false);
  
  // Common data for events
  const getEventData = useCallback((action: string): PlaybackEventData => ({
    type: 'playback',
    action: action as any,
    trackId: options.trackId,
    albumId: options.albumId || 'unknown',
    artistId: options.artistId || 'unknown',
    position: state.position,
    duration: options.duration,
    volume: state.volume,
    codec: options.codec || 'unknown',
    bitrate: options.bitrate || 0,
    sampleRate: options.sampleRate || 0,
    source: options.source || 'library',
    sourceId: options.sourceId,
    eqEnabled: options.eqEnabled || false,
    eqPreset: options.eqPreset,
    dspEffects: options.dspEffects || [],
  }), [options, state]);

  // Track playback start
  const trackPlaybackStart = useCallback(() => {
    startPlaybackTracking(options.trackId);
    trackEvent('playback.start', getEventData('start'));
    isCompletedRef.current = false;
  }, [options.trackId, getEventData, startPlaybackTracking, trackEvent]);
  
  // Track playback pause
  const trackPlaybackPause = useCallback(() => {
    trackEvent('playback.pause', getEventData('pause'));
  }, [getEventData, trackEvent]);
  
  // Track playback resume
  const trackPlaybackResume = useCallback(() => {
    trackEvent('playback.resume', getEventData('resume'));
  }, [getEventData, trackEvent]);
  
  // Track playback complete
  const trackPlaybackComplete = useCallback(() => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    
    endPlaybackTracking();
    trackEvent('playback.complete', {
      ...getEventData('complete'),
      position: options.duration,
    });
  }, [options.duration, getEventData, trackEvent, endPlaybackTracking]);
  
  // Track seek
  const trackSeek = useCallback((from: number, to: number) => {
    trackEvent('playback.seek', {
      ...getEventData('seek'),
      position: to,
      seekFrom: from,
      seekTo: to,
    });
  }, [getEventData, trackEvent]);
  
  // Track skip
  const trackSkip = useCallback((reason: 'user' | 'error' | 'next_track' = 'user') => {
    endPlaybackTracking();
    trackEvent('playback.skip', {
      ...getEventData('skip'),
      skipReason: reason,
    });
  }, [getEventData, trackEvent, endPlaybackTracking]);
  
  // Track progress (periodic updates)
  const trackProgress = useCallback(() => {
    // Only track if position changed significantly (>15 seconds)
    if (Math.abs(state.position - lastProgressRef.current) < 15) {
      return;
    }
    
    lastProgressRef.current = state.position;
    updatePlaybackPosition(state.position);
    trackEvent('playback.progress', getEventData('progress'));
  }, [state.position, getEventData, trackEvent, updatePlaybackPosition]);
  
  // Auto-track state changes
  useEffect(() => {
    if (!options.trackId) return;

    // 1. Handle Track Change
    if (options.trackId !== lastTrackIdRef.current) {
      lastTrackIdRef.current = options.trackId;
      lastProgressRef.current = 0;
      isCompletedRef.current = false;
      
      if (state.isPlaying) {
        trackPlaybackStart();
      }
    }

    // 2. Handle Play/Pause transitions
    if (state.isPlaying !== lastStateRef.current) {
      if (state.isPlaying) {
        if (state.position < 1) {
          trackPlaybackStart();
        } else {
          trackPlaybackResume();
        }
      } else {
        // Check if actually finished or just paused
        const isNearEnd = options.duration > 0 && state.position >= options.duration - 1;
        if (isNearEnd) {
          trackPlaybackComplete();
        } else {
          trackPlaybackPause();
        }
      }
      lastStateRef.current = state.isPlaying;
    }
  }, [
    state.isPlaying, 
    options.trackId, 
    options.duration,
    state.position,
    trackPlaybackStart, 
    trackPlaybackResume, 
    trackPlaybackPause, 
    trackPlaybackComplete
  ]);

  // Set up progress tracking interval
  useEffect(() => {
    if (state.isPlaying) {
      progressIntervalRef.current = setInterval(trackProgress, 30000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [state.isPlaying, trackProgress]);
  
  return {
    trackPlaybackStart,
    trackPlaybackPause,
    trackPlaybackResume,
    trackPlaybackComplete,
    trackSeek,
    trackSkip,
  };
}
