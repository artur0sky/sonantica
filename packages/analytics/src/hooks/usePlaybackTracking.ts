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
  albumId: string;
  artistId: string;
  duration: number;
  codec: string;
  bitrate: number;
  sampleRate: number;
  source: 'library' | 'playlist' | 'queue' | 'recommendation' | 'search';
  sourceId?: string;
  eqEnabled: boolean;
  eqPreset?: string;
  dspEffects: string[];
}

interface PlaybackState {
  isPlaying: boolean;
  position: number;
  volume: number;
}

/**
 * Hook for tracking playback events
 */
export function usePlaybackTracking(
  options: PlaybackTrackingOptions,
  state: PlaybackState
) {
  const { trackEvent, startPlaybackTracking, updatePlaybackPosition, endPlaybackTracking } = 
    useAnalyticsStore();
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressRef = useRef<number>(0);
  const playbackStartTimeRef = useRef<number | null>(null);
  
  // Track playback start
  const trackPlaybackStart = useCallback(() => {
    playbackStartTimeRef.current = Date.now();
    startPlaybackTracking(options.trackId);
    
    const data: PlaybackEventData = {
      type: 'playback',
      action: 'start',
      trackId: options.trackId,
      albumId: options.albumId,
      artistId: options.artistId,
      position: state.position,
      duration: options.duration,
      volume: state.volume,
      codec: options.codec,
      bitrate: options.bitrate,
      sampleRate: options.sampleRate,
      source: options.source,
      sourceId: options.sourceId,
      eqEnabled: options.eqEnabled,
      eqPreset: options.eqPreset,
      dspEffects: options.dspEffects,
    };
    
    trackEvent('playback.start', data);
  }, [options, state.position, state.volume, trackEvent, startPlaybackTracking]);
  
  // Track playback pause
  const trackPlaybackPause = useCallback(() => {
    const data: PlaybackEventData = {
      type: 'playback',
      action: 'pause',
      trackId: options.trackId,
      albumId: options.albumId,
      artistId: options.artistId,
      position: state.position,
      duration: options.duration,
      volume: state.volume,
      codec: options.codec,
      bitrate: options.bitrate,
      sampleRate: options.sampleRate,
      source: options.source,
      sourceId: options.sourceId,
      eqEnabled: options.eqEnabled,
      eqPreset: options.eqPreset,
      dspEffects: options.dspEffects,
    };
    
    trackEvent('playback.pause', data);
  }, [options, state.position, state.volume, trackEvent]);
  
  // Track playback resume
  const trackPlaybackResume = useCallback(() => {
    const data: PlaybackEventData = {
      type: 'playback',
      action: 'resume',
      trackId: options.trackId,
      albumId: options.albumId,
      artistId: options.artistId,
      position: state.position,
      duration: options.duration,
      volume: state.volume,
      codec: options.codec,
      bitrate: options.bitrate,
      sampleRate: options.sampleRate,
      source: options.source,
      sourceId: options.sourceId,
      eqEnabled: options.eqEnabled,
      eqPreset: options.eqPreset,
      dspEffects: options.dspEffects,
    };
    
    trackEvent('playback.resume', data);
  }, [options, state.position, state.volume, trackEvent]);
  
  // Track playback complete
  const trackPlaybackComplete = useCallback(() => {
    endPlaybackTracking();
    
    const data: PlaybackEventData = {
      type: 'playback',
      action: 'complete',
      trackId: options.trackId,
      albumId: options.albumId,
      artistId: options.artistId,
      position: options.duration,
      duration: options.duration,
      volume: state.volume,
      codec: options.codec,
      bitrate: options.bitrate,
      sampleRate: options.sampleRate,
      source: options.source,
      sourceId: options.sourceId,
      eqEnabled: options.eqEnabled,
      eqPreset: options.eqPreset,
      dspEffects: options.dspEffects,
    };
    
    trackEvent('playback.complete', data);
  }, [options, state.volume, trackEvent, endPlaybackTracking]);
  
  // Track seek
  const trackSeek = useCallback((from: number, to: number) => {
    const data: PlaybackEventData = {
      type: 'playback',
      action: 'seek',
      trackId: options.trackId,
      albumId: options.albumId,
      artistId: options.artistId,
      position: to,
      duration: options.duration,
      volume: state.volume,
      codec: options.codec,
      bitrate: options.bitrate,
      sampleRate: options.sampleRate,
      source: options.source,
      sourceId: options.sourceId,
      eqEnabled: options.eqEnabled,
      eqPreset: options.eqPreset,
      dspEffects: options.dspEffects,
      seekFrom: from,
      seekTo: to,
    };
    
    trackEvent('playback.seek', data);
  }, [options, state.volume, trackEvent]);
  
  // Track skip
  const trackSkip = useCallback((reason: 'user' | 'error' | 'next_track' = 'user') => {
    endPlaybackTracking();
    
    const data: PlaybackEventData = {
      type: 'playback',
      action: 'skip',
      trackId: options.trackId,
      albumId: options.albumId,
      artistId: options.artistId,
      position: state.position,
      duration: options.duration,
      volume: state.volume,
      codec: options.codec,
      bitrate: options.bitrate,
      sampleRate: options.sampleRate,
      source: options.source,
      sourceId: options.sourceId,
      eqEnabled: options.eqEnabled,
      eqPreset: options.eqPreset,
      dspEffects: options.dspEffects,
      skipReason: reason,
    };
    
    trackEvent('playback.skip', data);
  }, [options, state.position, state.volume, trackEvent, endPlaybackTracking]);
  
  // Track progress (periodic updates)
  const trackProgress = useCallback(() => {
    // Only track if position changed significantly (>5 seconds)
    if (Math.abs(state.position - lastProgressRef.current) < 5) {
      return;
    }
    
    lastProgressRef.current = state.position;
    updatePlaybackPosition(state.position);
    
    const data: PlaybackEventData = {
      type: 'playback',
      action: 'progress',
      trackId: options.trackId,
      albumId: options.albumId,
      artistId: options.artistId,
      position: state.position,
      duration: options.duration,
      volume: state.volume,
      codec: options.codec,
      bitrate: options.bitrate,
      sampleRate: options.sampleRate,
      source: options.source,
      sourceId: options.sourceId,
      eqEnabled: options.eqEnabled,
      eqPreset: options.eqPreset,
      dspEffects: options.dspEffects,
    };
    
    trackEvent('playback.progress', data);
  }, [options, state.position, state.volume, trackEvent, updatePlaybackPosition]);
  
  // Set up progress tracking interval
  useEffect(() => {
    if (state.isPlaying) {
      // Track progress every 10 seconds
      progressIntervalRef.current = setInterval(trackProgress, 10000);
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
