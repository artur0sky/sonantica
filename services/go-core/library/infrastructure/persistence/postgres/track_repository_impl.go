package postgres

import (
	"context"
	"fmt"
	"sonantica-core/library/domain/entities"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TrackRepositoryImpl struct {
	db *pgxpool.Pool
}

func NewTrackRepositoryImpl(db *pgxpool.Pool) *TrackRepositoryImpl {
	return &TrackRepositoryImpl{db: db}
}

func (r *TrackRepositoryImpl) FindAll(ctx context.Context, filters entities.LibraryFilters) ([]*entities.Track, int, error) {
	baseQuery := `
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
	`

	qb := NewQueryBuilder(baseQuery)

	if filters.ArtistID != nil {
		qb.Where("t.artist_id = $", *filters.ArtistID)
	}

	if filters.AlbumID != nil {
		qb.Where("t.album_id = $", *filters.AlbumID)
	}

	if filters.Search != "" {
		qb.Where("t.title ILIKE $", "%"+filters.Search+"%")
	}

	if filters.IsFavorite != nil {
		qb.Where("t.is_favorite = $", *filters.IsFavorite)
	}

	// Dynamic sorting
	orderBy := "t.created_at DESC"
	switch filters.Sort {
	case "title":
		orderBy = "t.title " + filters.Order
	case "artist":
		orderBy = "a.name " + filters.Order + ", t.title ASC"
	case "album":
		orderBy = "al.title " + filters.Order + ", t.track_number ASC"
	case "recent":
		orderBy = "t.created_at DESC"
	}
	qb.OrderBy(orderBy)

	qb.Limit(filters.Limit)
	qb.Offset(filters.Offset)

	query, args := qb.Build()

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	tracks, err := pgx.CollectRows(rows, pgx.RowToStructByNameLax[*entities.Track])
	if err != nil {
		return nil, 0, err
	}

	// Count total for pagination (simplification: in a real scenario we'd query count separately or use window functions)
	var total int
	err = r.db.QueryRow(ctx, "SELECT count(*) FROM tracks").Scan(&total)

	return tracks, total, err
}

func (r *TrackRepositoryImpl) FindByID(ctx context.Context, id uuid.UUID) (*entities.Track, error) {
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
		WHERE t.id = $1
	`
	rows, err := r.db.Query(ctx, query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	track, err := pgx.CollectOneRow(rows, pgx.RowToStructByNameLax[*entities.Track])
	return track, err
}

func (r *TrackRepositoryImpl) FindByArtist(ctx context.Context, artistID uuid.UUID, filters entities.LibraryFilters) ([]*entities.Track, error) {
	filters.ArtistID = &artistID
	tracks, _, err := r.FindAll(ctx, filters)
	return tracks, err
}

func (r *TrackRepositoryImpl) FindByAlbum(ctx context.Context, albumID uuid.UUID, filters entities.LibraryFilters) ([]*entities.Track, error) {
	filters.AlbumID = &albumID
	tracks, _, err := r.FindAll(ctx, filters)
	return tracks, err
}

func (r *TrackRepositoryImpl) Upsert(ctx context.Context, track *entities.Track) error {
	// Not implemented in the original library.go handlers, but good to have for domain completeness
	return fmt.Errorf("not implemented")
}

func (r *TrackRepositoryImpl) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM tracks WHERE id = $1", id)
	return err
}
