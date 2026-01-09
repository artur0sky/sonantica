package postgres

import (
	"context"
	"sonantica-core/library/domain/entities"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ArtistRepositoryImpl struct {
	db *pgxpool.Pool
}

func NewArtistRepositoryImpl(db *pgxpool.Pool) *ArtistRepositoryImpl {
	return &ArtistRepositoryImpl{db: db}
}

func (r *ArtistRepositoryImpl) FindAll(ctx context.Context, filters entities.LibraryFilters) ([]*entities.Artist, int, error) {
	baseQuery := `
		SELECT 
			id, name, bio, cover_art, created_at, 
			(SELECT count(*) FROM tracks WHERE artist_id = artists.id) as track_count 
		FROM artists
	`

	qb := NewQueryBuilder(baseQuery)

	if filters.Search != "" {
		qb.Where("name ILIKE $", "%"+filters.Search+"%")
	}

	orderBy := "name ASC"
	if filters.Sort == "name" {
		orderBy = "name " + filters.Order
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

	artists, err := pgx.CollectRows(rows, pgx.RowToStructByNameLax[*entities.Artist])
	if err != nil {
		return nil, 0, err
	}

	var total int
	err = r.db.QueryRow(ctx, "SELECT count(*) FROM artists").Scan(&total)

	return artists, total, err
}

func (r *ArtistRepositoryImpl) FindByID(ctx context.Context, id uuid.UUID) (*entities.Artist, error) {
	query := `
		SELECT id, name, bio, cover_art, created_at, 
		(SELECT count(*) FROM tracks WHERE artist_id = artists.id) as track_count 
		FROM artists WHERE id = $1
	`
	rows, err := r.db.Query(ctx, query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	artist, err := pgx.CollectOneRow(rows, pgx.RowToStructByNameLax[*entities.Artist])
	return artist, err
}

func (r *ArtistRepositoryImpl) Upsert(ctx context.Context, artist *entities.Artist) error {
	return nil // To be implemented if needed
}

func (r *ArtistRepositoryImpl) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM artists WHERE id = $1", id)
	return err
}
