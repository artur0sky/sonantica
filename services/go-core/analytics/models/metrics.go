package models

import "time"

// DashboardMetrics represents the main dashboard data
type DashboardMetrics struct {
	StartDate         string           `json:"startDate"`
	EndDate           string           `json:"endDate"`
	Overview          OverviewStats    `json:"overview"`
	TopTracks         []TopTrack       `json:"topTracks"`
	ListeningHeatmap  []HeatmapData    `json:"listeningHeatmap"`
	PlaybackTimeline  []TimelineData   `json:"playbackTimeline"`
	GenreDistribution []GenreStats     `json:"genreDistribution"`
	PlatformStats     []PlatformStats  `json:"platformStats"`
	RecentSessions    []SessionSummary `json:"recentSessions"`
	ListeningStreak   StreakData       `json:"listeningStreak"`
}

// OverviewStats represents high-level statistics
type OverviewStats struct {
	TotalPlays              int     `json:"totalPlays"`
	TotalPlayTime           int     `json:"totalPlayTime"`
	AverageSessionDuration  int     `json:"averageSessionDuration"`
	CompletionRate          float64 `json:"completionRate"`
	UniqueTracks            int     `json:"uniqueTracks"`
	UniqueAlbums            int     `json:"uniqueAlbums"`
	UniqueArtists           int     `json:"uniqueArtists"`
	TotalSessions           int     `json:"totalSessions"`
	AverageTracksPerSession float64 `json:"averageTracksPerSession"`
	SkipRate                float64 `json:"skipRate"`
	PlaysChange             float64 `json:"playsChange"`
	PlayTimeChange          float64 `json:"playTimeChange"`
	SessionsChange          float64 `json:"sessionsChange"`
}

// TopTrack represents a top played track
type TopTrack struct {
	TrackID        string  `json:"trackId"`
	TrackTitle     string  `json:"trackTitle"`
	ArtistName     string  `json:"artistName"`
	AlbumTitle     string  `json:"albumTitle"`
	AlbumArt       *string `json:"albumArt,omitempty"`
	PlayCount      int     `json:"playCount"`
	PlayTime       int     `json:"playTime"`
	CompletionRate float64 `json:"completionRate"`
	LastPlayed     string  `json:"lastPlayed"`
	Rank           int     `json:"rank"`
	RankChange     int     `json:"rankChange"`
}

// HeatmapData represents a single heatmap data point
type HeatmapData struct {
	Date      string `json:"date"`
	Value     int    `json:"value"`
	DayOfWeek int    `json:"dayOfWeek"`
	Hour      *int   `json:"hour,omitempty"`
}

// TimelineData represents playback timeline data
type TimelineData struct {
	Timestamp              string  `json:"timestamp"`
	Date                   string  `json:"date"`
	PlayCount              int     `json:"playCount"`
	PlayTime               int     `json:"playTime"`
	UniqueTracks           int     `json:"uniqueTracks"`
	UniqueArtists          int     `json:"uniqueArtists"`
	AverageSessionDuration int     `json:"averageSessionDuration"`
	CompletionRate         float64 `json:"completionRate"`
}

// GenreStats represents genre distribution statistics
type GenreStats struct {
	Genre      string     `json:"genre"`
	PlayCount  int        `json:"playCount"`
	PlayTime   int        `json:"playTime"`
	TrackCount int        `json:"trackCount"`
	Percentage float64    `json:"percentage"`
	TopArtist  *TopArtist `json:"topArtist,omitempty"`
}

// TopArtist represents the top artist in a genre
type TopArtist struct {
	Name      string `json:"name"`
	PlayCount int    `json:"playCount"`
}

// PlatformStats represents platform usage statistics
type PlatformStats struct {
	Platform       string  `json:"platform"`
	Browser        *string `json:"browser,omitempty"`
	BrowserVersion *string `json:"browserVersion,omitempty"`
	OS             *string `json:"os,omitempty"`
	OSVersion      *string `json:"osVersion,omitempty"`
	SessionCount   int     `json:"sessionCount"`
	PlayCount      int     `json:"playCount"`
	PlayTime       int     `json:"playTime"`
	Percentage     float64 `json:"percentage"`
	LastUsed       string  `json:"lastUsed"`
}

// SessionSummary represents a session summary
type SessionSummary struct {
	SessionID     string    `json:"sessionId"`
	StartTime     string    `json:"startTime"`
	EndTime       *string   `json:"endTime,omitempty"`
	Duration      int       `json:"duration"`
	Platform      string    `json:"platform"`
	Browser       *string   `json:"browser,omitempty"`
	TracksPlayed  int       `json:"tracksPlayed"`
	UniqueArtists int       `json:"uniqueArtists"`
	TotalPlayTime int       `json:"totalPlayTime"`
	TopTrack      *TopTrack `json:"topTrack,omitempty"`
}

// StreakData represents listening streak information
type StreakData struct {
	CurrentStreak    int        `json:"currentStreak"`
	LongestStreak    int        `json:"longestStreak"`
	StreakStartDate  string     `json:"streakStartDate"`
	TotalDaysActive  int        `json:"totalDaysActive"`
	TotalWeeksActive int        `json:"totalWeeksActive"`
	NextMilestone    *Milestone `json:"nextMilestone,omitempty"`
}

// Milestone represents a streak milestone
type Milestone struct {
	Days      int `json:"days"`
	DaysUntil int `json:"daysUntil"`
}

// TrackSegmentAnalysis represents detailed segment analysis for a track
type TrackSegmentAnalysis struct {
	TrackID           string             `json:"trackId"`
	TrackTitle        string             `json:"trackTitle"`
	ArtistName        string             `json:"artistName"`
	Duration          int                `json:"duration"`
	Segments          []TrackSegmentData `json:"segments"`
	MostPlayedSegment MostPlayedSegment  `json:"mostPlayedSegment"`
	SkipPoints        []SkipPoint        `json:"skipPoints"`
}

// TrackSegmentData represents a single segment
type TrackSegmentData struct {
	TrackID       string  `json:"trackId"`
	SegmentStart  int     `json:"segmentStart"`
	SegmentEnd    int     `json:"segmentEnd"`
	PlayCount     int     `json:"playCount"`
	HeatIntensity float64 `json:"heatIntensity"`
}

// MostPlayedSegment represents the most played segment
type MostPlayedSegment struct {
	Start     int `json:"start"`
	End       int `json:"end"`
	PlayCount int `json:"playCount"`
}

// SkipPoint represents a position where users skip
type SkipPoint struct {
	Position  int `json:"position"`
	SkipCount int `json:"skipCount"`
}

// ListeningPattern represents user listening patterns
type ListeningPattern struct {
	PeakListeningHour    int      `json:"peakListeningHour"`
	PeakListeningDay     int      `json:"peakListeningDay"`
	AverageSessionLength int      `json:"averageSessionLength"`
	PreferredGenres      []string `json:"preferredGenres"`
	SkipBehavior         string   `json:"skipBehavior"`
	NewArtistsPerWeek    int      `json:"newArtistsPerWeek"`
	RepeatListeningRate  float64  `json:"repeatListeningRate"`
	PreferredCodecs      []string `json:"preferredCodecs"`
	AverageBitrate       int      `json:"averageBitrate"`
}

// QueryFilters represents filters for analytics queries
type QueryFilters struct {
	StartDate *time.Time `json:"startDate,omitempty"`
	EndDate   *time.Time `json:"endDate,omitempty"`
	Period    *string    `json:"period,omitempty"` // day, week, month, year, all
	Platform  *string    `json:"platform,omitempty"`
	Genre     *string    `json:"genre,omitempty"`
	ArtistID  *string    `json:"artistId,omitempty"`
	AlbumID   *string    `json:"albumId,omitempty"`
	GroupBy   *string    `json:"groupBy,omitempty"` // hour, day, week, month
	Limit     int        `json:"limit,omitempty"`
	Offset    int        `json:"offset,omitempty"`
}
