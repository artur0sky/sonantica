package usecases

import (
	"context"
	"fmt"
	"sonantica-core/analytics/application/dto"
	"sonantica-core/analytics/application/mappers"
	"sonantica-core/analytics/domain/services"
	"time"
)

// IngestEventUseCase handles the logic for ingesting analytics events
type IngestEventUseCase struct {
	eventService       *services.EventService
	aggregationService *services.AggregationService
}

// NewIngestEventUseCase creates a new instance of the IngestEventUseCase
func NewIngestEventUseCase(
	es *services.EventService,
	as *services.AggregationService,
) *IngestEventUseCase {
	return &IngestEventUseCase{
		eventService:       es,
		aggregationService: as,
	}
}

// ExecuteIngestSingle handles the ingestion of a single event
func (uc *IngestEventUseCase) ExecuteIngestSingle(ctx context.Context, input dto.EventDTO) (dto.EventResponseDTO, error) {
	// 1. Validate DTO
	if err := input.Validate(); err != nil {
		return dto.EventResponseDTO{}, fmt.Errorf("invalid input: %w", err)
	}

	// 2. Map to Domain Entity
	event := mappers.MapEventDTOToEntity(input)

	// 3. Process via Domain Service
	if err := uc.eventService.ProcessEvent(ctx, event); err != nil {
		return dto.EventResponseDTO{}, fmt.Errorf("failed to process event: %w", err)
	}

	// 4. Trigger Aggregation (Async if needed, here we keep it simple)
	if event.IsPlaybackEvent() {
		go uc.aggregationService.AggregatePlaybackEvent(ctx, event)
	}

	return dto.EventResponseDTO{
		Success:   true,
		EventID:   event.ID,
		Message:   "Event ingested successfully",
		Timestamp: time.Now().Unix(),
	}, nil
}

// ExecuteIngestBatch handles the ingestion of multiple events
func (uc *IngestEventUseCase) ExecuteIngestBatch(ctx context.Context, input dto.EventBatchDTO) (dto.BatchResponseDTO, error) {
	// 1. Validate DTO
	if err := input.Validate(); err != nil {
		return dto.BatchResponseDTO{}, fmt.Errorf("invalid batch input: %w", err)
	}

	// 2. Map to Domain Entities
	events := mappers.MapEventBatchDTOToEntities(input)

	// 3. Process via Domain Service
	if err := uc.eventService.ProcessEventBatch(ctx, events); err != nil {
		return dto.BatchResponseDTO{}, fmt.Errorf("failed to process event batch: %w", err)
	}

	// 4. Aggregate events
	for _, event := range events {
		if event.IsPlaybackEvent() {
			go uc.aggregationService.AggregatePlaybackEvent(ctx, event)
		}
	}

	return dto.BatchResponseDTO{
		Success:        true,
		ProcessedCount: len(events),
		Message:        "Batch ingested successfully",
		Timestamp:      time.Now().Unix(),
	}, nil
}
