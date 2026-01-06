package api

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"sonantica-core/database"
	"sonantica-core/models"
	"sonantica-core/scanner"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

// GetTracks returns all tracks from the database with artist and album names
func GetTracks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// TODO: Add pagination
	slog.Info("Fetching all tracks", "client_ip", r.RemoteAddr)

	query := `
		SELECT 
			t.id, t.title, t.album_id, t.artist_id, t.file_path, t.duration_seconds, 
			t.format, t.bitrate, t.sample_rate, t.channels, t.track_number, t.disc_number, 
			t.genre, t.play_count, t.is_favorite, t.created_at, t.updated_at,
			a.name as artist_name,
			al.title as album_title,
			al.cover_art_path as album_cover_art
		FROM tracks t
		LEFT JOIN artists a ON t.artist_id = a.id
		LEFT JOIN albums al ON t.album_id = al.id
		ORDER BY t.created_at DESC
	`

	rows, err := database.DB.Query(r.Context(), query)
	if err != nil {
		slog.Error("Failed to query tracks", "error", err)
		http.Error(w, fmt.Sprintf("Query error: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tracks, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Track])
	if err != nil {
		slog.Error("Failed to scan tracks rows", "error", err)
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
		slog.Error("Failed to query artists", "error", err)
		http.Error(w, fmt.Sprintf("Query error: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	artists, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Artist])
	if err != nil {
		slog.Error("Failed to scan artists rows", "error", err)
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
		slog.Error("Failed to query albums", "error", err)
		http.Error(w, fmt.Sprintf("Query error: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	albums, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Album])
	if err != nil {
		slog.Error("Failed to scan albums rows", "error", err)
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

	slog.Info("Manual scan triggered via API", "path", mediaPath)
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

// GetTracksByArtist returns tracks filtered by artist ID
func GetTracksByArtist(w http.ResponseWriter, r *http.Request) {
	artistID := chi.URLParam(r, "id")
	w.Header().Set("Content-Type", "application/json")

	slog.Info("Fetching tracks by artist", "artist_id", artistID)

	query := `
		SELECT 
			t.id, t.title, t.album_id, t.artist_id, t.file_path, t.duration_seconds, 
			t.format, t.bitrate, t.sample_rate, t.channels, t.track_number, t.disc_number, 
			t.genre, t.play_count, t.is_favorite, t.created_at, t.updated_at,
			a.name as artist_name,
			al.title as album_title,
			al.cover_art_path as album_cover_art
		FROM tracks t
		LEFT JOIN artists a ON t.artist_id = a.id
		LEFT JOIN albums al ON t.album_id = al.id
		WHERE t.artist_id = $1
		ORDER BY al.release_year DESC, t.track_number ASC
	`

	rows, err := database.DB.Query(r.Context(), query, artistID)
	if err != nil {
		slog.Error("Failed to query tracks by artist", "error", err, "artist_id", artistID)
		http.Error(w, fmt.Sprintf("Query error: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tracks, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Track])
	if err != nil {
		slog.Error("Failed to scan artist tracks rows", "error", err)
		http.Error(w, fmt.Sprintf("Row scan error: %v", err), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"tracks": tracks,
	})
}

// GetTracksByAlbum returns tracks filtered by album ID
func GetTracksByAlbum(w http.ResponseWriter, r *http.Request) {
	albumID := chi.URLParam(r, "id")
	w.Header().Set("Content-Type", "application/json")

	slog.Info("Fetching tracks by album", "album_id", albumID)

	query := `
		SELECT 
			t.id, t.title, t.album_id, t.artist_id, t.file_path, t.duration_seconds, 
			t.format, t.bitrate, t.sample_rate, t.channels, t.track_number, t.disc_number, 
			t.genre, t.play_count, t.is_favorite, t.created_at, t.updated_at,
			a.name as artist_name,
			al.title as album_title,
			al.cover_art_path as album_cover_art
		FROM tracks t
		LEFT JOIN artists a ON t.artist_id = a.id
		LEFT JOIN albums al ON t.album_id = al.id
		WHERE t.album_id = $1
		ORDER BY t.disc_number ASC, t.track_number ASC
	`

	rows, err := database.DB.Query(r.Context(), query, albumID)
	if err != nil {
		slog.Error("Failed to query tracks by album", "error", err, "album_id", albumID)
		http.Error(w, fmt.Sprintf("Query error: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tracks, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Track])
	if err != nil {
		slog.Error("Failed to scan album tracks rows", "error", err)
		http.Error(w, fmt.Sprintf("Row scan error: %v", err), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"tracks": tracks,
	})
}
