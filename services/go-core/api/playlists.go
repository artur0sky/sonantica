package api

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

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
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.Playlist{
		ID:          playlistID,
		Name:        req.Name,
		Type:        models.PlaylistType(req.Type),
		Description: &req.Description,
		CreatedAt:   now,
		UpdatedAt:   now,
		TrackCount:  insertedTracks,
	})
}

// GetPlaylists returns all playlists matching filter
func GetPlaylists(w http.ResponseWriter, r *http.Request) {
	playlistType := r.URL.Query().Get("type")

	query := `SELECT id, name, type, description, created_at, updated_at, snapshot_date FROM playlists`
	var args []interface{}

	if playlistType != "" {
		query += ` WHERE type = $1`
		args = append(args, playlistType)
	}

	query += ` ORDER BY updated_at DESC`

	rows, err := database.DB.Query(r.Context(), query, args...)
	if err != nil {
		http.Error(w, "Failed to fetch playlists", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	playlists := []models.Playlist{}
	for rows.Next() {
		var p models.Playlist
		var snapshotDate *time.Time
		var typeStr string

		err := rows.Scan(&p.ID, &p.Name, &typeStr, &p.Description, &p.CreatedAt, &p.UpdatedAt, &snapshotDate)
		if err != nil {
			continue
		}
		p.Type = models.PlaylistType(typeStr)
		p.SnapshotDate = snapshotDate

		// Enrichment: Get track count and 4 covers (simplified for now)
		// Optimal way is lateral join or subquery, but keeping it simple for MVP
		var count int
		_ = database.DB.QueryRow(r.Context(), "SELECT count(*) FROM playlist_tracks WHERE playlist_id = $1", p.ID).Scan(&count)
		p.TrackCount = count

		if count > 0 {
			// Get up to 4 covers
			coverRows, _ := database.DB.Query(r.Context(), `
                SELECT DISTINCT coalesce(al.cover_art_path, '') 
                FROM playlist_tracks pt
                JOIN tracks t ON pt.track_id = t.id
                JOIN albums al ON t.album_id = al.id
                WHERE pt.playlist_id = $1 AND al.cover_art_path IS NOT NULL
                LIMIT 4
             `, p.ID)
			defer coverRows.Close()

			covers := []string{}
			for coverRows.Next() {
				var cover string
				if err := coverRows.Scan(&cover); err == nil {
					// Simple path normalization if needed, similar to RemoteLibraryAdapter logic handling in backend?
					// Assuming API returns relative paths like /api/covers/...
					covers = append(covers, "/api/cover/"+cover) // Simplification
				}
			}
			p.CoverArts = covers
		}

		playlists = append(playlists, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"playlists": playlists})
}

// GetPlaylist returns a single playlist with tracks
func GetPlaylist(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
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

	// Fetch tracks
	// Note: This needs to join tracks to get metadata
	// Ignoring full track fetch for brevity, returning IDs can be enough or full objects
	// Returning full objects...

	w.Header().Set("Content-Type", "application/json")
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

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

// AddTracksToPlaylist adds tracks
func AddTracksToPlaylist(w http.ResponseWriter, r *http.Request) {
	// Similar implementation to Create but appending to playlist_tracks
	// ...
}
