package dto

// DashboardRequestDTO represents a request for dashboard metrics
type DashboardRequestDTO struct {
	StartDate *string `json:"startDate,omitempty"`
	EndDate   *string `json:"endDate,omitempty"`
	Period    *string `json:"period,omitempty"` // day, week, month, year, all
	Platform  *string `json:"platform,omitempty"`
	Genre     *string `json:"genre,omitempty"`
	ArtistID  *string `json:"artistId,omitempty"`
	AlbumID   *string `json:"albumId,omitempty"`
	GroupBy   *string `json:"groupBy,omitempty"` // hour, day, week, month
	Limit     int     `json:"limit,omitempty"`
	Offset    int     `json:"offset,omitempty"`
}

// DashboardMetricsDTO represents the main dashboard data
type DashboardMetricsDTO struct {
	StartDate         string                   `json:"startDate"`
	EndDate           string                   `json:"endDate"`
	Overview          OverviewStatsDTO         `json:"overview"`
	TopTracks         []TopTrackDTO            `json:"topTracks"`
	TopArtists        []TopArtistDTO           `json:"topArtists"`
	TopAlbums         []TopAlbumDTO            `json:"topAlbums"`
	TopPlaylists      []TopPlaylistDTO         `json:"topPlaylists"`
	ListeningHeatmap  []HeatmapDataDTO         `json:"listeningHeatmap"`
	PlaybackTimeline  []TimelineDataDTO        `json:"playbackTimeline"`
	GenreDistribution []GenreStatsDTO          `json:"genreDistribution"`
	PlatformStats     []PlatformStatsDTO       `json:"platformStats"`
	RecentSessions    []SessionSummaryDTO      `json:"recentSessions"`
	RecentlyPlayed    []RecentlyPlayedTrackDTO `json:"recentlyPlayed"`
	ListeningStreak   StreakDataDTO            `json:"listeningStreak"`
}

// OverviewStatsDTO represents high-level statistics
type OverviewStatsDTO struct {
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

// TopTrackDTO represents a top played track
type TopTrackDTO struct {
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

// TopArtistDTO represents a top played artist
type TopArtistDTO struct {
	ArtistID   string `json:"artistId"`
	ArtistName string `json:"artistName"`
	PlayCount  int    `json:"playCount"`
	PlayTime   int    `json:"playTime"`
	Rank       int    `json:"rank"`
}

// TopAlbumDTO represents a top played album
type TopAlbumDTO struct {
	AlbumID    string `json:"albumId"`
	AlbumTitle string `json:"albumTitle"`
	ArtistName string `json:"artistName"`
	CoverArt   string `json:"coverArt,omitempty"`
	PlayCount  int    `json:"playCount"`
	PlayTime   int    `json:"playTime"`
	Rank       int    `json:"rank"`
}

// TopPlaylistDTO represents a top played playlist
type TopPlaylistDTO struct {
	PlaylistID   string `json:"playlistId"`
	PlaylistName string `json:"playlistName"`
	PlayCount    int    `json:"playCount"`
	PlayTime     int    `json:"playTime"`
	Rank         int    `json:"rank"`
}

// RecentlyPlayedTrackDTO represents a recently played track
type RecentlyPlayedTrackDTO struct {
	TrackID    string `json:"trackId"`
	TrackTitle string `json:"trackTitle"`
	ArtistName string `json:"artistName"`
	AlbumTitle string `json:"albumTitle"`
	AlbumArt   string `json:"albumArt"`
	PlayedAt   string `json:"playedAt"`
	Duration   int    `json:"duration"`
}

// HeatmapDataDTO represents a single heatmap data point
type HeatmapDataDTO struct {
	Date      string `json:"date"`
	Value     int    `json:"value"`
	DayOfWeek int    `json:"dayOfWeek"`
	Hour      *int   `json:"hour,omitempty"`
}

// TimelineDataDTO represents playback timeline data
type TimelineDataDTO struct {
	Timestamp              string  `json:"timestamp"`
	Date                   string  `json:"date"`
	PlayCount              int     `json:"playCount"`
	PlayTime               int     `json:"playTime"`
	UniqueTracks           int     `json:"uniqueTracks"`
	UniqueArtists          int     `json:"uniqueArtists"`
	AverageSessionDuration int     `json:"averageSessionDuration"`
	CompletionRate         float64 `json:"completionRate"`
}

// GenreStatsDTO represents genre distribution statistics
type GenreStatsDTO struct {
	Genre      string        `json:"genre"`
	PlayCount  int           `json:"playCount"`
	PlayTime   int           `json:"playTime"`
	TrackCount int           `json:"trackCount"`
	Percentage float64       `json:"percentage"`
	TopArtist  *TopArtistDTO `json:"topArtist,omitempty"`
}

// PlatformStatsDTO represents platform usage statistics
type PlatformStatsDTO struct {
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

// SessionSummaryDTO represents a session summary
type SessionSummaryDTO struct {
	SessionID     string       `json:"sessionId"`
	StartTime     string       `json:"startTime"`
	EndTime       *string      `json:"endTime,omitempty"`
	Duration      int          `json:"duration"`
	Platform      string       `json:"platform"`
	Browser       *string      `json:"browser,omitempty"`
	TracksPlayed  int          `json:"tracksPlayed"`
	UniqueArtists int          `json:"uniqueArtists"`
	TotalPlayTime int          `json:"totalPlayTime"`
	TopTrack      *TopTrackDTO `json:"topTrack,omitempty"`
}

// StreakDataDTO represents listening streak information
type StreakDataDTO struct {
	CurrentStreak    int           `json:"currentStreak"`
	LongestStreak    int           `json:"longestStreak"`
	StreakStartDate  string        `json:"streakStartDate"`
	TotalDaysActive  int           `json:"totalDaysActive"`
	TotalWeeksActive int           `json:"totalWeeksActive"`
	NextMilestone    *MilestoneDTO `json:"nextMilestone,omitempty"`
}

// MilestoneDTO represents a streak milestone
type MilestoneDTO struct {
	Days      int `json:"days"`
	DaysUntil int `json:"daysUntil"`
}

// RealtimePointDTO represents a single point in live analytics
type RealtimePointDTO struct {
	Timestamp int64 `json:"timestamp"`
	Plays     int   `json:"plays"`
	Events    int   `json:"events"`
}

// RealtimeStatsDTO represents a collection of live stats
type RealtimeStatsDTO struct {
	Points []RealtimePointDTO `json:"points"`
}

// Validate validates the dashboard request DTO
func (d *DashboardRequestDTO) Validate() error {
	if d.Limit < 0 {
		return ErrInvalidLimit
	}
	if d.Limit > 100 {
		d.Limit = 100 // Cap at 100
	}
	if d.Period != nil {
		validPeriods := map[string]bool{
			"day": true, "week": true, "month": true, "year": true, "all": true,
		}
		if !validPeriods[*d.Period] {
			return ErrInvalidPeriod
		}
	}
	return nil
}
