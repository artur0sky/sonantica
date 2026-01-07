package api

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"sonantica-core/cache"
	"sonantica-core/database"
	"sonantica-core/models"
	"sonantica-core/scanner"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

// GetTracks returns all tracks from the database with artist and album names
// If limit=-1, returns ALL tracks (cached for virtual scrolling)
func GetTracks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	limit := 50
	offset := 0

	// Parse pagination params
	if l := r.URL.Query().Get("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		fmt.Sscanf(o, "%d", &offset)
	}

	// Determine Sort Order
	sortParam := r.URL.Query().Get("sort")
	orderParam := r.URL.Query().Get("order")
	if orderParam == "" {
		orderParam = "asc"
	}

	// Special case: limit=-1 means "get ALL tracks" for virtual scrolling
	if limit == -1 {
		slog.Info("Fetching ALL tracks for virtual scrolling", "sort", sortParam, "order", orderParam)

		// Try cache first
		var tracks []models.Track
		if err := cache.GetAllTracks(r.Context(), &tracks); err == nil {
			slog.Debug("Cache hit for ALL tracks")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"tracks": tracks,
				"total":  len(tracks),
				"cached": true,
			})
			return
		}

		// Cache miss, query ALL from database
		orderBy := "t.created_at DESC"
		switch sortParam {
		case "title":
			orderBy = "t.title ASC"
		case "artist":
			orderBy = "a.name ASC, t.title ASC"
		case "album":
			orderBy = "al.title ASC, t.track_number ASC"
		case "recent":
			orderBy = "t.created_at DESC"
		}

		query := fmt.Sprintf(`
			SELECT 
				t.id, t.title, t.album_id, t.artist_id, t.file_path, t.duration_seconds, 
				t.format, t.bitrate, t.sample_rate, t.channels, t.track_number, t.disc_number, 
				t.genre, t.year, t.play_count, t.is_favorite, t.created_at, t.updated_at,
				a.name as artist_name,
				al.title as album_title,
				al.cover_art as album_cover_art
			FROM tracks t
			LEFT JOIN artists a ON t.artist_id = a.id
			LEFT JOIN albums al ON t.album_id = al.id
			ORDER BY %s
		`, orderBy)

		rows, err := database.DB.Query(r.Context(), query)
		if err != nil {
			slog.Error("Failed to query ALL tracks", "error", err)
			http.Error(w, fmt.Sprintf("Query error: %v", err), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		tracks, err = pgx.CollectRows(rows, pgx.RowToStructByName[models.Track])
		if err != nil {
			slog.Error("Failed to scan ALL tracks rows", "error", err)
			http.Error(w, fmt.Sprintf("Row scan error: %v", err), http.StatusInternalServerError)
			return
		}

		// Cache the complete library
		if err := cache.SetAllTracks(r.Context(), tracks); err != nil {
			slog.Warn("Failed to cache ALL tracks", "error", err)
		}

		slog.Info("Loaded ALL tracks", "count", len(tracks))
		json.NewEncoder(w).Encode(map[string]interface{}{
			"tracks": tracks,
			"total":  len(tracks),
			"cached": false,
		})
		return
	}

	// Normal paginated mode
	if limit > 100 {
		limit = 100
	}

	orderBy := "t.created_at DESC" // Default

	switch sortParam {
	case "title":
		orderBy = "t.title ASC"
	case "artist":
		orderBy = "a.name ASC, t.title ASC"
	case "album":
		orderBy = "al.title ASC, t.track_number ASC"
	case "recent":
		orderBy = "t.created_at DESC"
	}

	slog.Info("Fetching tracks", "limit", limit, "offset", offset, "sort", sortParam, "order", orderParam, "client_ip", r.RemoteAddr)

	// Try cache first
	var tracks []models.Track
	if err := cache.GetTracks(r.Context(), offset, limit, sortParam, orderParam, &tracks); err == nil {
		slog.Debug("Cache hit for tracks", "offset", offset, "limit", limit)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"tracks": tracks,
			"limit":  limit,
			"offset": offset,
			"cached": true,
		})
		return
	}

	// Cache miss, query database
	query := fmt.Sprintf(`
		SELECT 
			t.id, t.title, t.album_id, t.artist_id, t.file_path, t.duration_seconds, 
			t.format, t.bitrate, t.sample_rate, t.channels, t.track_number, t.disc_number, 
			t.genre, t.year, t.play_count, t.is_favorite, t.created_at, t.updated_at,
			a.name as artist_name,
			al.title as album_title,
			al.cover_art as album_cover_art
		FROM tracks t
		LEFT JOIN artists a ON t.artist_id = a.id
		LEFT JOIN albums al ON t.album_id = al.id
		ORDER BY %s
		LIMIT $1 OFFSET $2
	`, orderBy)

	rows, err := database.DB.Query(r.Context(), query, limit, offset)
	if err != nil {
		slog.Error("Failed to query tracks", "error", err)
		http.Error(w, fmt.Sprintf("Query error: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tracks, err = pgx.CollectRows(rows, pgx.RowToStructByName[models.Track])
	if err != nil {
		slog.Error("Failed to scan tracks rows", "error", err)
		http.Error(w, fmt.Sprintf("Row scan error: %v", err), http.StatusInternalServerError)
		return
	}

	// Cache the result
	if err := cache.SetTracks(r.Context(), offset, limit, sortParam, orderParam, tracks); err != nil {
		slog.Warn("Failed to cache tracks", "error", err)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"tracks": tracks,
		"limit":  limit,
		"offset": offset,
		"cached": false,
	})
}

// GetArtists returns all artists from the database
// If limit=-1, returns ALL artists (cached for virtual scrolling)
func GetArtists(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	limit := 50
	offset := 0

	if l := r.URL.Query().Get("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		fmt.Sscanf(o, "%d", &offset)
	}

	sortParam := r.URL.Query().Get("sort")
	orderParam := r.URL.Query().Get("order")
	if orderParam == "" {
		orderParam = "asc"
	}

	// Special case: limit=-1 means "get ALL artists" for virtual scrolling
	if limit == -1 {
		slog.Info("Fetching ALL artists for virtual scrolling", "sort", sortParam, "order", orderParam)

		// Try cache first
		var artists []models.Artist
		if err := cache.GetAllArtists(r.Context(), &artists); err == nil {
			slog.Debug("Cache hit for ALL artists")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"artists": artists,
				"total":   len(artists),
				"cached":  true,
			})
			return
		}

		// Cache miss, query ALL from database
		orderBy := "name ASC"
		if sortParam == "name" {
			if orderParam == "desc" {
				orderBy = "name DESC"
			} else {
				orderBy = "name ASC"
			}
		}

		query := fmt.Sprintf("SELECT id, name, bio, cover_art, created_at FROM artists ORDER BY %s", orderBy)

		rows, err := database.DB.Query(r.Context(), query)
		if err != nil {
			slog.Error("Failed to query ALL artists", "error", err)
			http.Error(w, fmt.Sprintf("Query error: %v", err), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		artists, err = pgx.CollectRows(rows, pgx.RowToStructByName[models.Artist])
		if err != nil {
			slog.Error("Failed to scan ALL artists rows", "error", err)
			http.Error(w, fmt.Sprintf("Row scan error: %v", err), http.StatusInternalServerError)
			return
		}

		// Cache the complete library
		if err := cache.SetAllArtists(r.Context(), artists); err != nil {
			slog.Warn("Failed to cache ALL artists", "error", err)
		}

		slog.Info("Loaded ALL artists", "count", len(artists))
		json.NewEncoder(w).Encode(map[string]interface{}{
			"artists": artists,
			"total":   len(artists),
			"cached":  false,
		})
		return
	}

	// Normal paginated mode
	if limit > 100 {
		limit = 100
	}

	orderBy := "name ASC" // Default
	if sortParam == "name" {
		if orderParam == "desc" {
			orderBy = "name DESC"
		} else {
			orderBy = "name ASC"
		}
	} else if sortParam == "trackCount" {
		orderBy = "name ASC"
	}

	query := fmt.Sprintf("SELECT id, name, bio, cover_art, created_at FROM artists ORDER BY %s LIMIT $1 OFFSET $2", orderBy)

	rows, err := database.DB.Query(r.Context(), query, limit, offset)
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
		"limit":   limit,
		"offset":  offset,
	})
}

// GetAlbums returns all albums from the database with artist names
// If limit=-1, returns ALL albums (cached for virtual scrolling)
func GetAlbums(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	limit := 50
	offset := 0

	if l := r.URL.Query().Get("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		fmt.Sscanf(o, "%d", &offset)
	}

	sortParam := r.URL.Query().Get("sort")
	orderParam := r.URL.Query().Get("order")
	if orderParam == "" {
		orderParam = "asc"
	}

	// Special case: limit=-1 means "get ALL albums" for virtual scrolling
	if limit == -1 {
		slog.Info("Fetching ALL albums for virtual scrolling", "sort", sortParam, "order", orderParam)

		// Try cache first
		var albums []models.Album
		if err := cache.GetAllAlbums(r.Context(), &albums); err == nil {
			slog.Debug("Cache hit for ALL albums")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"albums": albums,
				"total":  len(albums),
				"cached": true,
			})
			return
		}

		// Cache miss, query ALL from database
		orderBy := "al.title" // Default field

		switch sortParam {
		case "title":
			orderBy = "al.title"
		case "artist":
			orderBy = "a.name"
		case "year":
			orderBy = "al.release_date"
		}

		if orderParam == "desc" {
			orderBy += " DESC"
		} else {
			orderBy += " ASC"
		}

		query := fmt.Sprintf(`
			SELECT 
				al.id, al.title, al.artist_id, al.release_date, al.cover_art, al.genre, al.created_at,
				a.name as artist_name
			FROM albums al
			LEFT JOIN artists a ON al.artist_id = a.id
			ORDER BY %s
		`, orderBy)

		rows, err := database.DB.Query(r.Context(), query)
		if err != nil {
			slog.Error("Failed to query ALL albums", "error", err)
			http.Error(w, fmt.Sprintf("Query error: %v", err), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		albums, err = pgx.CollectRows(rows, pgx.RowToStructByName[models.Album])
		if err != nil {
			slog.Error("Failed to scan ALL albums rows", "error", err)
			http.Error(w, fmt.Sprintf("Row scan error: %v", err), http.StatusInternalServerError)
			return
		}

		// Cache the complete library
		if err := cache.SetAllAlbums(r.Context(), albums); err != nil {
			slog.Warn("Failed to cache ALL albums", "error", err)
		}

		slog.Info("Loaded ALL albums", "count", len(albums))
		json.NewEncoder(w).Encode(map[string]interface{}{
			"albums": albums,
			"total":  len(albums),
			"cached": false,
		})
		return
	}

	// Normal paginated mode
	if limit > 100 {
		limit = 100
	}

	orderBy := "al.title" // Default field

	switch sortParam {
	case "title":
		orderBy = "al.title"
	case "artist":
		orderBy = "a.name"
	case "year":
		orderBy = "al.release_date"
	}

	if orderParam == "desc" {
		orderBy += " DESC"
	} else {
		// Default asc for all except maybe year? but consistent logic is better
		if sortParam != "" || orderParam == "asc" {
			orderBy += " ASC"
		}
	}

	// Ensure we don't end up with just " ASC" if sortParam was empty but default used
	if orderBy == " ASC" || orderBy == " DESC" {
		orderBy = "al.title ASC"
	}

	query := fmt.Sprintf(`
		SELECT 
			al.id, al.title, al.artist_id, al.release_date, al.cover_art, al.genre, al.created_at,
			a.name as artist_name
		FROM albums al
		LEFT JOIN artists a ON al.artist_id = a.id
		ORDER BY %s
		LIMIT $1 OFFSET $2
	`, orderBy)

	rows, err := database.DB.Query(r.Context(), query, limit, offset)
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
		"limit":  limit,
		"offset": offset,
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

	// Try cache first
	if stats, err := cache.GetLibraryStats(r.Context()); err == nil {
		slog.Debug("Cache hit for library stats")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"isScanning": scanner.IsScanning(),
			"stats":      stats,
			"cached":     true,
		})
		return
	}

	// Cache miss, query database
	var trackCount, artistCount, albumCount int

	database.DB.QueryRow(r.Context(), "SELECT count(*) FROM tracks").Scan(&trackCount)
	database.DB.QueryRow(r.Context(), "SELECT count(*) FROM artists").Scan(&artistCount)
	database.DB.QueryRow(r.Context(), "SELECT count(*) FROM albums").Scan(&albumCount)

	stats := map[string]interface{}{
		"tracks":  trackCount,
		"artists": artistCount,
		"albums":  albumCount,
	}

	// Cache the stats
	if err := cache.SetLibraryStats(r.Context(), stats); err != nil {
		slog.Warn("Failed to cache library stats", "error", err)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"isScanning": scanner.IsScanning(),
		"stats":      stats,
		"cached":     false,
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
			t.genre, t.year, t.play_count, t.is_favorite, t.created_at, t.updated_at,
			a.name as artist_name,
			al.title as album_title,
			al.cover_art as album_cover_art
		FROM tracks t
		LEFT JOIN artists a ON t.artist_id = a.id
		LEFT JOIN albums al ON t.album_id = al.id
		WHERE t.artist_id = $1
		ORDER BY al.release_date DESC, t.track_number ASC
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
			t.genre, t.year, t.play_count, t.is_favorite, t.created_at, t.updated_at,
			a.name as artist_name,
			al.title as album_title,
			al.cover_art as album_cover_art
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

// GetAlphabetIndex returns the offset for each letter in the alphabet for a given type (tracks, artists, albums)
func GetAlphabetIndex(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	entityType := r.URL.Query().Get("type") // tracks, artists, albums
	if entityType == "" {
		entityType = "tracks"
	}

	var query string
	switch entityType {
	case "tracks":
		query = `
			WITH Ordered AS (
				SELECT 
					upper(substring(title, 1, 1)) as letter, 
					ROW_NUMBER() OVER (ORDER BY title ASC) - 1 as row_num 
				FROM tracks
			)
			SELECT letter, min(row_num) as offset 
			FROM Ordered 
			GROUP BY letter 
			ORDER BY letter
		`
	case "artists":
		query = `
			WITH Ordered AS (
				SELECT 
					upper(substring(name, 1, 1)) as letter, 
					ROW_NUMBER() OVER (ORDER BY name ASC) - 1 as row_num 
				FROM artists
			)
			SELECT letter, min(row_num) as offset 
			FROM Ordered 
			GROUP BY letter 
			ORDER BY letter
		`
	case "albums":
		query = `
			WITH Ordered AS (
				SELECT 
					upper(substring(title, 1, 1)) as letter, 
					ROW_NUMBER() OVER (ORDER BY title ASC) - 1 as row_num 
				FROM albums
			)
			SELECT letter, min(row_num) as offset 
			FROM Ordered 
			GROUP BY letter 
			ORDER BY letter
		`
	default:
		http.Error(w, "Invalid type", http.StatusBadRequest)
		return
	}

	rows, err := database.DB.Query(r.Context(), query)
	if err != nil {
		slog.Error("Failed to query alphabet index", "error", err, "type", entityType)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	index := make(map[string]int)
	for rows.Next() {
		var letter string
		var offset int
		if err := rows.Scan(&letter, &offset); err != nil {
			continue
		}
		index[letter] = offset
	}

	json.NewEncoder(w).Encode(index)
}
