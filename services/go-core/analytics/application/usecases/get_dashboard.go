package usecases

import (
	"context"
	"fmt"
	"sonantica-core/analytics/application/dto"
	"sonantica-core/analytics/application/mappers"
	"sonantica-core/analytics/domain/services"
)

// GetDashboardUseCase handles the logic for retrieving dashboard metrics
type GetDashboardUseCase struct {
	aggregationService *services.AggregationService
}

// NewGetDashboardUseCase creates a new instance of the GetDashboardUseCase
func NewGetDashboardUseCase(as *services.AggregationService) *GetDashboardUseCase {
	return &GetDashboardUseCase{
		aggregationService: as,
	}
}

// Execute retrieves all metrics for the dashboard
func (uc *GetDashboardUseCase) Execute(ctx context.Context, input dto.DashboardRequestDTO) (dto.DashboardMetricsDTO, error) {
	// 1. Validate Input
	if err := input.Validate(); err != nil {
		return dto.DashboardMetricsDTO{}, fmt.Errorf("invalid dashboard request: %w", err)
	}

	// 2. Map DTO to Domain Filters
	filters := mappers.MapDashboardRequestToFilters(input)

	// 3. Fetch Overview Metrics
	metrics, err := uc.aggregationService.CalculateMetrics(ctx, filters)
	if err != nil {
		return dto.DashboardMetricsDTO{}, fmt.Errorf("failed to calculate metrics: %w", err)
	}

	// 4. Map Domain Metrics to DTO Base
	response := mappers.MapMetricsToDTO(metrics)

	// 5. Fetch Top Data (Tracks, Artists, Albums)
	topTracks, err := uc.aggregationService.GetTopTracks(ctx, filters)
	if err == nil {
		response.TopTracks = mappers.MapTrackMetricsToDTOs(topTracks)
	}

	topArtists, err := uc.aggregationService.GetTopArtists(ctx, filters)
	if err == nil {
		response.TopArtists = mappers.MapArtistMetricsToDTOs(topArtists)
	}

	topAlbums, err := uc.aggregationService.GetTopAlbums(ctx, filters)
	if err == nil {
		response.TopAlbums = mappers.MapAlbumMetricsToDTOs(topAlbums)
	}

	// Note: Platform stats, timeline, etc. could be added here following the same pattern

	return response, nil
}
