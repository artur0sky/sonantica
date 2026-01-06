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

	// Insert event
	if err := h.storage.InsertEvent(r.Context(), &event); err != nil {
		log.Printf("Error inserting event: %v", err)
		http.Error(w, "Failed to store event", http.StatusInternalServerError)
		return
	}

	// Process event for aggregation
	go h.processEventForAggregation(&event)

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

	// Insert events in batch
	if err := h.storage.InsertEventBatch(r.Context(), batch.Events); err != nil {
		log.Printf("Error inserting event batch: %v", err)
		http.Error(w, "Failed to store events", http.StatusInternalServerError)
		return
	}

	// Process events for aggregation asynchronously
	go func() {
		for i := range batch.Events {
			h.processEventForAggregation(&batch.Events[i])
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

	// Build dashboard response
	dashboard = models.DashboardMetrics{
		StartDate:         filters.StartDate.Format("2006-01-02"),
		EndDate:           filters.EndDate.Format("2006-01-02"),
		TopTracks:         topTracks,
		PlatformStats:     platformStats,
		ListeningHeatmap:  heatmap,
		Overview:          overview,
		PlaybackTimeline:  timeline,
		GenreDistribution: genres,
		RecentSessions:    []models.SessionSummary{},
		ListeningStreak:   models.StreakData{},
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

// GetTopTracks returns top played tracks
func (h *AnalyticsHandler) GetTopTracks(w http.ResponseWriter, r *http.Request) {
	filters := h.parseFilters(r)

	tracks, err := h.storage.GetTopTracks(r.Context(), filters)
	if err != nil {
		log.Printf("Error getting top tracks: %v", err)
		http.Error(w, "Failed to get top tracks", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tracks)
}

// GetPlatformStats returns platform statistics
func (h *AnalyticsHandler) GetPlatformStats(w http.ResponseWriter, r *http.Request) {
	filters := h.parseFilters(r)

	stats, err := h.storage.GetPlatformStats(r.Context(), filters)
	if err != nil {
		log.Printf("Error getting platform stats: %v", err)
		http.Error(w, "Failed to get platform stats", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// GetListeningPatterns returns listening patterns
func (h *AnalyticsHandler) GetListeningPatterns(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement listening pattern analysis
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.ListeningPattern{})
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

	// Process playback events for track statistics
	if event.EventType == models.EventPlaybackComplete {
		if trackID, ok := event.Data["trackId"].(string); ok {
			// Update track statistics
			h.storage.UpdateTrackStatistics(
				ctx,
				trackID,
				1,     // play count
				1,     // complete count
				0,     // skip count
				0,     // TODO: get duration from event data
				100.0, // 100% completion
			)
		}
	} else if event.EventType == models.EventPlaybackSkip {
		if trackID, ok := event.Data["trackId"].(string); ok {
			h.storage.UpdateTrackStatistics(
				ctx,
				trackID,
				1,   // play count
				0,   // complete count
				1,   // skip count
				0,   // TODO: get duration from event data
				0.0, // 0% completion (skipped)
			)
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
