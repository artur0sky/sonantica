package models

import (
	"time"
)

// Platform represents the platform where the app is running
type Platform string

const (
	PlatformWeb     Platform = "web"
	PlatformMobile  Platform = "mobile"
	PlatformDesktop Platform = "desktop"
)

// EventType represents the type of analytics event
type EventType string

const (
	// Session Events
	EventSessionStart     EventType = "session.start"
	EventSessionEnd       EventType = "session.end"
	EventSessionHeartbeat EventType = "session.heartbeat"

	// Playback Events
	EventPlaybackStart    EventType = "playback.start"
	EventPlaybackPause    EventType = "playback.pause"
	EventPlaybackResume   EventType = "playback.resume"
	EventPlaybackStop     EventType = "playback.stop"
	EventPlaybackSkip     EventType = "playback.skip"
	EventPlaybackComplete EventType = "playback.complete"
	EventPlaybackSeek     EventType = "playback.seek"
	EventPlaybackProgress EventType = "playback.progress"

	// Library Events
	EventLibraryScan      EventType = "library.scan"
	EventLibraryTrackAdd  EventType = "library.track_added"
	EventTrackFavorite    EventType = "track.favorite"
	EventTrackUnfavorite  EventType = "track.unfavorite"
	EventPlaylistCreated  EventType = "playlist.created"
	EventPlaylistModified EventType = "playlist.modified"
	EventPlaylistDeleted  EventType = "playlist.deleted"

	// UI Events
	EventUIViewChange    EventType = "ui.view_change"
	EventUISidebarToggle EventType = "ui.sidebar_toggle"
	EventUIThemeChange   EventType = "ui.theme_change"

	// DSP Events
	EventDSPEQPresetChanged EventType = "dsp.eq_preset_changed"
	EventDSPEQBandAdjusted  EventType = "dsp.eq_band_adjusted"
	EventDSPEffectToggled   EventType = "dsp.effect_toggled"
	EventDSPVocalModeChange EventType = "dsp.vocal_mode_changed"

	// Search Events
	EventSearchQuery         EventType = "search.query"
	EventSearchResultClicked EventType = "search.result_clicked"
)

// AnalyticsEvent represents a single analytics event
type AnalyticsEvent struct {
	// Event Identity
	EventID   string    `json:"eventId" db:"event_id"`
	EventType EventType `json:"eventType" db:"event_type"`
	Timestamp int64     `json:"timestamp" db:"timestamp"`

	// Session Context
	SessionID string  `json:"sessionId" db:"session_id"`
	UserID    *string `json:"userId,omitempty" db:"user_id"`

	// Platform Context
	Platform       Platform `json:"platform" db:"platform"`
	Browser        string   `json:"browser" db:"browser"`
	BrowserVersion string   `json:"browserVersion" db:"browser_version"`
	OS             string   `json:"os" db:"os"`
	OSVersion      string   `json:"osVersion" db:"os_version"`

	// Location Context (Privacy-conscious)
	Locale   string  `json:"locale" db:"locale"`
	Timezone string  `json:"timezone" db:"timezone"`
	IPHash   *string `json:"ipHash,omitempty" db:"ip_hash"`

	// Event-specific Data (stored as JSONB)
	Data map[string]interface{} `json:"data" db:"data"`
}

// Session represents an analytics session
type Session struct {
	ID             string     `json:"id" db:"id"`
	SessionID      string     `json:"sessionId" db:"session_id"`
	UserID         *string    `json:"userId,omitempty" db:"user_id"`
	Platform       Platform   `json:"platform" db:"platform"`
	Browser        string     `json:"browser" db:"browser"`
	BrowserVersion string     `json:"browserVersion" db:"browser_version"`
	OS             string     `json:"os" db:"os"`
	OSVersion      string     `json:"osVersion" db:"os_version"`
	Locale         string     `json:"locale" db:"locale"`
	Timezone       string     `json:"timezone" db:"timezone"`
	IPHash         *string    `json:"ipHash,omitempty" db:"ip_hash"`
	StartedAt      time.Time  `json:"startedAt" db:"started_at"`
	EndedAt        *time.Time `json:"endedAt,omitempty" db:"ended_at"`
	LastHeartbeat  *time.Time `json:"lastHeartbeat,omitempty" db:"last_heartbeat"`
	CreatedAt      time.Time  `json:"createdAt" db:"created_at"`
}

// PlaybackSession represents an aggregated playback session
type PlaybackSession struct {
	ID                   int64      `json:"id" db:"id"`
	SessionID            string     `json:"sessionId" db:"session_id"`
	TrackID              string     `json:"trackId" db:"track_id"`
	AlbumID              *string    `json:"albumId,omitempty" db:"album_id"`
	ArtistID             *string    `json:"artistId,omitempty" db:"artist_id"`
	StartedAt            time.Time  `json:"startedAt" db:"started_at"`
	EndedAt              *time.Time `json:"endedAt,omitempty" db:"ended_at"`
	DurationPlayed       *int       `json:"durationPlayed,omitempty" db:"duration_played"`
	CompletionPercentage *float64   `json:"completionPercentage,omitempty" db:"completion_percentage"`
	Source               string     `json:"source" db:"source"`
	SourceID             *string    `json:"sourceId,omitempty" db:"source_id"`
	Codec                string     `json:"codec" db:"codec"`
	Bitrate              int        `json:"bitrate" db:"bitrate"`
	EQEnabled            bool       `json:"eqEnabled" db:"eq_enabled"`
	EQPreset             *string    `json:"eqPreset,omitempty" db:"eq_preset"`
	CreatedAt            time.Time  `json:"createdAt" db:"created_at"`
}

// TrackStatistics represents aggregated statistics for a track
type TrackStatistics struct {
	TrackID           string     `json:"trackId" db:"track_id"`
	PlayCount         int        `json:"playCount" db:"play_count"`
	CompleteCount     int        `json:"completeCount" db:"complete_count"`
	SkipCount         int        `json:"skipCount" db:"skip_count"`
	TotalPlayTime     int        `json:"totalPlayTime" db:"total_play_time"`
	AverageCompletion float64    `json:"averageCompletion" db:"average_completion"`
	LastPlayedAt      *time.Time `json:"lastPlayedAt,omitempty" db:"last_played_at"`
	UpdatedAt         time.Time  `json:"updatedAt" db:"updated_at"`
}

// ListeningHeatmap represents time-based listening patterns
type ListeningHeatmap struct {
	ID            int64     `json:"id" db:"id"`
	Date          time.Time `json:"date" db:"date"`
	Hour          int       `json:"hour" db:"hour"`
	PlayCount     int       `json:"playCount" db:"play_count"`
	UniqueTracks  int       `json:"uniqueTracks" db:"unique_tracks"`
	TotalDuration int       `json:"totalDuration" db:"total_duration"`
}

// TrackSegment represents listening patterns within a track
type TrackSegment struct {
	ID           int64     `json:"id" db:"id"`
	TrackID      string    `json:"trackId" db:"track_id"`
	SegmentStart int       `json:"segmentStart" db:"segment_start"`
	SegmentEnd   int       `json:"segmentEnd" db:"segment_end"`
	PlayCount    int       `json:"playCount" db:"play_count"`
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
}

// EventBatch represents a batch of events sent from the client
type EventBatch struct {
	Events []AnalyticsEvent `json:"events"`
}
