package api

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"sonantica-core/database"

	"github.com/go-chi/chi/v5"
)

// StreamTrack handles streaming of a track by its ID
func StreamTrack(w http.ResponseWriter, r *http.Request) {
	trackID := chi.URLParam(r, "id")
	if trackID == "" {
		http.Error(w, "Missing track ID", http.StatusBadRequest)
		return
	}

	// 1. Get File Path from DB
	var relPath string
	err := database.DB.QueryRow(r.Context(), "SELECT file_path FROM tracks WHERE id = $1", trackID).Scan(&relPath)
	if err != nil {
		http.Error(w, "Track not found", http.StatusNotFound)
		return
	}

	// 2. Resolve Full Path
	mediaPath := os.Getenv("MEDIA_PATH")
	if mediaPath == "" {
		mediaPath = "/media"
	}

	// Security: Prevent directory traversal (though UUID lookup makes this very hard to exploit)
	if strings.Contains(relPath, "..") {
		http.Error(w, "Invalid file path", http.StatusForbidden)
		return
	}

	fullPath := filepath.Join(mediaPath, relPath)

	// 3. Open File
	file, err := os.Open(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "File not found on disk", http.StatusNotFound)
			return
		}
		http.Error(w, "Error reading file", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		http.Error(w, "Error getting file info", http.StatusInternalServerError)
		return
	}

	// 4. Serve Content (Handles Range Requests for seeking/buffering)
	http.ServeContent(w, r, filepath.Base(relPath), stat.ModTime(), file)
}
