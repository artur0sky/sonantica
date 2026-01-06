/**
 * Analytics Event Types
 * 
 * Defines all event types tracked by Sonántica analytics system.
 * Following the philosophy of "Technical Transparency" - users should
 * understand exactly what data is being collected.
 */

// ============================================================================
// Core Event Types
// ============================================================================

/**
 * Platform where the app is running
 */
export type Platform = 'web' | 'mobile' | 'desktop';

/**
 * Event categories for organization
 */
export type EventCategory = 
  | 'session'
  | 'playback'
  | 'library'
  | 'ui'
  | 'dsp'
  | 'search';

/**
 * Specific event types
 */
export type EventType =
  // Session Events
  | 'session.start'
  | 'session.end'
  | 'session.heartbeat'
  
  // Playback Events
  | 'playback.start'
  | 'playback.pause'
  | 'playback.resume'
  | 'playback.stop'
  | 'playback.skip'
  | 'playback.complete'
  | 'playback.seek'
  | 'playback.progress'
  
  // Library Events
  | 'library.scan'
  | 'library.track_added'
  | 'track.favorite'
  | 'track.unfavorite'
  | 'playlist.created'
  | 'playlist.modified'
  | 'playlist.deleted'
  
  // UI Events
  | 'ui.view_change'
  | 'ui.sidebar_toggle'
  | 'ui.theme_change'
  
  // DSP Events
  | 'dsp.eq_preset_changed'
  | 'dsp.eq_band_adjusted'
  | 'dsp.effect_toggled'
  | 'dsp.vocal_mode_changed'
  
  // Search Events
  | 'search.query'
  | 'search.result_clicked';

// ============================================================================
// Event Payload Structures
// ============================================================================

/**
 * Base analytics event structure
 */
export interface AnalyticsEvent {
  // Event Identity
  eventId: string;
  eventType: EventType;
  timestamp: number;
  
  // Session Context
  sessionId: string;
  userId?: string; // Optional, for multi-user setups
  
  // Platform Context
  platform: Platform;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  
  // Location Context (Privacy-conscious)
  locale: string; // e.g., "en-US"
  timezone: string;
  ipHash?: string; // Hashed IP for privacy
  
  // Event-specific Data
  data: EventData;
}

/**
 * Union type for all possible event data
 */
export type EventData =
  | SessionEventData
  | PlaybackEventData
  | LibraryEventData
  | UIEventData
  | DSPEventData
  | SearchEventData;

// ============================================================================
// Session Event Data
// ============================================================================

export interface SessionEventData {
  type: 'session';
  action: 'start' | 'end' | 'heartbeat';
  duration?: number; // For end/heartbeat events
  activeTime?: number; // Actual active time (not idle)
}

// ============================================================================
// Playback Event Data
// ============================================================================

export interface PlaybackEventData {
  type: 'playback';
  action: 'start' | 'pause' | 'resume' | 'stop' | 'skip' | 'complete' | 'seek' | 'progress';
  
  // Track Information
  trackId: string;
  albumId: string;
  artistId: string;
  
  // Playback Context
  position: number; // Current position in seconds
  duration: number; // Track duration
  volume: number; // 0-1
  
  // Quality Metrics
  codec: string;
  bitrate: number;
  sampleRate: number;
  
  // Context
  source: 'library' | 'playlist' | 'queue' | 'recommendation' | 'search';
  sourceId?: string;
  
  // DSP State
  eqEnabled: boolean;
  eqPreset?: string;
  dspEffects: string[];
  
  // Seek-specific
  seekFrom?: number;
  seekTo?: number;
  
  // Skip-specific
  skipReason?: 'user' | 'error' | 'next_track';
}

// ============================================================================
// Library Event Data
// ============================================================================

export interface LibraryEventData {
  type: 'library';
  action: 'scan' | 'track_added' | 'favorite' | 'unfavorite' | 'playlist_created' | 'playlist_modified' | 'playlist_deleted';
  
  // Scan-specific
  scanDuration?: number;
  tracksFound?: number;
  tracksAdded?: number;
  
  // Track-specific
  trackId?: string;
  
  // Playlist-specific
  playlistId?: string;
  playlistSize?: number;
}

// ============================================================================
// UI Event Data
// ============================================================================

export interface UIEventData {
  type: 'ui';
  action: 'view_change' | 'sidebar_toggle' | 'theme_change';
  
  // View change
  fromView?: string;
  toView?: string;
  
  // Sidebar
  sidebarName?: string;
  sidebarState?: 'open' | 'closed';
  
  // Theme
  themeName?: string;
}

// ============================================================================
// DSP Event Data
// ============================================================================

export interface DSPEventData {
  type: 'dsp';
  action: 'eq_preset_changed' | 'eq_band_adjusted' | 'effect_toggled' | 'vocal_mode_changed';
  
  // EQ Preset
  presetName?: string;
  
  // EQ Band
  bandFrequency?: number;
  bandGain?: number;
  
  // Effect
  effectName?: string;
  effectEnabled?: boolean;
  
  // Vocal Mode
  vocalMode?: 'normal' | 'karaoke' | 'musician';
}

// ============================================================================
// Search Event Data
// ============================================================================

export interface SearchEventData {
  type: 'search';
  action: 'query' | 'result_clicked';
  
  query: string;
  resultCount?: number;
  resultType?: 'track' | 'album' | 'artist' | 'playlist';
  resultId?: string;
  resultPosition?: number; // Position in search results
}

// ============================================================================
// Event Buffer
// ============================================================================

/**
 * Buffered events waiting to be sent
 */
export interface EventBuffer {
  events: AnalyticsEvent[];
  size: number;
  lastFlushed: number;
}

// ============================================================================
// Analytics Configuration
// ============================================================================

/**
 * Analytics system configuration
 */
export interface AnalyticsConfig {
  // Core Settings
  enabled: boolean;
  apiEndpoint: string;
  
  // Privacy Settings
  collectPlaybackData: boolean;
  collectUIInteractions: boolean;
  collectSearchData: boolean;
  collectPlatformInfo: boolean;
  shareAnonymousStats: boolean;
  
  // Performance Settings
  batchSize: number; // Number of events to batch before sending
  flushInterval: number; // Milliseconds between flushes
  maxBufferSize: number; // Maximum events to buffer
  
  // Data Retention
  dataRetentionDays: number;
  
  // Debug
  debug: boolean;
}

/**
 * Default analytics configuration
 */
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: true,
  apiEndpoint: '/api/v1/analytics',
  
  collectPlaybackData: true,
  collectUIInteractions: true,
  collectSearchData: true,
  collectPlatformInfo: true,
  shareAnonymousStats: false,
  
  batchSize: 100,
  flushInterval: 60000, // 60 seconds
  maxBufferSize: 500,
  
  dataRetentionDays: 90,
  
  debug: false,
};
