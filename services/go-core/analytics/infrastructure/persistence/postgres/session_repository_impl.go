package postgres

import (
	"context"
	"sonantica-core/analytics/domain/entities"
	"sonantica-core/analytics/domain/repositories"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SessionRepositoryImpl implements the SessionRepository interface for PostgreSQL
type SessionRepositoryImpl struct {
	db *pgxpool.Pool
}

// NewSessionRepositoryImpl creates a new PostgreSQL session repository
func NewSessionRepositoryImpl(db *pgxpool.Pool) repositories.SessionRepository {
	return &SessionRepositoryImpl{
		db: db,
	}
}

// Create stores a new session in the database
func (r *SessionRepositoryImpl) Create(ctx context.Context, session *entities.Session) error {
	query := `
		INSERT INTO analytics_sessions (
			id, session_id, user_id, platform, browser, browser_version,
			os, os_version, locale, timezone, ip_hash, started_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		ON CONFLICT (session_id) DO NOTHING
	`

	if session.ID == "" {
		session.ID = uuid.New().String()
	}
	if session.CreatedAt.IsZero() {
		session.CreatedAt = time.Now()
	}

	_, err := r.db.Exec(ctx, query,
		session.ID, session.SessionID, session.UserID, session.Platform,
		session.Browser, session.BrowserVersion, session.OS, session.OSVersion,
		session.Locale, session.Timezone, session.IPHash, session.StartedAt,
		session.CreatedAt,
	)

	return err
}

// GetByID retrieves a session by its unique ID
func (r *SessionRepositoryImpl) GetByID(ctx context.Context, sessionID string) (*entities.Session, error) {
	query := `
		SELECT id, session_id, user_id, platform, browser, browser_version,
		       os, os_version, locale, timezone, ip_hash, started_at, ended_at, last_heartbeat, created_at
		FROM analytics_sessions
		WHERE session_id = $1
	`

	var s entities.Session
	var platform string

	err := r.db.QueryRow(ctx, query, sessionID).Scan(
		&s.ID, &s.SessionID, &s.UserID, &platform, &s.Browser, &s.BrowserVersion,
		&s.OS, &s.OSVersion, &s.Locale, &s.Timezone, &s.IPHash, &s.StartedAt,
		&s.EndedAt, &s.LastHeartbeat, &s.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, entities.ErrSessionNotFound
		}
		return nil, err
	}

	s.Platform = entities.Platform(platform)
	return &s, nil
}

// GetByUserID retrieves all sessions for a specific user
func (r *SessionRepositoryImpl) GetByUserID(ctx context.Context, userID string, limit int) ([]*entities.Session, error) {
	query := `
		SELECT id, session_id, user_id, platform, browser, browser_version,
		       os, os_version, locale, timezone, ip_hash, started_at, ended_at, last_heartbeat, created_at
		FROM analytics_sessions
		WHERE user_id = $1
		ORDER BY started_at DESC
		LIMIT $2
	`

	rows, err := r.db.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*entities.Session
	for rows.Next() {
		var s entities.Session
		var platform string
		err := rows.Scan(
			&s.ID, &s.SessionID, &s.UserID, &platform, &s.Browser, &s.BrowserVersion,
			&s.OS, &s.OSVersion, &s.Locale, &s.Timezone, &s.IPHash, &s.StartedAt,
			&s.EndedAt, &s.LastHeartbeat, &s.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		s.Platform = entities.Platform(platform)
		sessions = append(sessions, &s)
	}

	return sessions, nil
}

// GetActive retrieves currently open sessions
func (r *SessionRepositoryImpl) GetActive(ctx context.Context) ([]*entities.Session, error) {
	query := `
		SELECT id, session_id, user_id, platform, browser, browser_version,
		       os, os_version, locale, timezone, ip_hash, started_at, ended_at, last_heartbeat, created_at
		FROM analytics_sessions
		WHERE ended_at IS NULL
		ORDER BY started_at DESC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*entities.Session
	for rows.Next() {
		var s entities.Session
		var platform string
		err := rows.Scan(
			&s.ID, &s.SessionID, &s.UserID, &platform, &s.Browser, &s.BrowserVersion,
			&s.OS, &s.OSVersion, &s.Locale, &s.Timezone, &s.IPHash, &s.StartedAt,
			&s.EndedAt, &s.LastHeartbeat, &s.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		s.Platform = entities.Platform(platform)
		sessions = append(sessions, &s)
	}

	return sessions, nil
}

// Update updates an existing session's data
func (r *SessionRepositoryImpl) Update(ctx context.Context, session *entities.Session) error {
	query := `
		UPDATE analytics_sessions
		SET user_id = $1, ended_at = $2, last_heartbeat = $3
		WHERE session_id = $4
	`

	_, err := r.db.Exec(ctx, query, session.UserID, session.EndedAt, session.LastHeartbeat, session.SessionID)
	return err
}

// UpdateHeartbeat refreshes the last activity timestamp for a session
func (r *SessionRepositoryImpl) UpdateHeartbeat(ctx context.Context, sessionID string) error {
	query := `
		UPDATE analytics_sessions
		SET last_heartbeat = $1
		WHERE session_id = $2
	`

	_, err := r.db.Exec(ctx, query, time.Now(), sessionID)
	return err
}

// End marks a session as completed
func (r *SessionRepositoryImpl) End(ctx context.Context, sessionID string, endTime time.Time) error {
	query := `
		UPDATE analytics_sessions
		SET ended_at = $1
		WHERE session_id = $2
	`

	_, err := r.db.Exec(ctx, query, endTime, sessionID)
	return err
}

// GetByTimeRange retrieves sessions within a specific time window
func (r *SessionRepositoryImpl) GetByTimeRange(ctx context.Context, startTime, endTime time.Time) ([]*entities.Session, error) {
	query := `
		SELECT id, session_id, user_id, platform, browser, browser_version,
		       os, os_version, locale, timezone, ip_hash, started_at, ended_at, last_heartbeat, created_at
		FROM analytics_sessions
		WHERE started_at >= $1 AND started_at <= $2
		ORDER BY started_at ASC
	`

	rows, err := r.db.Query(ctx, query, startTime, endTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*entities.Session
	for rows.Next() {
		var s entities.Session
		var platform string
		err := rows.Scan(
			&s.ID, &s.SessionID, &s.UserID, &platform, &s.Browser, &s.BrowserVersion,
			&s.OS, &s.OSVersion, &s.Locale, &s.Timezone, &s.IPHash, &s.StartedAt,
			&s.EndedAt, &s.LastHeartbeat, &s.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		s.Platform = entities.Platform(platform)
		sessions = append(sessions, &s)
	}

	return sessions, nil
}

// Count returns the total number of sessions recorded
func (r *SessionRepositoryImpl) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM analytics_sessions").Scan(&count)
	return count, err
}

// Delete removes a session record
func (r *SessionRepositoryImpl) Delete(ctx context.Context, sessionID string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM analytics_sessions WHERE session_id = $1", sessionID)
	return err
}
