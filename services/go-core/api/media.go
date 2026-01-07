package api

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
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
		// Try to catch subpaths if chi pattern fails or wildcard used
		albumID = chi.URLParam(r, "*")
	}

	if albumID == "" {
		http.Error(w, "Album ID is required", http.StatusBadRequest)
		return
	}

	slog.Info("Requesting cover", "album_id", albumID)

	var coverArtPath *string
	query := `SELECT cover_art_path FROM albums WHERE id = $1`

	err := database.DB.QueryRow(r.Context(), query, albumID).Scan(&coverArtPath)
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

	if coverArtPath == nil || *coverArtPath == "" {
		slog.Warn("No cover art path for album", "album_id", albumID)
		http.NotFound(w, r)
		return
	}

	fullPath := resolveMediaPath(*coverArtPath)
	slog.Info("Serving cover", "path", fullPath)

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		slog.Warn("Cover file does not exist", "path", fullPath, "album_id", albumID)
		http.NotFound(w, r)
		return
	}

	http.ServeFile(w, r, fullPath)
}
