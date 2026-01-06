package api

import (
	"fmt"
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

	var filePath string
	query := `SELECT file_path FROM tracks WHERE id = $1`

	err := database.DB.QueryRow(r.Context(), query, trackID).Scan(&filePath)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.NotFound(w, r)
			return
		}
		http.Error(w, fmt.Sprintf("Database error: %v", err), http.StatusInternalServerError)
		return
	}

	fullPath := resolveMediaPath(filePath)
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

	fmt.Printf("🖼️ Requesting cover for album: %s\n", albumID)

	var coverArtPath *string
	query := `SELECT cover_art_path FROM albums WHERE id = $1`

	err := database.DB.QueryRow(r.Context(), query, albumID).Scan(&coverArtPath)
	if err != nil {
		if err == pgx.ErrNoRows {
			fmt.Printf("❌ Album not found: %s\n", albumID)
			http.NotFound(w, r)
			return
		}
		fmt.Printf("❌ Database error: %v\n", err)
		http.Error(w, fmt.Sprintf("Database error: %v", err), http.StatusInternalServerError)
		return
	}

	if coverArtPath == nil || *coverArtPath == "" {
		fmt.Printf("⚠️ No cover art path for album: %s\n", albumID)
		http.NotFound(w, r)
		return
	}

	fullPath := resolveMediaPath(*coverArtPath)
	fmt.Printf("📂 Serving cover from: %s\n", fullPath)

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		fmt.Printf("❌ File does not exist: %s\n", fullPath)
		http.NotFound(w, r)
		return
	}

	http.ServeFile(w, r, fullPath)
}
