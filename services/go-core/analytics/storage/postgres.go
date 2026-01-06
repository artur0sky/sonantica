package storage

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"sonantica-core/analytics/models"
	"sonantica-core/database"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// AnalyticsStorage handles all analytics database operations
type AnalyticsStorage struct {
	db *pgxpool.Pool
}

// NewAnalyticsStorage creates a new analytics storage instance
func NewAnalyticsStorage() *AnalyticsStorage {
	return &AnalyticsStorage{
		db: database.DB,
	}
}

// CreateSession creates a new analytics session
func (s *AnalyticsStorage) CreateSession(ctx context.Context, session *models.Session) error {
	query := `
		INSERT INTO analytics_sessions (
			id, session_id, user_id, platform, browser, browser_version,
			os, os_version, locale, timezone, ip_hash, started_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		ON CONFLICT (session_id) DO NOTHING
	`

	session.ID = uuid.New().String()
	session.CreatedAt = time.Now()

	_, err := s.db.ExecContext(ctx, query,
		session.ID, session.SessionID, session.UserID, session.Platform,
		session.Browser, session.BrowserVersion, session.OS, session.OSVersion,
		session.Locale, session.Timezone, session.IPHash, session.StartedAt,
		session.CreatedAt,
	)

	return err
}

// UpdateSessionEnd updates the session end time
func (s *AnalyticsStorage) UpdateSessionEnd(ctx context.Context, sessionID string, endedAt time.Time) error {
	query := `
		UPDATE analytics_sessions
		SET ended_at = $1
		WHERE session_id = $2
	`

	_, err := s.db.ExecContext(ctx, query, endedAt, sessionID)
	return err
}

// UpdateSessionHeartbeat updates the last heartbeat time
func (s *AnalyticsStorage) UpdateSessionHeartbeat(ctx context.Context, sessionID string, heartbeat time.Time) error {
	query := `
		UPDATE analytics_sessions
		SET last_heartbeat = $1
		WHERE session_id = $2
	`

	_, err := s.db.ExecContext(ctx, query, heartbeat, sessionID)
	return err
}

// InsertEvent inserts a single analytics event
func (s *AnalyticsStorage) InsertEvent(ctx context.Context, event *models.AnalyticsEvent) error {
	query := `
		INSERT INTO analytics_events (
			event_id, session_id, event_type, timestamp, data, created_at
		) VALUES ($1, $2, $3, $4, $5, $6)
	`

	// Convert data to JSONB
	dataJSON, err := json.Marshal(event.Data)
	if err != nil {
		return fmt.Errorf("failed to marshal event data: %w", err)
	}

	timestamp := time.Unix(0, event.Timestamp*int64(time.Millisecond))
	createdAt := time.Now()

	_, err = s.db.ExecContext(ctx, query,
		event.EventID, event.SessionID, event.EventType,
		timestamp, dataJSON, createdAt,
	)

	return err
}

// InsertEventBatch inserts multiple events in a transaction
func (s *AnalyticsStorage) InsertEventBatch(ctx context.Context, events []models.AnalyticsEvent) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		INSERT INTO analytics_events (
			event_id, session_id, event_type, timestamp, data, created_at
		) VALUES ($1, $2, $3, $4, $5, $6)
	`

	stmt, err := tx.PrepareContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	for _, event := range events {
		dataJSON, err := json.Marshal(event.Data)
		if err != nil {
			return fmt.Errorf("failed to marshal event data: %w", err)
		}

		timestamp := time.Unix(0, event.Timestamp*int64(time.Millisecond))
		createdAt := time.Now()

		_, err = stmt.ExecContext(ctx,
			event.EventID, event.SessionID, event.EventType,
			timestamp, dataJSON, createdAt,
		)
		if err != nil {
			return fmt.Errorf("failed to insert event: %w", err)
		}
	}

	return tx.Commit()
}

// GetTopTracks retrieves the top played tracks
func (s *AnalyticsStorage) GetTopTracks(ctx context.Context, filters *models.QueryFilters) ([]models.TopTrack, error) {
	query := `
		SELECT 
			ts.track_id,
			t.title as track_title,
			ar.name as artist_name,
			al.title as album_title,
			al.cover_path as album_art,
			ts.play_count,
			ts.total_play_time as play_time,
			ts.average_completion as completion_rate,
			ts.last_played_at
		FROM track_statistics ts
		LEFT JOIN tracks t ON ts.track_id = t.id
		LEFT JOIN artists ar ON t.artist_id = ar.id
		LEFT JOIN albums al ON t.album_id = al.id
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 1

	if filters.StartDate != nil {
		query += fmt.Sprintf(" AND ts.last_played_at >= $%d", argCount)
		args = append(args, filters.StartDate)
		argCount++
	}

	if filters.EndDate != nil {
		query += fmt.Sprintf(" AND ts.last_played_at <= $%d", argCount)
		args = append(args, filters.EndDate)
		argCount++
	}

	query += " ORDER BY ts.play_count DESC"

	if filters.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argCount)
		args = append(args, filters.Limit)
		argCount++
	} else {
		query += " LIMIT 20"
	}

	if filters.Offset > 0 {
		query += fmt.Sprintf(" OFFSET $%d", argCount)
		args = append(args, filters.Offset)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query top tracks: %w", err)
	}
	defer rows.Close()

	var tracks []models.TopTrack
	rank := 1

	for rows.Next() {
		var track models.TopTrack
		var lastPlayed sql.NullTime

		err := rows.Scan(
			&track.TrackID, &track.TrackTitle, &track.ArtistName,
			&track.AlbumTitle, &track.AlbumArt, &track.PlayCount,
			&track.PlayTime, &track.CompletionRate, &lastPlayed,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan track: %w", err)
		}

		if lastPlayed.Valid {
			track.LastPlayed = lastPlayed.Time.Format(time.RFC3339)
		}

		track.Rank = rank
		track.RankChange = 0 // TODO: Calculate rank change

		tracks = append(tracks, track)
		rank++
	}

	return tracks, nil
}

// GetPlatformStats retrieves platform usage statistics
func (s *AnalyticsStorage) GetPlatformStats(ctx context.Context, filters *models.QueryFilters) ([]models.PlatformStats, error) {
	query := `
		SELECT 
			platform,
			browser,
			browser_version,
			os,
			os_version,
			COUNT(*) as session_count,
			MAX(started_at) as last_used
		FROM analytics_sessions
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 1

	if filters.StartDate != nil {
		query += fmt.Sprintf(" AND started_at >= $%d", argCount)
		args = append(args, filters.StartDate)
		argCount++
	}

	if filters.EndDate != nil {
		query += fmt.Sprintf(" AND started_at <= $%d", argCount)
		args = append(args, filters.EndDate)
		argCount++
	}

	query += " GROUP BY platform, browser, browser_version, os, os_version"
	query += " ORDER BY session_count DESC"

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query platform stats: %w", err)
	}
	defer rows.Close()

	var stats []models.PlatformStats
	totalSessions := 0

	// First pass: collect data and calculate total
	for rows.Next() {
		var stat models.PlatformStats
		var lastUsed time.Time

		err := rows.Scan(
			&stat.Platform, &stat.Browser, &stat.BrowserVersion,
			&stat.OS, &stat.OSVersion, &stat.SessionCount, &lastUsed,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan platform stat: %w", err)
		}

		stat.LastUsed = lastUsed.Format(time.RFC3339)
		stats = append(stats, stat)
		totalSessions += stat.SessionCount
	}

	// Second pass: calculate percentages
	for i := range stats {
		if totalSessions > 0 {
			stats[i].Percentage = float64(stats[i].SessionCount) / float64(totalSessions) * 100
		}
	}

	return stats, nil
}

// GetListeningHeatmap retrieves listening heatmap data
func (s *AnalyticsStorage) GetListeningHeatmap(ctx context.Context, filters *models.QueryFilters) ([]models.HeatmapData, error) {
	query := `
		SELECT 
			date,
			hour,
			play_count,
			EXTRACT(DOW FROM date) as day_of_week
		FROM listening_heatmap
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 1

	if filters.StartDate != nil {
		query += fmt.Sprintf(" AND date >= $%d", argCount)
		args = append(args, filters.StartDate)
		argCount++
	}

	if filters.EndDate != nil {
		query += fmt.Sprintf(" AND date <= $%d", argCount)
		args = append(args, filters.EndDate)
		argCount++
	}

	query += " ORDER BY date, hour"

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query heatmap: %w", err)
	}
	defer rows.Close()

	var heatmap []models.HeatmapData

	for rows.Next() {
		var data models.HeatmapData
		var date time.Time
		var hour int
		var playCount int
		var dayOfWeek int

		err := rows.Scan(&date, &hour, &playCount, &dayOfWeek)
		if err != nil {
			return nil, fmt.Errorf("failed to scan heatmap data: %w", err)
		}

		data.Date = date.Format("2006-01-02")
		data.Hour = &hour
		data.Value = playCount
		data.DayOfWeek = dayOfWeek

		heatmap = append(heatmap, data)
	}

	return heatmap, nil
}

// UpdateTrackStatistics updates or inserts track statistics
func (s *AnalyticsStorage) UpdateTrackStatistics(ctx context.Context, trackID string, playCount, completeCount, skipCount, totalPlayTime int, avgCompletion float64) error {
	query := `
		INSERT INTO track_statistics (
			track_id, play_count, complete_count, skip_count, 
			total_play_time, average_completion, last_played_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (track_id) DO UPDATE SET
			play_count = track_statistics.play_count + EXCLUDED.play_count,
			complete_count = track_statistics.complete_count + EXCLUDED.complete_count,
			skip_count = track_statistics.skip_count + EXCLUDED.skip_count,
			total_play_time = track_statistics.total_play_time + EXCLUDED.total_play_time,
			average_completion = EXCLUDED.average_completion,
			last_played_at = EXCLUDED.last_played_at,
			updated_at = EXCLUDED.updated_at
	`

	now := time.Now()

	_, err := s.db.ExecContext(ctx, query,
		trackID, playCount, completeCount, skipCount,
		totalPlayTime, avgCompletion, now, now,
	)

	return err
}
