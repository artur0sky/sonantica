/**
 * Analytics Metrics Types
 * 
 * Defines the structure of aggregated metrics and dashboard data.
 * These are the insights derived from raw events.
 */

// ============================================================================
// Dashboard Overview
// ============================================================================

/**
 * Main dashboard data structure
 */
export interface DashboardMetrics {
  // Time Range
  startDate: string;
  endDate: string;
  
  // Overview Stats
  overview: OverviewStats;
  
  // Charts Data
  topTracks: TopTrack[];
  listeningHeatmap: HeatmapData[];
  playbackTimeline: TimelineData[];
  genreDistribution: GenreStats[];
  platformStats: PlatformStats[];

  // Top Lists
  topArtists: TopArtist[];
  topAlbums: TopAlbum[];
  topPlaylists: TopPlaylist[];

  // Recent Activity
  recentSessions: SessionSummary[];
  recentlyPlayed: RecentlyPlayedTrack[];
  listeningStreak: StreakData;
}

/**
 * Artist specific metrics
 */
export interface ArtistMetrics {
  artistId?: string;
  artistName: string;
  overview: OverviewStats;
  topTracks: TopTrack[];
  playbackTimeline: TimelineData[];
  fanDemographics: PlatformStats[];
}

/**
 * Album specific metrics
 */
export interface AlbumMetrics {
  albumId?: string;
  albumTitle: string;
  artistName: string;
  overview: OverviewStats;
  trackPerformance: TopTrack[];
  playbackTimeline: TimelineData[];
}

// ============================================================================
// Overview Statistics
// ============================================================================

export interface OverviewStats {
  // Playback Metrics
  totalPlays: number;
  totalPlayTime: number; // seconds
  averageSessionDuration: number; // seconds
  completionRate: number; // percentage
  
  // Library Metrics
  uniqueTracks: number;
  uniqueAlbums: number;
  uniqueArtists: number;
  
  // Engagement Metrics
  totalSessions: number;
  averageTracksPerSession: number;
  skipRate: number; // percentage
  
  // Comparisons (vs previous period)
  playsChange: number; // percentage
  playTimeChange: number; // percentage
  sessionsChange: number; // percentage
  
  // Library Stats
  totalTracksInLibrary: number;
  totalAlbumsInLibrary: number;
  totalArtistsInLibrary: number;
  formats: FormatStat[];
  coverArtStats: CoverArtSummary;
}

export interface FormatStat {
  format: string;
  count: number;
  size?: string;
}

export interface CoverArtSummary {
  withCover: number;
  withoutCover: number;
  percentage: number;
}

// ============================================================================
// Top Tracks
// ============================================================================

export interface TopTrack {
  trackId: string;
  trackTitle: string;
  artistName: string;
  albumTitle: string;
  albumArt?: string;
  
  playCount: number;
  playTime: number; // total seconds
  completionRate: number; // percentage
  lastPlayed: string; // ISO timestamp
  
  rank: number;
  rankChange: number; // vs previous period
}

export interface TopArtist {
  artistId: string;
  artistName: string;
  playCount: number;
  playTime: number; // total seconds
  rank: number;
}

export interface TopAlbum {
  albumId: string;
  albumTitle: string;
  artistName: string;
  coverArt?: string;
  playCount: number;
  playTime: number; // total seconds
  rank: number;
}

export interface TopPlaylist {
  playlistId: string;
  playlistName: string;
  playCount: number;
  playTime: number; // total seconds
  rank: number;
}

export interface RecentlyPlayedTrack {
  trackId: string;
  trackTitle: string;
  artistName: string;
  albumTitle: string;
  albumArt?: string;
  playedAt: string; // ISO timestamp
  duration?: number; // seconds
}

// ============================================================================
// Listening Heatmap
// ============================================================================

export interface HeatmapData {
  date: string; // YYYY-MM-DD
  value: number; // play count or duration
  dayOfWeek: number; // 0-6
  hour?: number; // 0-23 for hourly heatmap
}

export interface HourlyHeatmap {
  hour: number; // 0-23
  dayOfWeek: number; // 0-6
  playCount: number;
  averageDuration: number;
}

// ============================================================================
// Playback Timeline
// ============================================================================

export interface TimelineData {
  timestamp: string; // ISO timestamp
  date: string; // YYYY-MM-DD
  
  // Metrics
  playCount: number;
  playTime: number; // seconds
  uniqueTracks: number;
  uniqueArtists: number;
  
  // Averages
  averageSessionDuration: number;
  completionRate: number;
}

// ============================================================================
// Genre Distribution
// ============================================================================

export interface GenreStats {
  genre: string;
  playCount: number;
  playTime: number; // seconds
  trackCount: number;
  percentage: number; // of total plays
  
  // Top artist in this genre
  topArtist?: {
    name: string;
    playCount: number;
  };
}

// ============================================================================
// Platform Statistics
// ============================================================================

export interface PlatformStats {
  platform: string; // 'web', 'mobile', 'desktop'
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  
  sessionCount: number;
  playCount: number;
  playTime: number; // seconds
  percentage: number; // of total sessions
  
  lastUsed: string; // ISO timestamp
}

// ============================================================================
// Session Summary
// ============================================================================

export interface SessionSummary {
  sessionId: string;
  startTime: string; // ISO timestamp
  endTime?: string; // ISO timestamp
  duration: number; // seconds
  
  platform: string;
  browser?: string;
  
  // Activity
  tracksPlayed: number;
  uniqueArtists: number;
  totalPlayTime: number; // seconds
  
  // Most played in session
  topTrack?: {
    trackId: string;
    title: string;
    artist: string;
    playCount: number;
  };
}

// ============================================================================
// Listening Streak
// ============================================================================

export interface StreakData {
  currentStreak: number; // days
  longestStreak: number; // days
  streakStartDate: string; // ISO timestamp
  
  // Milestones
  totalDaysActive: number;
  totalWeeksActive: number;
  
  // Predictions
  nextMilestone?: {
    days: number;
    daysUntil: number;
  };
}

// ============================================================================
// Track Segments (Most Listened Parts)
// ============================================================================

export interface TrackSegment {
  trackId: string;
  segmentStart: number; // seconds
  segmentEnd: number; // seconds
  playCount: number;
  heatIntensity: number; // 0-1, normalized
}

export interface TrackSegmentAnalysis {
  trackId: string;
  trackTitle: string;
  artistName: string;
  duration: number;
  
  segments: TrackSegment[];
  
  // Insights
  mostPlayedSegment: {
    start: number;
    end: number;
    playCount: number;
  };
  
  skipPoints: {
    position: number; // seconds
    skipCount: number;
  }[];
}

// ============================================================================
// Listening Patterns
// ============================================================================

export interface ListeningPattern {
  // Time-based patterns
  peakListeningHour: number; // 0-23
  peakListeningDay: number; // 0-6
  
  // Behavior patterns
  averageSessionLength: number; // seconds
  preferredGenres: string[];
  skipBehavior: 'patient' | 'moderate' | 'impatient';
  
  // Discovery patterns
  newArtistsPerWeek: number;
  repeatListeningRate: number; // percentage
  
  // Quality preferences
  preferredCodecs: string[];
  averageBitrate: number;
}

// ============================================================================
// Query Filters
// ============================================================================

export interface AnalyticsFilters {
  // Time Range
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year' | 'all';
  
  // Filters
  platform?: string;
  genre?: string;
  artistId?: string;
  albumId?: string;
  artistName?: string;
  albumTitle?: string;
  
  // Aggregation
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  
  // Pagination
  limit?: number;
  offset?: number;
}

// ============================================================================
// Export Data
// ============================================================================

export interface AnalyticsExport {
  exportDate: string;
  dateRange: {
    start: string;
    end: string;
  };
  
  // Data
  sessions: SessionSummary[];
  topTracks: TopTrack[];
  listeningPatterns: ListeningPattern;
  
  // Metadata
  totalEvents: number;
  exportFormat: 'json' | 'csv';
}
