package api

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"sonantica-core/cache"
	"sonantica-core/database"

	"github.com/go-chi/chi/v5"
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

// StreamTrack serves the audio file
func StreamTrack(w http.ResponseWriter, r *http.Request) {
	trackID := chi.URLParam(r, "id")
	if trackID == "" {
		http.Error(w, "Track ID is required", http.StatusBadRequest)
		return
	}

	slog.Info("Streaming request", "track_id", trackID)

	var filePath string
	query := `SELECT file_path FROM tracks WHERE id = $1`

	err := database.DB.QueryRow(r.Context(), query, trackID).Scan(&filePath)
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
