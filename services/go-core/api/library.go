package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"sonantica-core/database"
	"sonantica-core/models"
	"sonantica-core/scanner"

	"github.com/jackc/pgx/v5"
)

// GetTracks returns all tracks from the database with artist and album names
func GetTracks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	query := `
		SELECT 
			t.id, t.title, t.album_id, t.artist_id, t.file_path, t.duration_seconds, 
			t.format, t.bitrate, t.sample_rate, t.channels, t.track_number, t.disc_number, 
			t.genre, t.play_count, t.is_favorite, t.created_at, t.updated_at,
			a.name as artist_name,
			al.title as album_title
		FROM tracks t
		LEFT JOIN artists a ON t.artist_id = a.id
		LEFT JOIN albums al ON t.album_id = al.id
		ORDER BY t.created_at DESC
	`

	rows, err := database.DB.Query(r.Context(), query)
	if err != nil {
		http.Error(w, fmt.Sprintf("Query error: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tracks, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Track])
	if err != nil {
		http.Error(w, fmt.Sprintf("Row scan error: %v", err), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"tracks": tracks,
	})
}

// GetArtists returns all artists from the database
func GetArtists(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	rows, err := database.DB.Query(r.Context(), "SELECT id, name, bio, image_url, created_at FROM artists")
	if err != nil {
		http.Error(w, fmt.Sprintf("Query error: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	artists, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Artist])
	if err != nil {
		http.Error(w, fmt.Sprintf("Row scan error: %v", err), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"artists": artists,
	})
}

// GetAlbums returns all albums from the database with artist names
func GetAlbums(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	query := `
		SELECT 
			al.id, al.title, al.artist_id, al.release_year, al.cover_art_path, al.folder_path, al.created_at,
			a.name as artist_name
		FROM albums al
		LEFT JOIN artists a ON al.artist_id = a.id
		ORDER BY al.title ASC
	`

	rows, err := database.DB.Query(r.Context(), query)
	if err != nil {
		http.Error(w, fmt.Sprintf("Query error: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	albums, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Album])
	if err != nil {
		http.Error(w, fmt.Sprintf("Row scan error: %v", err), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"albums": albums,
	})
}

// ScanLibrary triggers a manual scan of the media library
func ScanLibrary(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Parse custom paths if sent in body, but for now just use root
	// MVP: Trigger root scan

	mediaPath := os.Getenv("MEDIA_PATH")
	if mediaPath == "" {
		mediaPath = "/media"
	}

	scanner.TriggerScan(mediaPath)

	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "scanning_started",
		"path":   mediaPath,
	})
}

// GetScanStatus returns the current status and statistics of the library
func GetScanStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var trackCount, artistCount, albumCount int

	database.DB.QueryRow(r.Context(), "SELECT count(*) FROM tracks").Scan(&trackCount)
	database.DB.QueryRow(r.Context(), "SELECT count(*) FROM artists").Scan(&artistCount)
	database.DB.QueryRow(r.Context(), "SELECT count(*) FROM albums").Scan(&albumCount)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"isScanning": false, // TODO: Pull from scanner state
		"stats": map[string]int{
			"tracks":  trackCount,
			"artists": artistCount,
			"albums":  albumCount,
		},
	})
}
