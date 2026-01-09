package repositories

import (
	"context"
	"sonantica-core/analytics/domain/entities"
	"time"
)

// EventRepository defines the contract for event persistence
// This is a port in Clean Architecture - infrastructure will provide the adapter
type EventRepository interface {
	// Store stores a single event
	Store(ctx context.Context, event *entities.Event) error

	// StoreBatch stores multiple events in a single transaction
	StoreBatch(ctx context.Context, events []*entities.Event) error

	// GetByID retrieves an event by its ID
	GetByID(ctx context.Context, eventID string) (*entities.Event, error)

	// GetBySessionID retrieves all events for a session
	GetBySessionID(ctx context.Context, sessionID string) ([]*entities.Event, error)

	// GetByTimeRange retrieves events within a time range
	GetByTimeRange(ctx context.Context, startTime, endTime time.Time) ([]*entities.Event, error)

	// GetByType retrieves events of a specific type
	GetByType(ctx context.Context, eventType entities.EventType, limit int) ([]*entities.Event, error)

	// Count returns the total number of events
	Count(ctx context.Context) (int64, error)

	// CountByType returns the count of events by type
	CountByType(ctx context.Context, eventType entities.EventType) (int64, error)

	// Delete removes an event by ID
	Delete(ctx context.Context, eventID string) error
}
