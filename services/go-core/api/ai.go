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
	"github.com/jackc/pgx/v5"
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
		r.Post("/analyze/{trackId}", h.AnalyzeTrack)
		r.Get("/jobs/{id}", h.GetJobStatus)
		r.Post("/recommendations", h.GetRecommendations)
	})
}

// GetCapabilities returns all active AI plugin capabilities
func (h *AIHandler) GetCapabilities(w http.ResponseWriter, r *http.Request) {
	caps := h.manager.GetCapabilities()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(caps)
}

// SeparateStems triggers a stem separation job for a track (Legacy alias for AnalyzeTrack)
func (h *AIHandler) SeparateStems(w http.ResponseWriter, r *http.Request) {
	trackIDStr := chi.URLParam(r, "trackId")
	trackID, err := uuid.Parse(trackIDStr)
	if err != nil {
		http.Error(w, "Invalid track ID", http.StatusBadRequest)
		return
	}

	jobResp, err := h.manager.AnalyzeTrack(r.Context(), trackID, domain.CapabilityStemSeparation)
	if err != nil {
		slog.Error("Failed to dispatch Demucs job", "track_id", trackID, "error", err)
		http.Error(w, fmt.Sprintf("AI Dispatch error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(jobResp)
}

// AnalyzeTrack triggers a high-priority analysis for a single track
func (h *AIHandler) AnalyzeTrack(w http.ResponseWriter, r *http.Request) {
	trackIDStr := chi.URLParam(r, "trackId")
	trackID, err := uuid.Parse(trackIDStr)
	if err != nil {
		http.Error(w, "Invalid track ID", http.StatusBadRequest)
		return
	}

	capType := r.URL.Query().Get("capability")
	if capType == "" {
		capType = string(domain.CapabilityStemSeparation)
	}

	jobResp, err := h.manager.AnalyzeTrack(r.Context(), trackID, domain.PluginCapability(capType))
	if err != nil {
		slog.Error("Failed to dispatch priority AI job", "track_id", trackID, "cap", capType, "error", err)
		http.Error(w, fmt.Sprintf("AI Dispatch error: %v", err), http.StatusInternalServerError)
		return
	}

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

// GetRecommendations returns AI-generated recommendations, optionally hydrated
func (h *AIHandler) GetRecommendations(w http.ResponseWriter, r *http.Request) {
	var req domain.RecommendationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	recs, err := h.manager.GetRecommendations(r.Context(), req)
	if err != nil {
		slog.Warn("Failed to get AI recommendations", "error", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Simple Hydration
	trackIDs := make([]string, 0)
	artistIDs := make([]string, 0)
	albumIDs := make([]string, 0)

	for _, rec := range recs {
		switch rec.Type {
		case "track":
			trackIDs = append(trackIDs, rec.ID)
		case "artist":
			artistIDs = append(artistIDs, rec.ID)
		case "album":
			albumIDs = append(albumIDs, rec.ID)
		}
	}

	hydratedTracks := make([]models.Track, 0)
	hydratedArtists := make([]models.Artist, 0)
	hydratedAlbums := make([]models.Album, 0)

	if len(trackIDs) > 0 {
		query := `
			SELECT 
				t.id, t.title, t.album_id, t.artist_id, t.file_path, t.duration_seconds, 
				t.format, t.bitrate, t.sample_rate, t.channels, t.track_number, t.disc_number, 
				t.genre, t.year, t.play_count, t.is_favorite, t.created_at, t.updated_at,
				t.ai_metadata, t.has_stems, t.has_embeddings,
				a.name as artist_name,
				al.title as album_title,
				al.cover_art as album_cover_art
			FROM tracks t
			LEFT JOIN artists a ON t.artist_id = a.id
			LEFT JOIN albums al ON t.album_id = al.id
			WHERE t.id = ANY($1)
		`
		if rows, err := database.DB.Query(r.Context(), query, trackIDs); err == nil {
			hydratedTracks, _ = pgx.CollectRows(rows, pgx.RowToStructByName[models.Track])
			rows.Close()
		}
	}

	if len(artistIDs) > 0 {
		query := `SELECT id, name, bio, cover_art, created_at FROM artists WHERE id = ANY($1)`
		if rows, err := database.DB.Query(r.Context(), query, artistIDs); err == nil {
			hydratedArtists, _ = pgx.CollectRows(rows, pgx.RowToStructByName[models.Artist])
			rows.Close()
		}
	}

	if len(albumIDs) > 0 {
		query := `
			SELECT 
				al.id, al.title, al.artist_id, al.release_date::TEXT, al.cover_art, al.genre, al.created_at,
				a.name as artist_name
			FROM albums al
			LEFT JOIN artists a ON al.artist_id = a.id
			WHERE al.id = ANY($1)
		`
		if rows, err := database.DB.Query(r.Context(), query, albumIDs); err == nil {
			hydratedAlbums, _ = pgx.CollectRows(rows, pgx.RowToStructByName[models.Album])
			rows.Close()
		}
	}

	// Create response
	type HydratedRecommendation struct {
		ID     string         `json:"id"`
		Type   string         `json:"type"`
		Score  float64        `json:"score"`
		Reason string         `json:"reason"`
		Track  *models.Track  `json:"track,omitempty"`
		Artist *models.Artist `json:"artist,omitempty"`
		Album  *models.Album  `json:"album,omitempty"`
	}

	response := make([]HydratedRecommendation, len(recs))
	for i, rec := range recs {
		response[i] = HydratedRecommendation{
			ID:     rec.ID,
			Type:   rec.Type,
			Score:  rec.Score,
			Reason: rec.Reason,
		}

		switch rec.Type {
		case "track":
			for _, t := range hydratedTracks {
				if t.ID.String() == rec.ID {
					tCopy := t
					response[i].Track = &tCopy
					break
				}
			}
		case "artist":
			for _, a := range hydratedArtists {
				if a.ID.String() == rec.ID {
					aCopy := a
					response[i].Artist = &aCopy
					break
				}
			}
		case "album":
			for _, a := range hydratedAlbums {
				if a.ID.String() == rec.ID {
					aCopy := a
					response[i].Album = &aCopy
					break
				}
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
