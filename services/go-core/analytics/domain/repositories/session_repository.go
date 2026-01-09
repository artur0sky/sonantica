package repositories

import (
	"context"
	"sonantica-core/analytics/domain/entities"
	"time"
)

// SessionRepository defines the contract for session persistence
type SessionRepository interface {
	// Create creates a new session
	Create(ctx context.Context, session *entities.Session) error

	// GetByID retrieves a session by its ID
	GetByID(ctx context.Context, sessionID string) (*entities.Session, error)

	// GetByUserID retrieves all sessions for a user
	GetByUserID(ctx context.Context, userID string, limit int) ([]*entities.Session, error)

	// GetActive retrieves all active sessions
	GetActive(ctx context.Context) ([]*entities.Session, error)

	// Update updates an existing session
	Update(ctx context.Context, session *entities.Session) error

	// UpdateHeartbeat updates the last heartbeat timestamp
	UpdateHeartbeat(ctx context.Context, sessionID string) error

	// End marks a session as ended
	End(ctx context.Context, sessionID string, endTime time.Time) error

	// GetByTimeRange retrieves sessions within a time range
	GetByTimeRange(ctx context.Context, startTime, endTime time.Time) ([]*entities.Session, error)

	// Count returns the total number of sessions
	Count(ctx context.Context) (int64, error)

	// Delete removes a session by ID
	Delete(ctx context.Context, sessionID string) error
}
