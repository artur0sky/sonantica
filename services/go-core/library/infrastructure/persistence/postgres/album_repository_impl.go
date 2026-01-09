package postgres

import (
	"context"
	"sonantica-core/library/domain/entities"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AlbumRepositoryImpl struct {
	db *pgxpool.Pool
}

func NewAlbumRepositoryImpl(db *pgxpool.Pool) *AlbumRepositoryImpl {
	return &AlbumRepositoryImpl{db: db}
}

func (r *AlbumRepositoryImpl) FindAll(ctx context.Context, filters entities.LibraryFilters) ([]*entities.Album, int, error) {
	baseQuery := `
		SELECT 
			al.id, al.title, al.artist_id, al.release_date::TEXT, al.cover_art, al.genre, al.created_at,
			a.name as artist_name,
			(SELECT count(*) FROM tracks WHERE album_id = al.id) as track_count
		FROM albums al
		LEFT JOIN artists a ON al.artist_id = a.id
	`

	qb := NewQueryBuilder(baseQuery)

	if filters.ArtistID != nil {
		qb.Where("al.artist_id = $", *filters.ArtistID)
	}

	if filters.Search != "" {
		qb.Where("al.title ILIKE $", "%"+filters.Search+"%")
	}

	orderBy := "al.title ASC"
	switch filters.Sort {
	case "title":
		orderBy = "al.title " + filters.Order
	case "artist":
		orderBy = "a.name " + filters.Order
	case "year":
		orderBy = "al.release_date " + filters.Order
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

	albums, err := pgx.CollectRows(rows, pgx.RowToStructByNameLax[*entities.Album])
	if err != nil {
		return nil, 0, err
	}

	var total int
	err = r.db.QueryRow(ctx, "SELECT count(*) FROM albums").Scan(&total)

	return albums, total, err
}

func (r *AlbumRepositoryImpl) FindByID(ctx context.Context, id uuid.UUID) (*entities.Album, error) {
	query := `
		SELECT 
			al.id, al.title, al.artist_id, al.release_date::TEXT, al.cover_art, al.genre, al.created_at,
			a.name as artist_name,
			(SELECT count(*) FROM tracks WHERE album_id = al.id) as track_count
		FROM albums al
		LEFT JOIN artists a ON al.artist_id = a.id
		WHERE al.id = $1
	`
	rows, err := r.db.Query(ctx, query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	album, err := pgx.CollectOneRow(rows, pgx.RowToStructByNameLax[*entities.Album])
	return album, err
}

func (r *AlbumRepositoryImpl) FindByArtist(ctx context.Context, artistID uuid.UUID, filters entities.LibraryFilters) ([]*entities.Album, error) {
	filters.ArtistID = &artistID
	albums, _, err := r.FindAll(ctx, filters)
	return albums, err
}

func (r *AlbumRepositoryImpl) Upsert(ctx context.Context, album *entities.Album) error {
	return nil
}

func (r *AlbumRepositoryImpl) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM albums WHERE id = $1", id)
	return err
}
