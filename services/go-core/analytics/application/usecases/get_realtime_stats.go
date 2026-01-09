package usecases

import (
	"context"
	"sonantica-core/analytics/application/dto"
	"sonantica-core/analytics/domain/services"
)

// GetRealtimeStatsUseCase handles the retrieval of live metrics
type GetRealtimeStatsUseCase struct {
	aggregationService *services.AggregationService
}

// NewGetRealtimeStatsUseCase creates a new GetRealtimeStatsUseCase
func NewGetRealtimeStatsUseCase(as *services.AggregationService) *GetRealtimeStatsUseCase {
	return &GetRealtimeStatsUseCase{
		aggregationService: as,
	}
}

// Execute retrieves the latest realtime data points
func (uc *GetRealtimeStatsUseCase) Execute(ctx context.Context, minutes int) (dto.RealtimeStatsDTO, error) {
	points, err := uc.aggregationService.GetRealtimeStats(ctx, minutes)
	if err != nil {
		return dto.RealtimeStatsDTO{}, err
	}

	result := dto.RealtimeStatsDTO{
		Points: make([]dto.RealtimePointDTO, len(points)),
	}

	for i, p := range points {
		result.Points[i] = dto.RealtimePointDTO{
			Timestamp: p.Timestamp.Unix(),
			Plays:     p.Plays,
			Events:    p.Events,
		}
	}

	return result, nil
}
