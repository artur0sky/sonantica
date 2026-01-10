package scanner

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// SmartScanner handles prioritization of audio analysis tasks
type SmartScanner struct {
	db          *pgxpool.Pool
	redisClient *redis.Client
	isPaused    bool
	mu          sync.RWMutex
}

// NewSmartScanner creates a new SmartScanner
func NewSmartScanner(db *pgxpool.Pool, r *redis.Client) *SmartScanner {
	return &SmartScanner{
		db:          db,
		redisClient: r,
	}
}

// ScanPriority represents the priority level of a scan
type ScanPriority string

const (
	PriorityHigh   ScanPriority = "high"   // Playback, Explicit User Action
	PriorityMedium ScanPriority = "medium" // Queue, Recently Added
	PriorityLow    ScanPriority = "low"    // Background Scan
)

// TaskPayload represents the standard Celery task structure
type TaskPayload struct {
	ID      string        `json:"id"`
	Task    string        `json:"task"`
	Args    []interface{} `json:"args"`
	Kwargs  interface{}   `json:"kwargs"`
	Retries int           `json:"retries"`
	ETA     *string       `json:"eta"`
}

// TriggerScan starts an intelligent scan based on context
func (s *SmartScanner) TriggerScan(ctx context.Context, priority ScanPriority, specificTrackID *uuid.UUID) {
	go func() {
		// Use a detached context for background processing
		bgCtx := context.Background()

		switch priority {
		case PriorityHigh:
			if specificTrackID != nil {
				s.PrioritizeTrack(bgCtx, *specificTrackID)
			}
		case PriorityMedium:
			s.scanQueueAndRecent(bgCtx)
		case PriorityLow:
			s.scanLibrary(bgCtx)
		}
	}()
}

// PrioritizeTrack interrupts background flow to process a specific track immediately
func (s *SmartScanner) PrioritizeTrack(ctx context.Context, trackID uuid.UUID) {
	slog.Info("🚨 Prioritizing track analysis", "track_id", trackID)

	s.mu.Lock()
	s.isPaused = true // Pause background dispatching if any
	s.mu.Unlock()

	// Analyze the track with priority (Head of queue)
	s.analyzeTrack(ctx, trackID, true)

	// Resume after a while or after specific logic
	go func() {
		time.Sleep(5 * time.Second) // Small buffer
		s.mu.Lock()
		s.isPaused = false
		s.mu.Unlock()
		slog.Info("🟢 Background scanning resumed", "track_id", trackID)
	}()
}

// analyzeTrack sends a single track to Celery
func (s *SmartScanner) analyzeTrack(ctx context.Context, trackID uuid.UUID, priority bool) {
	// 1. Check if already analyzed (optional check, currently we re-analyze if requested)
	// TODO: Add check if ai_metadata is complete?

	// 2. Fetch Track Path
	var filePath string
	err := s.db.QueryRow(ctx, "SELECT file_path FROM tracks WHERE id = $1", trackID).Scan(&filePath)
	if err != nil {
		slog.Error("SmartScanner: Failed to get track", "id", trackID, "error", err)
		return
	}

	// 3. Send to Celery
	s.dispatchToCelery(ctx, trackID, filePath, priority)
}

// scanQueueAndRecent scans items in playback queue and recently added
func (s *SmartScanner) scanQueueAndRecent(ctx context.Context) {
	// Ideally we'd scan the Redis queue, but good enough proxy is "recently played" or "recently added"

	// Scan Recently Added (Top 50)
	rows, err := s.db.Query(ctx, "SELECT id, file_path FROM tracks WHERE ai_metadata IS NULL ORDER BY created_at DESC LIMIT 50")
	if err != nil {
		slog.Error("SmartScanner: Failed to fetch recent tracks", "error", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		s.mu.RLock()
		paused := s.isPaused
		s.mu.RUnlock()
		if paused {
			slog.Debug("SmartScanner: Skipping recent scan item (Paused for priority)")
			continue
		}

		var id uuid.UUID
		var path string
		if err := rows.Scan(&id, &path); err == nil {
			s.dispatchToCelery(ctx, id, path, false)
		}
	}
}

// scanLibrary scans the rest (Background)
func (s *SmartScanner) scanLibrary(ctx context.Context) {
	// Scan tracks with no AI/Analytics metadata
	rows, err := s.db.Query(ctx, "SELECT id, file_path FROM tracks WHERE ai_metadata IS NULL LIMIT 100")
	if err != nil {
		slog.Error("SmartScanner: Failed to fetch unanalyzed tracks", "error", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		s.mu.RLock()
		paused := s.isPaused
		s.mu.RUnlock()
		if paused {
			slog.Debug("SmartScanner: Skipping library scan item (Paused for priority)")
			time.Sleep(1 * time.Second) // Wait for priority to finish
			continue
		}

		var id uuid.UUID
		var path string
		if err := rows.Scan(&id, &path); err == nil {
			s.dispatchToCelery(ctx, id, path, false)
		}
		// Slow background scan
		time.Sleep(500 * time.Millisecond)
	}
}

func (s *SmartScanner) dispatchToCelery(ctx context.Context, trackID uuid.UUID, filePath string, priority bool) {
	taskID := uuid.New().String()

	// Match python-worker/src/infrastructure/tasks/process_audio_tasks.py signature
	// def analyze_audio_task(self, job_data):
	// job_data expects: {"file_path": ..., "track_id": ...}
	jobData := map[string]interface{}{
		"file_path": filePath,
		"track_id":  trackID.String(),
		"trace_id":  taskID, // Use taskID as trace_id
	}

	payload := TaskPayload{
		ID:      taskID,
		Task:    "sonantica.analyze_audio",
		Args:    []interface{}{jobData},
		Kwargs:  make(map[string]interface{}),
		Retries: 0,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		slog.Error("SmartScanner: Failed to marshal task", "error", err)
		return
	}

	// Push to 'celery' list in Redis
	if err := s.redisClient.LPush(ctx, "celery", jsonPayload).Err(); err != nil {
		slog.Error("SmartScanner: Failed to push to Redis", "error", err)
	} else {
		slog.Info("SmartScanner: Queued analysis", "track_id", trackID)
	}
}
