package services

import (
	"context"
	"fmt"
	"sonantica-core/analytics/domain/entities"
	"sonantica-core/analytics/domain/repositories"
)

// AggregationService contains business logic for metrics aggregation
type AggregationService struct {
	metricsRepo repositories.MetricsRepository
	cacheRepo   repositories.CacheRepository
}

// NewAggregationService creates a new aggregation service
func NewAggregationService(
	metricsRepo repositories.MetricsRepository,
	cacheRepo repositories.CacheRepository,
) *AggregationService {
	return &AggregationService{
		metricsRepo: metricsRepo,
		cacheRepo:   cacheRepo,
	}
}

// AggregatePlaybackEvent aggregates playback event data
func (s *AggregationService) AggregatePlaybackEvent(ctx context.Context, event *entities.Event) error {
	if !event.IsPlaybackEvent() {
		return fmt.Errorf("event is not a playback event")
	}

	// Extract track information from event data
	trackID, ok := event.Data["trackId"].(string)
	if !ok || trackID == "" {
		return fmt.Errorf("missing trackId in event data")
	}

	// Update track metrics based on event type
	switch event.Type {
	case entities.EventPlaybackStart:
		return s.incrementPlayCount(ctx, trackID)
	case entities.EventPlaybackComplete:
		return s.incrementCompleteCount(ctx, trackID)
	case entities.EventPlaybackSkip:
		return s.incrementSkipCount(ctx, trackID)
	}

	return nil
}

// incrementPlayCount increments the play count for a track
func (s *AggregationService) incrementPlayCount(ctx context.Context, trackID string) error {
	// This would typically update the track_statistics table
	// For now, we'll use cache to track real-time counts
	key := fmt.Sprintf("track:plays:%s", trackID)
	_, err := s.cacheRepo.Increment(ctx, key)
	return err
}

// incrementCompleteCount increments the complete count for a track
func (s *AggregationService) incrementCompleteCount(ctx context.Context, trackID string) error {
	key := fmt.Sprintf("track:completes:%s", trackID)
	_, err := s.cacheRepo.Increment(ctx, key)
	return err
}

// incrementSkipCount increments the skip count for a track
func (s *AggregationService) incrementSkipCount(ctx context.Context, trackID string) error {
	key := fmt.Sprintf("track:skips:%s", trackID)
	_, err := s.cacheRepo.Increment(ctx, key)
	return err
}

// CalculateMetrics calculates aggregated metrics for a given filter
func (s *AggregationService) CalculateMetrics(ctx context.Context, filters *repositories.QueryFilters) (*entities.Metrics, error) {
	// Validate filters
	if filters.StartDate != nil && filters.EndDate != nil {
		if filters.StartDate.After(*filters.EndDate) {
			return nil, entities.ErrInvalidDateRange
		}
	}

	// Retrieve metrics from repository
	metrics, err := s.metricsRepo.GetOverviewMetrics(ctx, filters)
	if err != nil {
		return nil, fmt.Errorf("failed to get overview metrics: %w", err)
	}

	// Validate metrics
	if err := metrics.Validate(); err != nil {
		return nil, fmt.Errorf("metrics validation failed: %w", err)
	}

	return metrics, nil
}

// GetTopTracks retrieves top tracks with business logic applied
func (s *AggregationService) GetTopTracks(ctx context.Context, filters *repositories.QueryFilters) ([]*entities.TrackMetrics, error) {
	// Set default limit if not provided
	if filters.Limit == 0 {
		filters.Limit = 10
	}

	// Retrieve from repository
	tracks, err := s.metricsRepo.GetTopTracks(ctx, filters)
	if err != nil {
		return nil, fmt.Errorf("failed to get top tracks: %w", err)
	}

	// Calculate additional metrics
	for _, track := range tracks {
		track.AverageCompletion = track.CalculateCompletionRate()
	}

	return tracks, nil
}

// GetTopArtists retrieves top artists with business logic applied
func (s *AggregationService) GetTopArtists(ctx context.Context, filters *repositories.QueryFilters) ([]*entities.ArtistMetrics, error) {
	// Set default limit if not provided
	if filters.Limit == 0 {
		filters.Limit = 10
	}

	return s.metricsRepo.GetTopArtists(ctx, filters)
}

// GetTopAlbums retrieves top albums with business logic applied
func (s *AggregationService) GetTopAlbums(ctx context.Context, filters *repositories.QueryFilters) ([]*entities.AlbumMetrics, error) {
	// Set default limit if not provided
	if filters.Limit == 0 {
		filters.Limit = 10
	}

	return s.metricsRepo.GetTopAlbums(ctx, filters)
}

// GetRealtimeStats retrieves the last X minutes of live playback stats
func (s *AggregationService) GetRealtimeStats(ctx context.Context, minutes int) ([]entities.RealtimePoint, error) {
	if minutes <= 0 {
		minutes = 30 // Default to 30 minutes
	}

	// This logic will eventually call the cache repository to get windowed counters
	// For now, we define the domain structure
	return nil, nil // Implementation will be in the infrastructure layer
}
