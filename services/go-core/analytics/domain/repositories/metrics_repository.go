package repositories

import (
	"context"
	"sonantica-core/analytics/domain/entities"
	"time"
)

// QueryFilters represents filters for analytics queries
type QueryFilters struct {
	StartDate  *time.Time
	EndDate    *time.Time
	Period     *string // day, week, month, year, all
	Platform   *string
	Genre      *string
	ArtistID   *string
	AlbumID    *string
	ArtistName *string
	AlbumTitle *string
	GroupBy    *string // hour, day, week, month
	Limit      int
	Offset     int
}

// MetricsRepository defines the contract for metrics aggregation and retrieval
type MetricsRepository interface {
	// GetOverviewMetrics retrieves high-level overview metrics
	GetOverviewMetrics(ctx context.Context, filters *QueryFilters) (*entities.Metrics, error)

	// GetTrackMetrics retrieves metrics for a specific track
	GetTrackMetrics(ctx context.Context, trackID string, filters *QueryFilters) (*entities.TrackMetrics, error)

	// GetTopTracks retrieves top played tracks
	GetTopTracks(ctx context.Context, filters *QueryFilters) ([]*entities.TrackMetrics, error)

	// GetArtistMetrics retrieves metrics for a specific artist
	GetArtistMetrics(ctx context.Context, artistID string, filters *QueryFilters) (*entities.ArtistMetrics, error)

	// GetTopArtists retrieves top played artists
	GetTopArtists(ctx context.Context, filters *QueryFilters) ([]*entities.ArtistMetrics, error)

	// GetAlbumMetrics retrieves metrics for a specific album
	GetAlbumMetrics(ctx context.Context, albumID string, filters *QueryFilters) (*entities.AlbumMetrics, error)

	// GetTopAlbums retrieves top played albums
	GetTopAlbums(ctx context.Context, filters *QueryFilters) ([]*entities.AlbumMetrics, error)

	// GetPlaylistMetrics retrieves metrics for a specific playlist
	GetPlaylistMetrics(ctx context.Context, playlistID string, filters *QueryFilters) (*entities.PlaylistMetrics, error)

	// GetTopPlaylists retrieves top played playlists
	GetTopPlaylists(ctx context.Context, filters *QueryFilters) ([]*entities.PlaylistMetrics, error)

	// GetPlatformMetrics retrieves platform usage statistics
	GetPlatformMetrics(ctx context.Context, filters *QueryFilters) ([]*entities.PlatformMetrics, error)

	// GetListeningPattern retrieves user listening patterns
	GetListeningPattern(ctx context.Context, userID *string, filters *QueryFilters) (*entities.ListeningPattern, error)

	// UpdateTrackMetrics updates metrics for a track
	UpdateTrackMetrics(ctx context.Context, trackID string, metrics *entities.TrackMetrics) error
}
