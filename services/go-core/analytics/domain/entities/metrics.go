package entities

import "time"

// Metrics represents aggregated analytics metrics (Domain Entity)
type Metrics struct {
	StartDate time.Time
	EndDate   time.Time

	// Overview Statistics
	TotalPlays              int
	TotalPlayTime           int
	AverageSessionDuration  int
	CompletionRate          float64
	UniqueTracks            int
	UniqueAlbums            int
	UniqueArtists           int
	TotalSessions           int
	AverageTracksPerSession float64
	SkipRate                float64

	// Change Metrics (compared to previous period)
	PlaysChange    float64
	PlayTimeChange float64
	SessionsChange float64
}

// TrackMetrics represents metrics for a specific track
type TrackMetrics struct {
	TrackID           string
	PlayCount         int
	CompleteCount     int
	SkipCount         int
	TotalPlayTime     int
	AverageCompletion float64
	LastPlayedAt      *time.Time
	UpdatedAt         time.Time
}

// CalculateCompletionRate calculates the completion rate
func (tm *TrackMetrics) CalculateCompletionRate() float64 {
	if tm.PlayCount == 0 {
		return 0
	}
	return float64(tm.CompleteCount) / float64(tm.PlayCount) * 100
}

// CalculateSkipRate calculates the skip rate
func (tm *TrackMetrics) CalculateSkipRate() float64 {
	if tm.PlayCount == 0 {
		return 0
	}
	return float64(tm.SkipCount) / float64(tm.PlayCount) * 100
}

// ArtistMetrics represents metrics for a specific artist
type ArtistMetrics struct {
	ArtistID      string
	ArtistName    string
	PlayCount     int
	TotalPlayTime int
	UniqueTracks  int
	LastPlayedAt  *time.Time
}

// AlbumMetrics represents metrics for a specific album
type AlbumMetrics struct {
	AlbumID       string
	AlbumTitle    string
	ArtistName    string
	PlayCount     int
	TotalPlayTime int
	UniqueTracks  int
	LastPlayedAt  *time.Time
}

// PlaylistMetrics represents metrics for a specific playlist
type PlaylistMetrics struct {
	PlaylistID    string
	PlaylistName  string
	PlayCount     int
	TotalPlayTime int
	UniqueTracks  int
	LastPlayedAt  *time.Time
}

// PlatformMetrics represents metrics for a specific platform
type PlatformMetrics struct {
	Platform       Platform
	Browser        *string
	BrowserVersion *string
	OS             *string
	OSVersion      *string
	SessionCount   int
	PlayCount      int
	PlayTime       int
	Percentage     float64
	LastUsed       time.Time
}

// ListeningPattern represents user listening patterns
type ListeningPattern struct {
	PeakListeningHour    int
	PeakListeningDay     int
	AverageSessionLength int
	PreferredGenres      []string
	SkipBehavior         string
	NewArtistsPerWeek    int
	RepeatListeningRate  float64
	PreferredCodecs      []string
	AverageBitrate       int
}

// RealtimePoint represents a single data point in live analytics
type RealtimePoint struct {
	Timestamp time.Time
	Plays     int
	Events    int
}

// Validate performs domain validation on metrics
func (m *Metrics) Validate() error {
	if m.StartDate.IsZero() || m.EndDate.IsZero() {
		return ErrInvalidDateRange
	}
	if m.StartDate.After(m.EndDate) {
		return ErrInvalidDateRange
	}
	return nil
}
