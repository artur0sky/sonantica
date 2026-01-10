package api

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"sonantica-core/database"
	"sonantica-core/internal/plugins/application"
	"sonantica-core/internal/plugins/domain"
	"sonantica-core/models"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// AIHandler handles AI-related HTTP requests
type AIHandler struct {
	manager *application.Manager
}

// NewAIHandler creates a new AI handler
func NewAIHandler(manager *application.Manager) *AIHandler {
	return &AIHandler{
		manager: manager,
	}
}

// RegisterAIRoutes registers AI routes in the router
func (h *AIHandler) RegisterAIRoutes(r chi.Router) {
	r.Route("/api/v1/ai", func(r chi.Router) {
		r.Get("/capabilities", h.GetCapabilities)
		r.Post("/demucs/separate/{trackId}", h.SeparateStems)
		r.Get("/jobs/{id}", h.GetJobStatus)
	})
}

// GetCapabilities returns all active AI plugin capabilities
func (h *AIHandler) GetCapabilities(w http.ResponseWriter, r *http.Request) {
	caps := h.manager.GetCapabilities()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(caps)
}

// SeparateStems triggers a stem separation job for a track
func (h *AIHandler) SeparateStems(w http.ResponseWriter, r *http.Request) {
	trackIDStr := chi.URLParam(r, "trackId")
	trackID, err := uuid.Parse(trackIDStr)
	if err != nil {
		http.Error(w, "Invalid track ID", http.StatusBadRequest)
		return
	}

	// 1. Get track info from database to get file path
	var track models.Track
	err = database.DB.QueryRow(r.Context(),
		"SELECT id, file_path FROM tracks WHERE id = $1",
		trackID,
	).Scan(&track.ID, &track.FilePath)

	if err != nil {
		slog.Error("Track not found for AI job", "track_id", trackID, "error", err)
		http.Error(w, "Track not found", http.StatusNotFound)
		return
	}

	// 2. Dispatch job via Plugin Manager
	jobResp, err := h.manager.SeparateStems(r.Context(), track.ID.String(), track.FilePath)
	if err != nil {
		slog.Error("Failed to dispatch Demucs job", "track_id", trackID, "error", err)
		http.Error(w, fmt.Sprintf("AI Dispatch error: %v", err), http.StatusInternalServerError)
		return
	}

	// 3. Update track metadata locally to indicate processing (optional)
	// For now just return the job info
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(jobResp)
}

// GetJobStatus checks the status of an AI job in any plugin
func (h *AIHandler) GetJobStatus(w http.ResponseWriter, r *http.Request) {
	jobID := chi.URLParam(r, "id")
	capType := r.URL.Query().Get("type") // e.g. "stem-separation"

	if capType == "" {
		capType = string(domain.CapabilityStemSeparation) // Default
	}

	_, err := h.manager.GetPluginByCapability(domain.PluginCapability(capType))
	if err != nil {
		http.Error(w, "Plugin not found for this capability", http.StatusNotFound)
		return
	}

	// Forward status request to the plugin manager
	jobStatus, err := h.manager.GetJobStatus(r.Context(), domain.PluginCapability(capType), jobID)
	if err != nil {
		slog.Error("Failed to get job status", "job_id", jobID, "error", err)
		http.Error(w, fmt.Sprintf("AI Status error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(jobStatus)
}
