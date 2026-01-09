package models

import (
	"time"

	"github.com/google/uuid"
)

type Track struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	Title           string     `json:"title" db:"title"`
	AlbumID         *uuid.UUID `json:"albumId" db:"album_id"`
	ArtistID        *uuid.UUID `json:"artistId" db:"artist_id"`
	FilePath        string     `json:"filePath" db:"file_path"`
	DurationSeconds float64    `json:"duration" db:"duration_seconds"`
	Format          *string    `json:"format" db:"format"`
	Bitrate         *int       `json:"bitrate" db:"bitrate"`
	SampleRate      *int       `json:"sampleRate" db:"sample_rate"`
	Channels        *int       `json:"channels" db:"channels"`
	TrackNumber     *int       `json:"trackNumber" db:"track_number"`
	DiscNumber      *int       `json:"discNumber" db:"disc_number"`
	Genre           *string    `json:"genre" db:"genre"`
	Year            *int       `json:"year" db:"year"`
	PlayCount       int        `json:"playCount" db:"play_count"`
	IsFavorite      bool       `json:"isFavorite" db:"is_favorite"`
	CreatedAt       time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt       time.Time  `json:"updatedAt" db:"updated_at"`
	// Joined fields for API response
	ArtistName    *string `json:"artist,omitempty" db:"artist_name"`
	AlbumTitle    *string `json:"album,omitempty" db:"album_title"`
	AlbumCoverArt *string `json:"coverArt,omitempty" db:"album_cover_art"`
}

type Album struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Title       string     `json:"title" db:"title"`
	ArtistID    *uuid.UUID `json:"artistId" db:"artist_id"`
	ReleaseDate *string    `json:"releaseDate" db:"release_date"`
	CoverArt    *string    `json:"coverArt" db:"cover_art"`
	Genre       *string    `json:"genre" db:"genre"`
	CreatedAt   time.Time  `json:"createdAt" db:"created_at"`
	// Joined fields
	ArtistName *string `json:"artist,omitempty" db:"artist_name"`
	TrackCount int     `json:"trackCount" db:"track_count"`
}

type Artist struct {
	ID         uuid.UUID `json:"id" db:"id"`
	Name       string    `json:"name" db:"name"`
	Bio        *string   `json:"bio" db:"bio"`
	CoverArt   *string   `json:"coverArt" db:"cover_art"`
	CreatedAt  time.Time `json:"createdAt" db:"created_at"`
	TrackCount int       `json:"trackCount" db:"track_count"`
}
