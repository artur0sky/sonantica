package api

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"sonantica-core/cache"
	"sonantica-core/database"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func resolveMediaPath(path string) string {
	if filepath.IsAbs(path) {
		return path
	}

	mediaPath := os.Getenv("MEDIA_PATH")
	if mediaPath == "" {
		mediaPath = "/media"
	}

	return filepath.Join(mediaPath, path)
}

// StreamTrack serves the audio file or specific stems if requested
func StreamTrack(w http.ResponseWriter, r *http.Request) {
	trackID := chi.URLParam(r, "id")
	if trackID == "" {
		http.Error(w, "Track ID is required", http.StatusBadRequest)
		return
	}

	if _, err := uuid.Parse(trackID); err != nil {
		slog.Warn("Invalid UUID format for track_id", "track_id", trackID)
		http.Error(w, "Invalid Track ID format", http.StatusBadRequest)
		return
	}

	stemType := r.URL.Query().Get("stem") // vocals, drums, bass, other, no_vocals
	slog.Info("Streaming request", "track_id", trackID, "stem", stemType)

	var filePath string
	var aiMetadataStr *string
	query := `SELECT file_path, ai_metadata FROM tracks WHERE id = $1`

	err := database.DB.QueryRow(r.Context(), query, trackID).Scan(&filePath, &aiMetadataStr)
	if err != nil {
		if err == pgx.ErrNoRows {
			slog.Warn("Track not found in database", "track_id", trackID)
			http.NotFound(w, r)
			return
		}
		slog.Error("Database error during streaming", "error", err, "track_id", trackID)
		http.Error(w, fmt.Sprintf("Database error: %v", err), http.StatusInternalServerError)
		return
	}

	fullPath := resolveMediaPath(filePath)

	// If a stem is requested and results exist
	if stemType != "" && aiMetadataStr != nil {
		var metadata map[string]interface{}
		if err := json.Unmarshal([]byte(*aiMetadataStr), &metadata); err == nil {
			// Check if stems exist in metadata.
			// Format usually: {"stems": {"vocals": "path/to/vocals.mp3", ...}}
			// OR if it's the JobID from Demucs: {"demucs_job_id": "..."}
			if jobID, ok := metadata["demucs_job_id"].(string); ok {
				// We assume stems are in MEDIA_PATH/ai-stems/JOB_ID/
				// Demucs default paths are usually output_dir/model/job_id/track_name/stem.wav
				// For simplicity in our current setup, let's assume they are stored and we can find them.

				// Logic for 'no_vocals' (mix of drums, bass, other)
				// Note: Real 'no_vocals' might need a premixed file or 3-source mixing.
				// For now, let's look for the specific stem file.

				stemFile := stemType + ".mp3" // Or .wav depending on Demucs config
				if stemType == "no_vocals" {
					stemFile = "no_vocals.mp3"
				}

				// Search in the ai-stems bucket
				stemPath := filepath.Join(os.Getenv("MEDIA_PATH"), "ai-stems", jobID, stemFile)
				if _, err := os.Stat(stemPath); err == nil {
					fullPath = stemPath
					slog.Info("Serving AI Stem", "type", stemType, "path", fullPath)
				} else {
					// Fallback to wav if mp3 not found
					stemPathWav := filepath.Join(os.Getenv("MEDIA_PATH"), "ai-stems", jobID, stemType+".wav")
					if _, err := os.Stat(stemPathWav); err == nil {
						fullPath = stemPathWav
						slog.Info("Serving AI Stem (wav)", "type", stemType, "path", fullPath)
					}
				}
			}
		}
	}

	slog.Info("Serving file", "path", fullPath)
	http.ServeFile(w, r, fullPath)
}

// GetAlbumCover serves the local image file for the album cover
func GetAlbumCover(w http.ResponseWriter, r *http.Request) {
	albumID := chi.URLParam(r, "id")
	if albumID == "" {
		albumID = chi.URLParam(r, "*")
	}

	if albumID == "" {
		http.Error(w, "Album ID is required", http.StatusBadRequest)
		return
	}

	if _, err := uuid.Parse(albumID); err != nil {
		slog.Warn("Invalid UUID format for album_id", "album_id", albumID)
		http.Error(w, "Invalid Album ID format", http.StatusBadRequest)
		return
	}

	// 1. Try Cache First
	coverArtPath, err := cache.GetAlbumCover(r.Context(), albumID)
	if err == nil && coverArtPath != "" {
		slog.Info("Requesting cover (cached)", "album_id", albumID)
		serveCover(w, r, coverArtPath, albumID)
		return
	}

	slog.Info("Requesting cover (database)", "album_id", albumID)

	// 2. Database Fallback
	var dbPath *string
	query := `SELECT cover_art FROM albums WHERE id = $1`

	err = database.DB.QueryRow(r.Context(), query, albumID).Scan(&dbPath)
	if err != nil {
		if err == pgx.ErrNoRows {
			slog.Warn("Album not found", "album_id", albumID)
			http.NotFound(w, r)
			return
		}
		slog.Error("Database error fetching cover", "error", err, "album_id", albumID)
		http.Error(w, fmt.Sprintf("Database error: %v", err), http.StatusInternalServerError)
		return
	}

	if dbPath == nil || *dbPath == "" {
		slog.Warn("No cover art path for album", "album_id", albumID)
		http.NotFound(w, r)
		return
	}

	// 3. Save to Cache
	if err := cache.SetAlbumCover(r.Context(), albumID, *dbPath); err != nil {
		slog.Warn("Failed to cache album cover", "album_id", albumID, "error", err)
	}

	serveCover(w, r, *dbPath, albumID)
}

func serveCover(w http.ResponseWriter, r *http.Request, path string, albumID string) {
	fullPath := resolveMediaPath(path)

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		slog.Warn("Cover file does not exist", "path", fullPath, "album_id", albumID)
		http.NotFound(w, r)
		return
	}

	// Add Cache-Control Header (1 year for images since they are immutable in this flow)
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	http.ServeFile(w, r, fullPath)
}
