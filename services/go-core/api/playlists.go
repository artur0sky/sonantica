package api

import (
	"encoding/json"
	"log"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"sonantica-core/cache"
	"sonantica-core/database"
	"sonantica-core/models"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// CreatePlaylistRequest payload
type CreatePlaylistRequest struct {
	Name        string   `json:"name"`
	Type        string   `json:"type"`
	Description string   `json:"description"`
	TrackIDs    []string `json:"trackIds"`
}

// CreatePlaylist creates a new playlist
func CreatePlaylist(w http.ResponseWriter, r *http.Request) {
	var req CreatePlaylistRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	playlistID := uuid.New()
	now := time.Now()

	// Log incoming request
	log.Printf("[CreatePlaylist] Creating playlist: name=%s, type=%s, trackCount=%d", req.Name, req.Type, len(req.TrackIDs))

	// 1. Insert Playlist
	_, err := database.DB.Exec(r.Context(), `
		INSERT INTO playlists (id, name, type, description, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, playlistID, req.Name, req.Type, req.Description, now, now)

	if err != nil {
		log.Printf("[CreatePlaylist] Failed to insert playlist: %v", err)
		http.Error(w, "Failed to create playlist: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 2. Insert Tracks if provided
	insertedTracks := 0
	if len(req.TrackIDs) > 0 {
		for i, trackIDStr := range req.TrackIDs {
			// Parse track ID as UUID
			trackID, err := uuid.Parse(trackIDStr)
			if err != nil {
				log.Printf("[CreatePlaylist] Invalid track UUID at position %d: %s (error: %v)", i, trackIDStr, err)
				continue
			}

			// Insert track into playlist
			_, err = database.DB.Exec(r.Context(), `
				INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
				VALUES ($1, $2, $3, $4)
				ON CONFLICT (playlist_id, track_id) DO NOTHING
			`, playlistID, trackID, i, now)

			if err != nil {
				log.Printf("[CreatePlaylist] Failed to insert track %s at position %d: %v", trackID, i, err)
			} else {
				insertedTracks++
			}
		}
	}

	log.Printf("[CreatePlaylist] Playlist created successfully: id=%s, insertedTracks=%d/%d", playlistID, insertedTracks, len(req.TrackIDs))

	// Return created playlist
	trackUUIDs := []uuid.UUID{}
	for _, tid := range req.TrackIDs {
		if u, err := uuid.Parse(tid); err == nil {
			trackUUIDs = append(trackUUIDs, u)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.Playlist{
		ID:          playlistID,
		Name:        req.Name,
		Type:        models.PlaylistType(req.Type),
		Description: &req.Description,
		CreatedAt:   now,
		UpdatedAt:   now,
		TrackCount:  insertedTracks,
		TrackIDs:    trackUUIDs,
	})

	// Invalidate cache after everything is done to avoid partial caching
	_ = cache.InvalidatePlaylistCache(r.Context())
}

// GetPlaylists returns all playlists matching filter
func GetPlaylists(w http.ResponseWriter, r *http.Request) {
	playlistType := r.URL.Query().Get("type")
	w.Header().Set("Content-Type", "application/json")

	// Try cache first
	var playlists []models.Playlist
	if err := cache.GetAllPlaylists(r.Context(), playlistType, &playlists); err == nil {
		slog.Debug("Playlist cache hit")
		json.NewEncoder(w).Encode(map[string]interface{}{"playlists": playlists, "cached": true})
		return
	}

	// Optimized query to get playlists with track counts and covers art in one go
	query := `
		SELECT 
			p.id, p.name, p.type, p.description, p.created_at, p.updated_at, p.snapshot_date,
			(SELECT count(*) FROM playlist_tracks WHERE playlist_id = p.id) as track_count,
			COALESCE((
				SELECT string_agg('/api/cover/' || al.cover_art, ',')
				FROM (
					SELECT DISTINCT al2.cover_art
					FROM playlist_tracks pt2
					JOIN tracks t2 ON pt2.track_id = t2.id
					JOIN albums al2 ON t2.album_id = al2.id
					WHERE pt2.playlist_id = p.id AND al2.cover_art IS NOT NULL
					LIMIT 4
				) al
			), '') as cover_arts,
			COALESCE((
				SELECT string_agg(track_id::text, ',')
				FROM (
					SELECT track_id
					FROM playlist_tracks
					WHERE playlist_id = p.id
					ORDER BY position ASC
				) t_ids
			), '') as track_ids
		FROM playlists p
	`
	var args []interface{}

	if playlistType != "" {
		query += ` WHERE p.type = $1`
		args = append(args, playlistType)
	}

	query += ` ORDER BY p.updated_at DESC`

	rows, err := database.DB.Query(r.Context(), query, args...)
	if err != nil {
		slog.Error("Failed to fetch playlists", "error", err)
		http.Error(w, "Failed to fetch playlists", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	playlists = []models.Playlist{}
	for rows.Next() {
		var p models.Playlist
		var snapshotDate *time.Time
		var typeStr string
		var coverArtsStr string
		var trackIDsStr string

		err := rows.Scan(
			&p.ID, &p.Name, &typeStr, &p.Description, &p.CreatedAt, &p.UpdatedAt, &snapshotDate,
			&p.TrackCount, &coverArtsStr, &trackIDsStr,
		)
		if err != nil {
			slog.Error("Scan error in GetPlaylists", "error", err)
			continue
		}
		p.Type = models.PlaylistType(typeStr)
		p.SnapshotDate = snapshotDate

		if coverArtsStr != "" {
			p.CoverArts = strings.Split(coverArtsStr, ",")
		} else {
			p.CoverArts = []string{}
		}

		if trackIDsStr != "" {
			idStrings := strings.Split(trackIDsStr, ",")
			p.TrackIDs = make([]uuid.UUID, 0, len(idStrings))
			for _, idStr := range idStrings {
				if uid, err := uuid.Parse(idStr); err == nil {
					p.TrackIDs = append(p.TrackIDs, uid)
				}
			}
		} else {
			p.TrackIDs = []uuid.UUID{}
		}

		playlists = append(playlists, p)
	}

	// Cache the result
	if err := cache.SetAllPlaylists(r.Context(), playlistType, playlists); err != nil {
		slog.Warn("Failed to cache playlists", "error", err)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{"playlists": playlists, "cached": false})
}

// GetPlaylist returns a single playlist with tracks
func GetPlaylist(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	w.Header().Set("Content-Type", "application/json")

	// Try cache
	var cachedP models.Playlist
	if err := cache.GetPlaylist(r.Context(), idStr, &cachedP); err == nil {
		slog.Debug("Playlist detail cache hit", "id", idStr)
		json.NewEncoder(w).Encode(cachedP)
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var p models.Playlist
	var typeStr string
	err = database.DB.QueryRow(r.Context(), `
		SELECT id, name, type, description, created_at, updated_at 
		FROM playlists WHERE id = $1
	`, id).Scan(&p.ID, &p.Name, &typeStr, &p.Description, &p.CreatedAt, &p.UpdatedAt)

	if err != nil {
		http.Error(w, "Playlist not found", http.StatusNotFound)
		return
	}
	p.Type = models.PlaylistType(typeStr)
	var count int
	_ = database.DB.QueryRow(r.Context(), "SELECT count(*) FROM playlist_tracks WHERE playlist_id = $1", p.ID).Scan(&count)
	p.TrackCount = count
	p.Tracks = []models.Track{}
	p.TrackIDs = []uuid.UUID{}

	// Fetch tracks
	query := `
		SELECT 
			t.id, t.title, t.album_id, t.artist_id, t.file_path, t.duration_seconds, 
			t.format, t.bitrate, t.sample_rate, t.channels, t.track_number, t.disc_number, 
			t.genre, t.year, t.play_count, t.is_favorite, t.created_at, t.updated_at,
			a.name as artist_name,
			al.title as album_title,
			al.cover_art as album_cover_art
		FROM playlist_tracks pt
		JOIN tracks t ON pt.track_id = t.id
		LEFT JOIN artists a ON t.artist_id = a.id
		LEFT JOIN albums al ON t.album_id = al.id
		WHERE pt.playlist_id = $1
		ORDER BY pt.position ASC
	`

	rows, err := database.DB.Query(r.Context(), query, p.ID)
	if err != nil {
		log.Printf("[GetPlaylist] Failed to query tracks: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var t models.Track
			err := rows.Scan(
				&t.ID, &t.Title, &t.AlbumID, &t.ArtistID, &t.FilePath, &t.DurationSeconds,
				&t.Format, &t.Bitrate, &t.SampleRate, &t.Channels, &t.TrackNumber, &t.DiscNumber,
				&t.Genre, &t.Year, &t.PlayCount, &t.IsFavorite, &t.CreatedAt, &t.UpdatedAt,
				&t.ArtistName, &t.AlbumTitle, &t.AlbumCoverArt,
			)
			if err != nil {
				log.Printf("[GetPlaylist] Failed to scan track: %v", err)
				continue
			}
			p.Tracks = append(p.Tracks, t)
			p.TrackIDs = append(p.TrackIDs, t.ID)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	// Cache the result
	if err := cache.SetPlaylist(r.Context(), idStr, p); err != nil {
		slog.Warn("Failed to cache playlist detail", "error", err)
	}

	json.NewEncoder(w).Encode(p)
}

// DeletePlaylist deletes a playlist
func DeletePlaylist(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	_, err = database.DB.Exec(r.Context(), "DELETE FROM playlists WHERE id = $1", id)
	if err != nil {
		http.Error(w, "Failed to delete playlist", http.StatusInternalServerError)
		return
	}

	// Invalidate cache
	_ = cache.InvalidatePlaylistCache(r.Context())

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

// AddTracksToPlaylist adds tracks
func AddTracksToPlaylist(w http.ResponseWriter, r *http.Request) {
	// Similar implementation to Create but appending to playlist_tracks
	// ...
}
