package models

import (
	"time"

	"github.com/google/uuid"
)

type PlaylistType string

const (
	PlaylistTypeManual          PlaylistType = "MANUAL"
	PlaylistTypeSmart           PlaylistType = "SMART"
	PlaylistTypeGenerated       PlaylistType = "GENERATED"
	PlaylistTypeHistorySnapshot PlaylistType = "HISTORY_SNAPSHOT"
)

type Playlist struct {
	ID           uuid.UUID    `json:"id" db:"id"`
	Name         string       `json:"name" db:"name"`
	Type         PlaylistType `json:"type" db:"type"`
	Description  *string      `json:"description" db:"description"`
	CreatedAt    time.Time    `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time    `json:"updatedAt" db:"updated_at"`
	SnapshotDate *time.Time   `json:"snapshotDate,omitempty" db:"snapshot_date"`
	Rules        *string      `json:"rules,omitempty" db:"rules"` // Stored as JSON string

	// Enriched fields
	TrackCount int         `json:"trackCount,omitempty"`
	CoverArts  []string    `json:"coverArts,omitempty"` // First 4 covers for the grid
	Tracks     []Track     `json:"tracks,omitempty"`    // List of tracks in the playlist
	TrackIDs   []uuid.UUID `json:"trackIds,omitempty"`  // List of track IDs for compatibility
}

type PlaylistTrack struct {
	PlaylistID uuid.UUID `json:"playlistId" db:"playlist_id"`
	TrackID    uuid.UUID `json:"trackId" db:"track_id"`
	Position   int       `json:"position" db:"position"`
	AddedAt    time.Time `json:"addedAt" db:"added_at"`
}
