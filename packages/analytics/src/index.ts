/**
 * @sonantica/analytics
 * 
 * Analytics and telemetry package for Sonántica.
 * Embodies the "Technical Transparency" philosophy - clear, understandable,
 * and respectful of user privacy.
 * 
 * @packageDocumentation
 */

// Core Engine
export { AnalyticsEngine, getAnalyticsEngine, resetAnalyticsEngine } from './core/AnalyticsEngine';

// Store
export { 
  useAnalyticsStore,
  useAnalyticsEnabled,
  useSessionId,
  useAnalyticsStats,
  useAnalyticsConfig,
} from './store/analyticsStore';

// Hooks
export { useAnalytics } from './hooks/useAnalytics';
export { usePlaybackTracking } from './hooks/usePlaybackTracking';

// Types
export type {
  // Events
  AnalyticsEvent,
  EventType,
  EventCategory,
  EventData,
  Platform,
  SessionEventData,
  PlaybackEventData,
  LibraryEventData,
  UIEventData,
  DSPEventData,
  SearchEventData,
  EventBuffer,
  AnalyticsConfig,
  
  // Metrics
  DashboardMetrics,
  OverviewStats,
  TopTrack,
  HeatmapData,
  HourlyHeatmap,
  TimelineData,
  GenreStats,
  PlatformStats,
  SessionSummary,
  StreakData,
  TrackSegment,
  TrackSegmentAnalysis,
  ListeningPattern,
  AnalyticsFilters,
  AnalyticsExport,
} from './types';

export { DEFAULT_ANALYTICS_CONFIG } from './types/events';
