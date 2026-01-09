package entities

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

// Event represents a single analytics event (Domain Entity)
// This is the core domain model, independent of infrastructure concerns
type Event struct {
	// Event Identity
	ID        string
	Type      EventType
	Timestamp time.Time

	// Session Context
	SessionID string
	UserID    *string

	// Platform Context
	Platform       Platform
	Browser        string
	BrowserVersion string
	OS             string
	OSVersion      string
	DeviceModel    string

	// Location Context (Privacy-conscious)
	Locale    string
	Timezone  string
	IPHash    *string
	IPAddress *string

	// Event-specific Data
	Data map[string]interface{}
}

// IsSessionEvent returns true if the event is a session-related event
func (e *Event) IsSessionEvent() bool {
	return e.Type == EventSessionStart ||
		e.Type == EventSessionEnd ||
		e.Type == EventSessionHeartbeat
}

// IsPlaybackEvent returns true if the event is a playback-related event
func (e *Event) IsPlaybackEvent() bool {
	return e.Type == EventPlaybackStart ||
		e.Type == EventPlaybackPause ||
		e.Type == EventPlaybackResume ||
		e.Type == EventPlaybackStop ||
		e.Type == EventPlaybackSkip ||
		e.Type == EventPlaybackComplete ||
		e.Type == EventPlaybackSeek ||
		e.Type == EventPlaybackProgress
}

// IsLibraryEvent returns true if the event is a library-related event
func (e *Event) IsLibraryEvent() bool {
	return e.Type == EventLibraryScan ||
		e.Type == EventLibraryTrackAdd ||
		e.Type == EventTrackFavorite ||
		e.Type == EventTrackUnfavorite ||
		e.Type == EventPlaylistCreated ||
		e.Type == EventPlaylistModified ||
		e.Type == EventPlaylistDeleted
}

// Validate performs domain validation on the event
func (e *Event) Validate() error {
	if e.ID == "" {
		return ErrInvalidEventID
	}
	if e.Type == "" {
		return ErrInvalidEventType
	}
	if e.SessionID == "" {
		return ErrInvalidSessionID
	}
	if e.Timestamp.IsZero() {
		return ErrInvalidTimestamp
	}
	return nil
}
