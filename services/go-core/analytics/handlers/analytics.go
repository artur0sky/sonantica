package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	"crypto/sha256"
	"fmt"
	"sonantica-core/analytics"
	"sonantica-core/analytics/models"
	"sonantica-core/analytics/storage"
	"sonantica-core/cache"

	"github.com/go-chi/chi/v5"
)

// AnalyticsHandler handles analytics HTTP requests
type AnalyticsHandler struct {
	storage *storage.AnalyticsStorage
}

// NewAnalyticsHandler creates a new analytics handler
func NewAnalyticsHandler() *AnalyticsHandler {
	return &AnalyticsHandler{
		storage: storage.NewAnalyticsStorage(),
	}
}

// IngestEvent handles single event ingestion
func (h *AnalyticsHandler) IngestEvent(w http.ResponseWriter, r *http.Request) {
	var event models.AnalyticsEvent

	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Capture IP Address
	ip := getIP(r)
	event.IPAddress = &ip

	// Create or update session if it's a session event
	if err := h.handleSessionEvent(&event); err != nil {
		log.Printf("Error handling session event: %v", err)
	}

	// Insert raw event to Postgres (Historical log)
	if err := h.storage.InsertEvent(r.Context(), &event); err != nil {
		log.Printf("Error inserting event: %v", err)
	}

	// OFFLOAD TO CELERY: Aggregate stats & Update real-time cache
	go func() {
		if err := cache.EnqueueCeleryTask(context.Background(), "sonantica.process_analytics", event); err != nil {
			log.Printf("Failed to enqueue analytics task: %v", err)
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"eventId": event.EventID,
	})
}

// IngestEventBatch handles batch event ingestion
func (h *AnalyticsHandler) IngestEventBatch(w http.ResponseWriter, r *http.Request) {
	var batch models.EventBatch

	if err := json.NewDecoder(r.Body).Decode(&batch); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(batch.Events) == 0 {
		http.Error(w, "Empty event batch", http.StatusBadRequest)
	}

	// Capture IP Address for all events in batch
	ip := getIP(r)
	for i := range batch.Events {
		batch.Events[i].IPAddress = &ip
	}

	// Handle session events
	for i := range batch.Events {
		if err := h.handleSessionEvent(&batch.Events[i]); err != nil {
			log.Printf("Error handling session event: %v", err)
		}
	}

	// Insert events in batch to Postgres
	if err := h.storage.InsertEventBatch(r.Context(), batch.Events); err != nil {
		log.Printf("Error inserting event batch: %v", err)
	}

	// OFFLOAD TO CELERY: Aggregate stats & Update real-time cache
	// OFFLOAD TO CELERY: Aggregate stats & Update real-time cache (Batched)
	go func() {
		if err := cache.EnqueueCeleryTask(context.Background(), "sonantica.process_analytics_batch", batch.Events); err != nil {
			log.Printf("Failed to enqueue analytics batch task: %v", err)
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":          "ok",
		"eventsProcessed": len(batch.Events),
	})
}

// GetDashboard returns dashboard metrics
func (h *AnalyticsHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	filters := h.parseFilters(r)
	ctx := r.Context()

	// 1. Try Cache
	cacheKey := fmt.Sprintf("dashboard:%s", hashFilters(filters))
	var dashboard models.DashboardMetrics
	if err := cache.Get(ctx, cacheKey, &dashboard); err == nil {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "HIT") // Debug header
		json.NewEncoder(w).Encode(dashboard)
		return
	}

	// 2. Compute (Cache Miss)
	// Get top tracks
	topTracks, err := h.storage.GetTopTracks(ctx, filters)
	if err != nil {
		log.Printf("Error getting top tracks: %v", err)
		topTracks = []models.TopTrack{}
	}

	// Get platform stats
	platformStats, err := h.storage.GetPlatformStats(ctx, filters)
	if err != nil {
		log.Printf("Error getting platform stats: %v", err)
		platformStats = []models.PlatformStats{}
	}

	// Get listening heatmap
	heatmap, err := h.storage.GetListeningHeatmap(ctx, filters)
	if err != nil {
		log.Printf("Error getting heatmap: %v", err)
		heatmap = []models.HeatmapData{}
	}

	// Get playback timeline
	timeline, err := h.storage.GetPlaybackTimeline(ctx, filters)
	if err != nil {
		log.Printf("Error getting timeline: %v", err)
		timeline = []models.TimelineData{}
	}

	// Get genre distribution
	genres, err := h.storage.GetGenreDistribution(ctx, filters)
	if err != nil {
		log.Printf("Error getting genres: %v", err)
		genres = []models.GenreStats{}
	}

	// Get overview stats
	overview, err := h.storage.GetOverviewStats(ctx, filters)
	if err != nil {
		log.Printf("Error getting overview: %v", err)
		overview = models.OverviewStats{}
	}

	// Get recent sessions
	recentSessions, err := h.storage.GetRecentSessions(ctx, 10)
	if err != nil {
		log.Printf("Error getting recent sessions: %v", err)
		recentSessions = []models.SessionSummary{}
	}

	// Get Top Artists
	topArtists, err := h.storage.GetTopArtists(ctx, filters)
	if err != nil {
		log.Printf("Error getting top artists: %v", err)
		topArtists = []models.TopArtist{}
	}

	// Get Top Albums
	topAlbums, err := h.storage.GetTopAlbums(ctx, filters)
	if err != nil {
		log.Printf("Error getting top albums: %v", err)
		topAlbums = []models.TopAlbum{}
	}

	// Get Top Playlists
	topPlaylists, err := h.storage.GetTopPlaylists(ctx, filters)
	if err != nil {
		log.Printf("Error getting top playlists: %v", err)
		topPlaylists = []models.TopPlaylist{}
	}

	// Get Recently Played
	recentlyPlayed, err := h.storage.GetRecentlyPlayed(ctx, 10)
	if err != nil {
		log.Printf("Error getting recently played: %v", err)
		recentlyPlayed = []models.RecentlyPlayedTrack{}
	}

	// Get streaks (using a default identity for global dashboard, or could be extracted from session)
	streak, _ := h.storage.GetListeningStreak(ctx, "anonymous")

	// Build dashboard response
	dashboard = models.DashboardMetrics{
		StartDate:         filters.StartDate.Format("2006-01-02"),
		EndDate:           filters.EndDate.Format("2006-01-02"),
		TopTracks:         topTracks,
		TopArtists:        topArtists,
		TopAlbums:         topAlbums,
		TopPlaylists:      topPlaylists,
		PlatformStats:     platformStats,
		ListeningHeatmap:  heatmap,
		Overview:          overview,
		PlaybackTimeline:  timeline,
		GenreDistribution: genres,
		RecentSessions:    recentSessions,
		RecentlyPlayed:    recentlyPlayed,
		ListeningStreak:   streak,
	}

	// 3. Save to Cache (Async)
	go func() {
		// TTL: 5 minutes. Dashboard is "near real-time" but doesn't need to be instant.
		if err := cache.Set(context.Background(), cacheKey, dashboard, 5*time.Minute); err != nil {
			log.Printf("Failed to cache dashboard: %v", err)
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	json.NewEncoder(w).Encode(dashboard)
}

// GetRealtimeStats returns live stats from Redis
func (h *AnalyticsHandler) GetRealtimeStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	now := time.Now().Unix()
	// Get last 15 minutes of data
	buckets := []int64{}
	for i := 0; i < 15; i++ {
		buckets = append(buckets, ((now-int64(i*60))/60)*60)
	}

	type RealtimePoint struct {
		Timestamp int64 `json:"timestamp"`
		Plays     int   `json:"plays"`
		Events    int   `json:"events"`
	}

	results := []RealtimePoint{}

	// Collect from Redis
	red := cache.GetClient()
	for _, b := range buckets {
		plays, _ := red.Get(ctx, fmt.Sprintf("stats:realtime:plays:%d", b)).Int()
		events, _ := red.Get(ctx, fmt.Sprintf("stats:realtime:events:%d", b)).Int()

		results = append(results, RealtimePoint{
			Timestamp: b * 1000, // Frontend expects ms
			Plays:     plays,
			Events:    events,
		})
	}

	// Trending Tracks (Last 10 minutes)
	currentBucket := (now / 60) * 60
	trending, _ := red.ZRevRangeWithScores(ctx, fmt.Sprintf("stats:trending:tracks:%d", currentBucket), 0, 4).Result()

	trendingTracks := []map[string]interface{}{}
	for _, z := range trending {
		trackID := z.Member.(string)
		title, artist, err := h.storage.GetTrackDetails(ctx, trackID)
		if err != nil {
			title = "Unknown Track"
			artist = "Unknown Artist"
		}

		trendingTracks = append(trendingTracks, map[string]interface{}{
			"trackId":    trackID,
			"trackTitle": title,
			"artistName": artist,
			"score":      z.Score,
		})
	}

	// Active Users (Count in zset)
	activeCount, _ := red.ZCard(ctx, "stats:realtime:active_sessions").Result()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"timeline": results,
		"trending": trendingTracks,
		"active":   activeCount,
	})
}

// GetTopTracks returns top played tracks
func (h *AnalyticsHandler) GetTopTracks(w http.ResponseWriter, r *http.Request) {
	filters := h.parseFilters(r)
	ctx := r.Context()

	// 1. Try Cache
	cacheKey := fmt.Sprintf("tracks:top:%s", hashFilters(filters))
	var tracks []models.TopTrack
	if err := cache.Get(ctx, cacheKey, &tracks); err == nil {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "HIT")
		json.NewEncoder(w).Encode(tracks)
		return
	}

	// 2. Fetch
	tracks, err := h.storage.GetTopTracks(ctx, filters)
	if err != nil {
		log.Printf("Error getting top tracks: %v", err)
		http.Error(w, "Failed to get top tracks", http.StatusInternalServerError)
		return
	}

	// 3. Cache
	go func() {
		cache.Set(context.Background(), cacheKey, tracks, 5*time.Minute)
	}()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	json.NewEncoder(w).Encode(tracks)
}

// GetPlatformStats returns platform statistics
func (h *AnalyticsHandler) GetPlatformStats(w http.ResponseWriter, r *http.Request) {
	filters := h.parseFilters(r)
	ctx := r.Context()

	// 1. Try Cache
	cacheKey := fmt.Sprintf("platform:stats:%s", hashFilters(filters))
	var stats []models.PlatformStats
	if err := cache.Get(ctx, cacheKey, &stats); err == nil {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "HIT")
		json.NewEncoder(w).Encode(stats)
		return
	}

	// 2. Fetch
	stats, err := h.storage.GetPlatformStats(ctx, filters)
	if err != nil {
		log.Printf("Error getting platform stats: %v", err)
		http.Error(w, "Failed to get platform stats", http.StatusInternalServerError)
		return
	}

	// 3. Cache
	go func() {
		cache.Set(context.Background(), cacheKey, stats, 10*time.Minute)
	}()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	json.NewEncoder(w).Encode(stats)
}

// GetListeningPatterns returns listening patterns
func (h *AnalyticsHandler) GetListeningPatterns(w http.ResponseWriter, r *http.Request) {
	filters := h.parseFilters(r)
	ctx := r.Context()

	// 1. Try Cache
	cacheKey := fmt.Sprintf("listening:patterns:%s", hashFilters(filters))
	var patterns models.ListeningPattern
	if err := cache.Get(ctx, cacheKey, &patterns); err == nil {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "HIT")
		json.NewEncoder(w).Encode(patterns)
		return
	}

	// 2. Fetch
	patterns, err := h.storage.GetListeningPatterns(ctx, filters)
	if err != nil {
		log.Printf("Error getting listening patterns: %v", err)
		http.Error(w, "Failed to get patterns", http.StatusInternalServerError)
		return
	}

	// 3. Cache
	go func() {
		cache.Set(context.Background(), cacheKey, patterns, 30*time.Minute)
	}()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	json.NewEncoder(w).Encode(patterns)
}

// GetArtistAnalytics returns analytics for a specific artist
func (h *AnalyticsHandler) GetArtistAnalytics(w http.ResponseWriter, r *http.Request) {
	artistName := chi.URLParam(r, "name")
	if artistName == "" {
		artistName = r.URL.Query().Get("name")
	}

	filters := h.parseFilters(r)
	filters.ArtistName = &artistName

	ctx := r.Context()

	// Cache Check
	cacheKey := fmt.Sprintf("artist:%s:%s", artistName, hashFilters(filters))
	var metrics models.ArtistMetrics
	if err := cache.Get(ctx, cacheKey, &metrics); err == nil {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "HIT")
		json.NewEncoder(w).Encode(metrics)
		return
	}

	// For now, let's reuse storage methods filtering by artist name
	topTracks, _ := h.storage.GetTopTracks(ctx, filters)
	timeline, _ := h.storage.GetPlaybackTimeline(ctx, filters)
	overview, _ := h.storage.GetOverviewStats(ctx, filters)

	metrics = models.ArtistMetrics{
		ArtistName:       artistName,
		TopTracks:        topTracks,
		PlaybackTimeline: timeline,
		Overview:         overview,
	}

	// Cache Set
	go func() {
		cache.Set(context.Background(), cacheKey, metrics, 10*time.Minute)
	}()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	json.NewEncoder(w).Encode(metrics)
}

// GetAlbumAnalytics returns analytics for a specific album
func (h *AnalyticsHandler) GetAlbumAnalytics(w http.ResponseWriter, r *http.Request) {
	albumTitle := chi.URLParam(r, "title")
	artistName := r.URL.Query().Get("artist")

	filters := h.parseFilters(r)
	filters.AlbumTitle = &albumTitle
	filters.ArtistName = &artistName

	ctx := r.Context()

	topTracks, _ := h.storage.GetTopTracks(ctx, filters)
	timeline, _ := h.storage.GetPlaybackTimeline(ctx, filters)
	overview, _ := h.storage.GetOverviewStats(ctx, filters)

	metrics := models.AlbumMetrics{
		AlbumTitle:       albumTitle,
		ArtistName:       artistName,
		TrackPerformance: topTracks,
		PlaybackTimeline: timeline,
		Overview:         overview,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

// GetMigrationStatus returns the status of database migrations
func (h *AnalyticsHandler) GetMigrationStatus(w http.ResponseWriter, r *http.Request) {
	status, err := analytics.GetMigrationStatus()
	if err != nil {
		log.Printf("Error getting migration status: %v", err)
		http.Error(w, "Failed to get migration status", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"migrations": status,
		"timestamp":  time.Now().Format(time.RFC3339),
	})
}

// Helper functions

func (h *AnalyticsHandler) handleSessionEvent(event *models.AnalyticsEvent) error {
	ctx := context.Background()

	switch event.EventType {
	case models.EventSessionStart:
		session := &models.Session{
			SessionID:      event.SessionID,
			UserID:         event.UserID,
			Platform:       event.Platform,
			Browser:        event.Browser,
			BrowserVersion: event.BrowserVersion,
			OS:             event.OS,
			OSVersion:      event.OSVersion,
			DeviceModel:    event.DeviceModel,
			Locale:         event.Locale,
			Timezone:       event.Timezone,
			IPHash:         event.IPHash,
			IPAddress:      event.IPAddress,
			StartedAt:      time.Unix(0, event.Timestamp*int64(time.Millisecond)),
		}
		return h.storage.CreateSession(ctx, session)

	case models.EventSessionEnd:
		endTime := time.Unix(0, event.Timestamp*int64(time.Millisecond))
		return h.storage.UpdateSessionEnd(ctx, event.SessionID, endTime)

	case models.EventSessionHeartbeat:
		heartbeat := time.Unix(0, event.Timestamp*int64(time.Millisecond))
		return h.storage.UpdateSessionHeartbeat(ctx, event.SessionID, heartbeat)
	}

	return nil
}

func (h *AnalyticsHandler) processEventForAggregation(event *models.AnalyticsEvent) {
	ctx := context.Background()

	// 1. Process Playback Events
	if strings.HasPrefix(string(event.EventType), "playback.") {
		// Extract trackId from Data map
		trackID, ok := event.Data["trackId"].(string)
		if !ok || trackID == "" {
			return
		}

		// Get additional track metadata (genre, etc.)
		genre, _, _, _ := h.storage.GetTrackMetadata(ctx, trackID)

		timestamp := time.Unix(0, event.Timestamp*int64(time.Millisecond))
		hour := timestamp.Hour()

		// User identity for streaks (fallback to session if no user)
		identity := "anonymous"
		if event.UserID != nil && *event.UserID != "" {
			identity = *event.UserID
		} else if event.SessionID != "" {
			identity = event.SessionID
		}

		switch event.EventType {
		case models.EventPlaybackStart:
			// Increment play count in track stats
			h.storage.UpdateTrackStatistics(ctx, trackID, 1, 0, 0, 0, 0)
			// Update heatmap
			h.storage.UpdateListeningHeatmap(ctx, timestamp, hour, 1, 1, 0)
			// Update genre stats
			h.storage.UpdateGenreStatistics(ctx, genre, 1, 0, 1)
			// Update streak (track count)
			h.storage.UpdateListeningStreak(ctx, identity, timestamp, 1, 0)

		case models.EventPlaybackComplete:
			duration := 0
			if d, ok := event.Data["duration"].(float64); ok {
				duration = int(d)
			}
			// Update track stats (complete count and play time)
			h.storage.UpdateTrackStatistics(ctx, trackID, 0, 1, 0, duration, 100.0)
			// Update heatmap (play time)
			h.storage.UpdateListeningHeatmap(ctx, timestamp, hour, 0, 0, duration)
			// Update genre stats (play time)
			h.storage.UpdateGenreStatistics(ctx, genre, 0, duration, 0)
			// Update streak (play time)
			h.storage.UpdateListeningStreak(ctx, identity, timestamp, 0, duration)

		case models.EventPlaybackSkip:
			position := 0.0
			duration := 0.0
			if p, ok := event.Data["position"].(float64); ok {
				position = p
			}
			if d, ok := event.Data["duration"].(float64); ok {
				duration = d
			}
			completionPct := 0.0
			if duration > 0 {
				completionPct = (position / duration) * 100.0
			}
			// Update track stats (skip count and play time)
			h.storage.UpdateTrackStatistics(ctx, trackID, 0, 0, 1, int(position), completionPct)
			// Update heatmap (play time)
			h.storage.UpdateListeningHeatmap(ctx, timestamp, hour, 0, 0, int(position))
			// Update genre stats (play time)
			h.storage.UpdateGenreStatistics(ctx, genre, 0, int(position), 0)
			// Update streak (play time)
			h.storage.UpdateListeningStreak(ctx, identity, timestamp, 0, int(position))
		}
	}
}

func getIP(r *http.Request) string {
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		// X-Forwarded-For: client, proxy1, proxy2
		ips := strings.Split(forwarded, ",")
		return strings.TrimSpace(ips[0])
	}

	// RemoteAddr contains port, need to strip it (IPv4 and IPv6)
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}

func (h *AnalyticsHandler) parseFilters(r *http.Request) *models.QueryFilters {
	filters := &models.QueryFilters{
		Limit:  20,
		Offset: 0,
	}

	// Parse query parameters
	if startDate := r.URL.Query().Get("startDate"); startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			filters.StartDate = &t
		}
	} else {
		// Default to last 30 days
		t := time.Now().AddDate(0, 0, -30)
		filters.StartDate = &t
	}

	if endDate := r.URL.Query().Get("endDate"); endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			filters.EndDate = &t
		}
	} else {
		// Default to now
		t := time.Now()
		filters.EndDate = &t
	}

	if period := r.URL.Query().Get("period"); period != "" {
		filters.Period = &period
	}

	if platform := r.URL.Query().Get("platform"); platform != "" {
		filters.Platform = &platform
	}

	if artistId := r.URL.Query().Get("artistId"); artistId != "" {
		filters.ArtistID = &artistId
	}

	if albumId := r.URL.Query().Get("albumId"); albumId != "" {
		filters.AlbumID = &albumId
	}

	return filters
}

// RegisterRoutes registers analytics routes
func (h *AnalyticsHandler) RegisterRoutes(r chi.Router) {
	r.Route("/api/v1/analytics", func(r chi.Router) {
		// Event ingestion
		r.Post("/events", h.IngestEvent)
		r.Post("/events/batch", h.IngestEventBatch)

		// Dashboard and metrics
		r.Get("/dashboard", h.GetDashboard)
		r.Get("/tracks/top", h.GetTopTracks)
		r.Get("/platform-stats", h.GetPlatformStats)
		r.Get("/listening-patterns", h.GetListeningPatterns)
		r.Get("/realtime", h.GetRealtimeStats)

		// Artist and Album analytics
		r.Get("/artists/{name}", h.GetArtistAnalytics)
		r.Get("/albums/{title}", h.GetAlbumAnalytics)

		// System
		r.Get("/migrations/status", h.GetMigrationStatus)
	})
}

// Helper to hash filters for cache keys
func hashFilters(f *models.QueryFilters) string {
	// Simple string representation. For better collision resistance, use real hashing.
	// Considering the low cardinality of concurrent filters per user usually, this is "okay" but let's be safe.
	raw := fmt.Sprintf("%v-%v-%v-%v-%v-%v-%d-%d",
		f.StartDate,
		f.EndDate,
		strPtr(f.Period),
		strPtr(f.Platform),
		strPtr(f.ArtistID),
		strPtr(f.AlbumID),
		f.Limit,
		f.Offset,
	)
	h := sha256.New()
	h.Write([]byte(raw))
	return fmt.Sprintf("%x", h.Sum(nil))
}

func strPtr(s *string) string {
	if s == nil {
		return "nil"
	}
	return *s
}
