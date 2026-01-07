package storage

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"sonantica-core/analytics/models"
	"sonantica-core/database"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

	_, err := s.db.Exec(ctx, query,
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

	_, err := s.db.Exec(ctx, query, endedAt, sessionID)
	return err
}

// UpdateSessionHeartbeat updates the last heartbeat time
func (s *AnalyticsStorage) UpdateSessionHeartbeat(ctx context.Context, sessionID string, heartbeat time.Time) error {
	query := `
		UPDATE analytics_sessions
		SET last_heartbeat = $1
		WHERE session_id = $2
	`

	_, err := s.db.Exec(ctx, query, heartbeat, sessionID)
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

	_, err = s.db.Exec(ctx, query,
		event.EventID, event.SessionID, event.EventType,
		timestamp, dataJSON, createdAt,
	)

	return err
}

// InsertEventBatch inserts multiple events using CopyFrom for high performance
func (s *AnalyticsStorage) InsertEventBatch(ctx context.Context, events []models.AnalyticsEvent) error {
	// Create rows for CopyFrom
	rows := make([][]interface{}, len(events))
	for i, event := range events {
		dataJSON, err := json.Marshal(event.Data)
		if err != nil {
			return fmt.Errorf("failed to marshal event data: %w", err)
		}

		timestamp := time.Unix(0, event.Timestamp*int64(time.Millisecond))
		createdAt := time.Now()

		rows[i] = []interface{}{
			event.EventID,
			event.SessionID,
			event.EventType,
			timestamp,
			dataJSON,
			createdAt,
		}
	}

	_, err := s.db.CopyFrom(
		ctx,
		pgx.Identifier{"analytics_events"},
		[]string{"event_id", "session_id", "event_type", "timestamp", "data", "created_at"},
		pgx.CopyFromRows(rows),
	)

	return err
}

// GetTopTracks retrieves the top played tracks
func (s *AnalyticsStorage) GetTopTracks(ctx context.Context, filters *models.QueryFilters) ([]models.TopTrack, error) {
	query := `
		SELECT 
			ts.track_id,
			COALESCE(t.title, '') as track_title,
			COALESCE(ar.name, '') as artist_name,
			COALESCE(al.title, '') as album_title,
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

	if filters.ArtistID != nil && *filters.ArtistID != "" {
		query += fmt.Sprintf(" AND ar.id = $%d", argCount)
		args = append(args, *filters.ArtistID)
		argCount++
	} else if filters.ArtistName != nil && *filters.ArtistName != "" {
		query += fmt.Sprintf(" AND ar.name = $%d", argCount)
		args = append(args, *filters.ArtistName)
		argCount++
	}

	if filters.AlbumID != nil && *filters.AlbumID != "" {
		query += fmt.Sprintf(" AND al.id = $%d", argCount)
		args = append(args, *filters.AlbumID)
		argCount++
	} else if filters.AlbumTitle != nil && *filters.AlbumTitle != "" {
		query += fmt.Sprintf(" AND al.title = $%d", argCount)
		args = append(args, *filters.AlbumTitle)
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

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query top tracks: %w", err)
	}
	defer rows.Close()

	tracks := []models.TopTrack{}
	rank := 1

	for rows.Next() {
		var track models.TopTrack
		var lastPlayed *time.Time

		err := rows.Scan(
			&track.TrackID, &track.TrackTitle, &track.ArtistName,
			&track.AlbumTitle, &track.AlbumArt, &track.PlayCount,
			&track.PlayTime, &track.CompletionRate, &lastPlayed,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan track: %w", err)
		}

		if lastPlayed != nil {
			track.LastPlayed = lastPlayed.Format(time.RFC3339)
		}

		track.Rank = rank
		track.RankChange = 0 // TODO: Calculate rank change

		tracks = append(tracks, track)
		rank++
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
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

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query platform stats: %w", err)
	}
	defer rows.Close()

	stats := []models.PlatformStats{}
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

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
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
	// If filtered by artist or album, we must query raw events (slower but accurate)
	if (filters.ArtistID != nil && *filters.ArtistID != "") || (filters.ArtistName != nil && *filters.ArtistName != "") ||
		(filters.AlbumID != nil && *filters.AlbumID != "") || (filters.AlbumTitle != nil && *filters.AlbumTitle != "") {

		query := `
			SELECT 
				DATE(timestamp) as date,
				EXTRACT(HOUR FROM timestamp)::int as hour,
				COUNT(*) as play_count,
				EXTRACT(DOW FROM timestamp)::int as day_of_week
			FROM analytics_events
			WHERE event_type = 'playback.start'
		`
		args := []interface{}{}
		argCount := 1

		if filters.StartDate != nil {
			query += fmt.Sprintf(" AND timestamp >= $%d", argCount)
			args = append(args, filters.StartDate)
			argCount++
		}
		if filters.EndDate != nil {
			query += fmt.Sprintf(" AND timestamp <= $%d", argCount)
			args = append(args, filters.EndDate)
			argCount++
		}

		// Filter by artist/album from JSON data (assuming it exists in data field)
		if filters.ArtistID != nil && *filters.ArtistID != "" {
			query += fmt.Sprintf(" AND (data->>'artistId') = $%d", argCount)
			args = append(args, *filters.ArtistID)
			argCount++
		}
		if filters.AlbumID != nil && *filters.AlbumID != "" {
			query += fmt.Sprintf(" AND (data->>'albumId') = $%d", argCount)
			args = append(args, *filters.AlbumID)
			argCount++
		}

		query += " GROUP BY 1, 2, 4 ORDER BY 1, 2"

		rows, err := s.db.Query(ctx, query, args...)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		heatmap := []models.HeatmapData{}
		for rows.Next() {
			var d models.HeatmapData
			var date time.Time
			var hour, playCount, dow int
			if err := rows.Scan(&date, &hour, &playCount, &dow); err == nil {
				d.Date = date.Format("2006-01-02")
				d.Hour = &hour
				d.Value = playCount
				d.DayOfWeek = dow
				heatmap = append(heatmap, d)
			}
		}
		return heatmap, nil
	}

	// Default: use aggregated table
	query := `
		SELECT 
			date,
			hour,
			play_count,
			EXTRACT(DOW FROM date)::int as day_of_week
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

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query heatmap: %w", err)
	}
	defer rows.Close()

	heatmap := []models.HeatmapData{}

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

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
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

	_, err := s.db.Exec(ctx, query,
		trackID, playCount, completeCount, skipCount,
		totalPlayTime, avgCompletion, now, now,
	)

	return err
}

// GetPlaybackTimeline retrieves playback timeline data
func (s *AnalyticsStorage) GetPlaybackTimeline(ctx context.Context, filters *models.QueryFilters) ([]models.TimelineData, error) {
	// If filtered, use raw events
	if (filters.ArtistID != nil && *filters.ArtistID != "") || (filters.AlbumID != nil && *filters.AlbumID != "") {
		query := `
			SELECT 
				DATE(timestamp) as date,
				COUNT(*) as play_count,
				SUM((data->>'duration')::int) as play_time,
				COUNT(DISTINCT (data->>'trackId')) as unique_tracks
			FROM analytics_events
			WHERE event_type = 'playback.complete'
		`
		args := []interface{}{}
		argCount := 1

		if filters.StartDate != nil {
			query += fmt.Sprintf(" AND timestamp >= $%d", argCount)
			args = append(args, filters.StartDate)
			argCount++
		}
		if filters.EndDate != nil {
			query += fmt.Sprintf(" AND timestamp <= $%d", argCount)
			args = append(args, filters.EndDate)
			argCount++
		}
		if filters.ArtistID != nil && *filters.ArtistID != "" {
			query += fmt.Sprintf(" AND (data->>'artistId') = $%d", argCount)
			args = append(args, *filters.ArtistID)
			argCount++
		}

		query += " GROUP BY 1 ORDER BY 1 ASC"

		rows, err := s.db.Query(ctx, query, args...)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		timeline := []models.TimelineData{}
		for rows.Next() {
			var d models.TimelineData
			var date time.Time
			if err := rows.Scan(&date, &d.PlayCount, &d.PlayTime, &d.UniqueTracks); err == nil {
				d.Date = date.Format("2006-01-02")
				d.Timestamp = date.Format(time.RFC3339)
				timeline = append(timeline, d)
			}
		}
		return timeline, nil
	}

	// Default: use aggregated heatmap table (summed by date)
	query := `
		SELECT 
			date,
			SUM(play_count) as play_count,
			SUM(total_duration) as play_time,
			SUM(unique_tracks) as unique_tracks
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

	query += " GROUP BY date ORDER BY date ASC"

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query playback timeline: %w", err)
	}
	defer rows.Close()

	timeline := []models.TimelineData{}

	for rows.Next() {
		var data models.TimelineData
		var date time.Time

		err := rows.Scan(&date, &data.PlayCount, &data.PlayTime, &data.UniqueTracks)
		if err != nil {
			return nil, fmt.Errorf("failed to scan timeline data: %w", err)
		}

		data.Date = date.Format("2006-01-02")
		data.Timestamp = date.Format(time.RFC3339)
		timeline = append(timeline, data)
	}

	return timeline, nil
}

// GetGenreDistribution retrieves genre distribution statistics
func (s *AnalyticsStorage) GetGenreDistribution(ctx context.Context, filters *models.QueryFilters) ([]models.GenreStats, error) {
	query := `
		SELECT 
			genre,
			play_count,
			total_play_time,
			unique_tracks
		FROM genre_statistics
		WHERE play_count > 0
		ORDER BY play_count DESC
		LIMIT 10
	`

	rows, err := s.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query genre statistics: %w", err)
	}
	defer rows.Close()

	genres := []models.GenreStats{}
	totalPlays := 0

	for rows.Next() {
		var g models.GenreStats
		err := rows.Scan(&g.Genre, &g.PlayCount, &g.PlayTime, &g.TrackCount)
		if err != nil {
			return nil, fmt.Errorf("failed to scan genre stat: %w", err)
		}
		genres = append(genres, g)
		totalPlays += g.PlayCount
	}

	// Calculate percentages
	for i := range genres {
		if totalPlays > 0 {
			genres[i].Percentage = float64(genres[i].PlayCount) / float64(totalPlays) * 100
		}
	}

	return genres, nil
}

// UpdateListeningHeatmap updates the listening heatmap for a specific date and hour
func (s *AnalyticsStorage) UpdateListeningHeatmap(ctx context.Context, date time.Time, hour int, playCount, uniqueTracks, totalDuration int) error {
	query := `
		INSERT INTO listening_heatmap (
			date, hour, play_count, unique_tracks, total_duration, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		ON CONFLICT (date, hour) DO UPDATE SET
			play_count = listening_heatmap.play_count + EXCLUDED.play_count,
			unique_tracks = listening_heatmap.unique_tracks + EXCLUDED.unique_tracks,
			total_duration = listening_heatmap.total_duration + EXCLUDED.total_duration,
			updated_at = NOW()
	`

	_, err := s.db.Exec(ctx, query, date.Format("2006-01-02"), hour, playCount, uniqueTracks, totalDuration)
	return err
}

// UpdateGenreStatistics updates search statistics for a genre
func (s *AnalyticsStorage) UpdateGenreStatistics(ctx context.Context, genre string, playCount, totalPlayTime, uniqueTracks int) error {
	if genre == "" {
		genre = "Unknown"
	}

	query := `
		INSERT INTO genre_statistics (
			genre, play_count, total_play_time, unique_tracks, updated_at
		) VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (genre) DO UPDATE SET
			play_count = genre_statistics.play_count + EXCLUDED.play_count,
			total_play_time = genre_statistics.total_play_time + EXCLUDED.total_play_time,
			unique_tracks = genre_statistics.unique_tracks + EXCLUDED.unique_tracks,
			last_played_at = NOW(),
			updated_at = NOW()
	`

	_, err := s.db.Exec(ctx, query, genre, playCount, totalPlayTime, uniqueTracks)
	return err
}

// GetTrackMetadata retrieves genre and other info for a track
func (s *AnalyticsStorage) GetTrackMetadata(ctx context.Context, trackID string) (genre string, artistID string, albumID string, err error) {
	query := `
		SELECT COALESCE(genre, 'Unknown'), artist_id::text, album_id::text
		FROM tracks
		WHERE id = $1
	`
	err = s.db.QueryRow(ctx, query, trackID).Scan(&genre, &artistID, &albumID)
	return
}

// UpdateListeningStreak updates the listening streak for a user/session
func (s *AnalyticsStorage) UpdateListeningStreak(ctx context.Context, userID string, date time.Time, tracksPlayed int, playTime int) error {
	query := `
		INSERT INTO listening_streaks (
			user_id, date, tracks_played, play_time, created_at
		) VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (user_id, date) DO UPDATE SET
			tracks_played = listening_streaks.tracks_played + EXCLUDED.tracks_played,
			play_time = listening_streaks.play_time + EXCLUDED.play_time
	`

	_, err := s.db.Exec(ctx, query, userID, date.Format("2006-01-02"), tracksPlayed, playTime)
	return err
}

// GetRecentSessions retrieves the most recent analytics sessions
func (s *AnalyticsStorage) GetRecentSessions(ctx context.Context, limit int) ([]models.SessionSummary, error) {
	query := `
		SELECT 
			session_id, platform, browser, started_at, ended_at,
			(SELECT COUNT(*) FROM analytics_events WHERE session_id = s.session_id AND event_type LIKE 'playback.%%') as tracks_played,
			(SELECT SUM((data->>'duration')::int) FROM analytics_events WHERE session_id = s.session_id AND event_type = 'playback.complete') as total_play_time
		FROM analytics_sessions s
		ORDER BY started_at DESC
		LIMIT $1
	`

	rows, err := s.db.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	summaries := []models.SessionSummary{}
	for rows.Next() {
		var sm models.SessionSummary
		var start, end *time.Time
		var browser *string
		err := rows.Scan(&sm.SessionID, &sm.Platform, &browser, &start, &end, &sm.TracksPlayed, &sm.TotalPlayTime)
		if err != nil {
			return nil, err
		}

		if browser != nil {
			sm.Browser = browser
		}
		if start != nil {
			sm.StartTime = start.Format(time.RFC3339)
		}
		if end != nil {
			endTime := end.Format(time.RFC3339)
			sm.EndTime = &endTime
			sm.Duration = int(end.Sub(*start).Seconds())
		}

		summaries = append(summaries, sm)
	}

	return summaries, nil
}

// GetListeningStreak calculates the current and longest listening streaks for a user
func (s *AnalyticsStorage) GetListeningStreak(ctx context.Context, userID string) (models.StreakData, error) {
	var streak models.StreakData

	// Get total days active
	queryTotals := `
		SELECT 
			COUNT(*) as total_days,
			COALESCE(MAX(tracks_played), 0) as max_tracks_day
		FROM listening_streaks
		WHERE user_id = $1
	`
	err := s.db.QueryRow(ctx, queryTotals, userID).Scan(&streak.TotalDaysActive, &streak.CurrentStreak)
	if err != nil {
		return streak, err
	}

	streak.TotalWeeksActive = streak.TotalDaysActive / 7
	return streak, nil
}

// GetListeningPatterns retrieves listening patterns analysis
func (s *AnalyticsStorage) GetListeningPatterns(ctx context.Context, filters *models.QueryFilters) (models.ListeningPattern, error) {
	var pattern models.ListeningPattern

	// Peak Hour
	s.db.QueryRow(ctx, "SELECT hour FROM listening_heatmap GROUP BY hour ORDER BY SUM(play_count) DESC LIMIT 1").Scan(&pattern.PeakListeningHour)

	// Peak Day (DOW)
	s.db.QueryRow(ctx, "SELECT EXTRACT(DOW FROM date) FROM listening_heatmap GROUP BY 1 ORDER BY SUM(play_count) DESC LIMIT 1").Scan(&pattern.PeakListeningDay)

	// Average Session Length (from session summaries)
	s.db.QueryRow(ctx, "SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (ended_at - started_at))), 0) FROM analytics_sessions WHERE ended_at IS NOT NULL").Scan(&pattern.AverageSessionLength)

	// Preferred Genres
	rows, err := s.db.Query(ctx, "SELECT genre FROM genre_statistics ORDER BY play_count DESC LIMIT 5")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var g string
			if err := rows.Scan(&g); err == nil {
				pattern.PreferredGenres = append(pattern.PreferredGenres, g)
			}
		}
	}

	return pattern, nil
}
