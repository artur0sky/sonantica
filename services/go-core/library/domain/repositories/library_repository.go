package repositories

import (
	"context"
	"sonantica-core/library/domain/entities"

	"github.com/google/uuid"
)

// TrackRepository defines the interface for track data persistence
type TrackRepository interface {
	FindAll(ctx context.Context, filters entities.LibraryFilters) ([]*entities.Track, int, error)
	FindByID(ctx context.Context, id uuid.UUID) (*entities.Track, error)
	FindByArtist(ctx context.Context, artistID uuid.UUID, filters entities.LibraryFilters) ([]*entities.Track, error)
	FindByAlbum(ctx context.Context, albumID uuid.UUID, filters entities.LibraryFilters) ([]*entities.Track, error)
	Upsert(ctx context.Context, track *entities.Track) error
	Delete(ctx context.Context, id uuid.UUID) error
}

// ArtistRepository defines the interface for artist data persistence
type ArtistRepository interface {
	FindAll(ctx context.Context, filters entities.LibraryFilters) ([]*entities.Artist, int, error)
	FindByID(ctx context.Context, id uuid.UUID) (*entities.Artist, error)
	Upsert(ctx context.Context, artist *entities.Artist) error
	Delete(ctx context.Context, id uuid.UUID) error
}

// AlbumRepository defines the interface for album data persistence
type AlbumRepository interface {
	FindAll(ctx context.Context, filters entities.LibraryFilters) ([]*entities.Album, int, error)
	FindByID(ctx context.Context, id uuid.UUID) (*entities.Album, error)
	FindByArtist(ctx context.Context, artistID uuid.UUID, filters entities.LibraryFilters) ([]*entities.Album, error)
	Upsert(ctx context.Context, album *entities.Album) error
	Delete(ctx context.Context, id uuid.UUID) error
}
