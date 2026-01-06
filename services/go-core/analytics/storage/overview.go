package storage

import (
	"context"
	"fmt"

	"sonantica-core/analytics/models"
)

// GetOverviewStats retrieves overview statistics
func (s *AnalyticsStorage) GetOverviewStats(ctx context.Context, filters *models.QueryFilters) (models.OverviewStats, error) {
	stats := models.OverviewStats{}

	// 1. Total Plays
	// We can sum play_count from track_statistics, BUT filtering by time requires joining with events
	// or using the heatmap if it's granular enough.
	// For better accuracy with time filters, let's count from analytics_events where event_type = playback.complete

	// Base WHERE clause
	// whereClause := " WHERE event_type = 'playback.complete'"

	// if filters.StartDate != nil {
	// 	whereClause += fmt.Sprintf(" AND timestamp >= %d", filters.StartDate.UnixMilli())
	// }
	// if filters.EndDate != nil {
	// 	whereClause += fmt.Sprintf(" AND timestamp <= %d", filters.EndDate.UnixMilli())
	// }
	// Note: We're querying the raw events table here which might be slow for large datasets.
	// In a production system, we'd want an aggregated table for this.
	// However, since track_statistics is lifetime stats, it doesn't support time window filtering easy.

	// To support Artist/Album filtering, we need to inspect the JSON data, which is slow.
	// A better approach for now is to use the pre-aggregated `listening_heatmap` for count/time
	// if NO artist/album filter is applied.

	if filters.ArtistName == nil && filters.AlbumTitle == nil {
		// Use heatmap for faster queries
		heatmapQuery := "SELECT COALESCE(SUM(play_count), 0), COALESCE(SUM(total_duration), 0) FROM listening_heatmap WHERE 1=1"

		heatmapArgs := []interface{}{}
		heatmapArgCount := 1

		if filters.StartDate != nil {
			heatmapQuery += fmt.Sprintf(" AND date >= $%d", heatmapArgCount)
			heatmapArgs = append(heatmapArgs, filters.StartDate)
			heatmapArgCount++
		}
		if filters.EndDate != nil {
			heatmapQuery += fmt.Sprintf(" AND date <= $%d", heatmapArgCount)
			heatmapArgs = append(heatmapArgs, filters.EndDate)
			heatmapArgCount++
		}

		err := s.db.QueryRow(ctx, heatmapQuery, heatmapArgs...).Scan(&stats.TotalPlays, &stats.TotalPlayTime)
		if err != nil {
			return stats, fmt.Errorf("failed to get overview from heatmap: %w", err)
		}
	} else {
		// Optimization: For now, just count from track stats if filters are simple
		// But track_statistics doesn't have time series.
		// Let's stick to returning 0 or simplified counts if filters are present,
		// waiting for a proper aggregated table design.

		// Fallback: Query matching tracks
		// access directly via track_statistics joined with tracks

		query := `
			SELECT 
				COALESCE(SUM(ts.play_count), 0),
				COALESCE(SUM(ts.total_play_time), 0)
			FROM track_statistics ts
			JOIN tracks t ON ts.track_id = t.id
			LEFT JOIN artists ar ON t.artist_id = ar.id
			LEFT JOIN albums al ON t.album_id = al.id
			WHERE 1=1
		`
		qArgs := []interface{}{}
		qArgCount := 1

		if filters.ArtistName != nil {
			query += fmt.Sprintf(" AND ar.name = $%d", qArgCount)
			qArgs = append(qArgs, *filters.ArtistName)
			qArgCount++
		}
		if filters.AlbumTitle != nil {
			query += fmt.Sprintf(" AND al.title = $%d", qArgCount)
			qArgs = append(qArgs, *filters.AlbumTitle)
			qArgCount++
		}

		// Note: we ignore time filters here because track_statistics is global.
		// This is a known limitation until we have time-bucketed stats per track.

		err := s.db.QueryRow(ctx, query, qArgs...).Scan(&stats.TotalPlays, &stats.TotalPlayTime)
		if err != nil {
			return stats, fmt.Errorf("failed to get scoped overview: %w", err)
		}
	}

	// 2. Total Sessions (only relevant for dashboard, not artist/album)
	if filters.ArtistName == nil && filters.AlbumTitle == nil {
		sessionQuery := "SELECT COUNT(*) FROM analytics_sessions WHERE 1=1"
		sessionArgs := []interface{}{}
		sessionArgCount := 1

		if filters.StartDate != nil {
			sessionQuery += fmt.Sprintf(" AND started_at >= $%d", sessionArgCount)
			sessionArgs = append(sessionArgs, filters.StartDate)
			sessionArgCount++
		}
		if filters.EndDate != nil {
			sessionQuery += fmt.Sprintf(" AND started_at <= $%d", sessionArgCount)
			sessionArgs = append(sessionArgs, filters.EndDate)
			sessionArgCount++
		}

		// Ignoring platform/browser filters for now for simplicity, but could be added

		var sessionCount int
		err := s.db.QueryRow(ctx, sessionQuery, sessionArgs...).Scan(&sessionCount)
		// We treat session count as "unique listeners" roughly for now, or just sessions
		// The OverviewStats model usually has uniqueListeners
		if err == nil {
			// stats.UniqueListeners = sessionCount // If the model has this field
		}
	}

	return stats, nil
}
