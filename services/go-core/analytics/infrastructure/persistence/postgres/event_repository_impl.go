package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"sonantica-core/analytics/domain/entities"
	"sonantica-core/analytics/domain/repositories"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// EventRepositoryImpl implements the EventRepository interface for PostgreSQL
type EventRepositoryImpl struct {
	db *pgxpool.Pool
}

// NewEventRepositoryImpl creates a new PostgreSQL event repository
func NewEventRepositoryImpl(db *pgxpool.Pool) repositories.EventRepository {
	return &EventRepositoryImpl{
		db: db,
	}
}

// Store inserts a single event into the database
func (r *EventRepositoryImpl) Store(ctx context.Context, event *entities.Event) error {
	query := `
		INSERT INTO analytics_events (
			event_id, session_id, event_type, timestamp, data, created_at
		) VALUES ($1, $2, $3, $4, $5, $6)
	`

	dataJSON, err := json.Marshal(event.Data)
	if err != nil {
		return fmt.Errorf("failed to marshal event data: %w", err)
	}

	createdAt := time.Now()

	_, err = r.db.Exec(ctx, query,
		event.ID, event.SessionID, event.Type,
		event.Timestamp, dataJSON, createdAt,
	)

	return err
}

// StoreBatch inserts multiple events using high-performance CopyFrom
func (r *EventRepositoryImpl) StoreBatch(ctx context.Context, events []*entities.Event) error {
	rows := make([][]interface{}, len(events))
	for i, event := range events {
		dataJSON, err := json.Marshal(event.Data)
		if err != nil {
			return fmt.Errorf("failed to marshal event %d data: %w", i, err)
		}

		createdAt := time.Now()

		rows[i] = []interface{}{
			event.ID,
			event.SessionID,
			event.Type,
			event.Timestamp,
			dataJSON,
			createdAt,
		}
	}

	_, err := r.db.CopyFrom(
		ctx,
		pgx.Identifier{"analytics_events"},
		[]string{"event_id", "session_id", "event_type", "timestamp", "data", "created_at"},
		pgx.CopyFromRows(rows),
	)

	return err
}

// GetByID retrieves a single event by its ID
func (r *EventRepositoryImpl) GetByID(ctx context.Context, eventID string) (*entities.Event, error) {
	query := `
		SELECT event_id, session_id, event_type, timestamp, data
		FROM analytics_events
		WHERE event_id = $1
	`

	var event entities.Event
	var eventType string
	var dataJSON []byte

	err := r.db.QueryRow(ctx, query, eventID).Scan(
		&event.ID, &event.SessionID, &eventType, &event.Timestamp, &dataJSON,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, entities.ErrEventNotFound
		}
		return nil, err
	}

	event.Type = entities.EventType(eventType)
	if err := json.Unmarshal(dataJSON, &event.Data); err != nil {
		return nil, fmt.Errorf("failed to unmarshal event data: %w", err)
	}

	return &event, nil
}

// GetBySessionID retrieves all events associated with a session
func (r *EventRepositoryImpl) GetBySessionID(ctx context.Context, sessionID string) ([]*entities.Event, error) {
	query := `
		SELECT event_id, session_id, event_type, timestamp, data
		FROM analytics_events
		WHERE session_id = $1
		ORDER BY timestamp ASC
	`

	rows, err := r.db.Query(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*entities.Event
	for rows.Next() {
		var event entities.Event
		var eventType string
		var dataJSON []byte

		err := rows.Scan(&event.ID, &event.SessionID, &eventType, &event.Timestamp, &dataJSON)
		if err != nil {
			return nil, err
		}

		event.Type = entities.EventType(eventType)
		if err := json.Unmarshal(dataJSON, &event.Data); err != nil {
			return nil, err
		}
		events = append(events, &event)
	}

	return events, nil
}

// GetByTimeRange retrieves events within a specific time window
func (r *EventRepositoryImpl) GetByTimeRange(ctx context.Context, startTime, endTime time.Time) ([]*entities.Event, error) {
	query := `
		SELECT event_id, session_id, event_type, timestamp, data
		FROM analytics_events
		WHERE timestamp >= $1 AND timestamp <= $2
		ORDER BY timestamp ASC
	`

	rows, err := r.db.Query(ctx, query, startTime, endTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*entities.Event
	for rows.Next() {
		var event entities.Event
		var eventType string
		var dataJSON []byte

		err := rows.Scan(&event.ID, &event.SessionID, &eventType, &event.Timestamp, &dataJSON)
		if err != nil {
			return nil, err
		}

		event.Type = entities.EventType(eventType)
		json.Unmarshal(dataJSON, &event.Data)
		events = append(events, &event)
	}

	return events, nil
}

// GetByType retrieves events of a specific type
func (r *EventRepositoryImpl) GetByType(ctx context.Context, eventType entities.EventType, limit int) ([]*entities.Event, error) {
	query := `
		SELECT event_id, session_id, event_type, timestamp, data
		FROM analytics_events
		WHERE event_type = $1
		ORDER BY timestamp DESC
		LIMIT $2
	`

	rows, err := r.db.Query(ctx, query, string(eventType), limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*entities.Event
	for rows.Next() {
		var event entities.Event
		var dataJSON []byte

		err := rows.Scan(&event.ID, &event.SessionID, &event.Type, &event.Timestamp, &dataJSON)
		if err != nil {
			return nil, err
		}

		json.Unmarshal(dataJSON, &event.Data)
		events = append(events, &event)
	}

	return events, nil
}

// Count returns the total number of events in the system
func (r *EventRepositoryImpl) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM analytics_events").Scan(&count)
	return count, err
}

// CountByType returns the count of events of a specific type
func (r *EventRepositoryImpl) CountByType(ctx context.Context, eventType entities.EventType) (int64, error) {
	var count int64
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM analytics_events WHERE event_type = $1", string(eventType)).Scan(&count)
	return count, err
}

// Delete removes an event from the database
func (r *EventRepositoryImpl) Delete(ctx context.Context, eventID string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM analytics_events WHERE event_id = $1", eventID)
	return err
}
