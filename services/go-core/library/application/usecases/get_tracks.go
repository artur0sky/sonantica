package usecases

import (
	"context"
	"fmt"
	"sonantica-core/library/application/dto"
	"sonantica-core/library/domain/entities"
	"sonantica-core/library/domain/repositories"
	"time"
)

type GetTracksUseCase struct {
	trackRepo repositories.TrackRepository
	cacheRepo repositories.LibraryCacheRepository
}

func NewGetTracksUseCase(tr repositories.TrackRepository, cr repositories.LibraryCacheRepository) *GetTracksUseCase {
	return &GetTracksUseCase{trackRepo: tr, cacheRepo: cr}
}

func (uc *GetTracksUseCase) Execute(ctx context.Context, filters entities.LibraryFilters) (*dto.TrackListDTO, error) {
	// 1. Try Cache
	cacheKey := fmt.Sprintf("tracks:%d:%d:%s:%s:%s", filters.Offset, filters.Limit, filters.Sort, filters.Order, filters.Search)
	if filters.ArtistID != nil {
		cacheKey += ":" + filters.ArtistID.String()
	}
	if filters.AlbumID != nil {
		cacheKey += ":" + filters.AlbumID.String()
	}

	var cachedTracks []*entities.Track
	if err := uc.cacheRepo.Get(ctx, cacheKey, &cachedTracks); err == nil {
		return &dto.TrackListDTO{
			Tracks: cachedTracks,
			PaginatedResponse: dto.PaginatedResponse{
				Limit:  filters.Limit,
				Offset: filters.Offset,
				Cached: true,
			},
		}, nil
	}

	// 2. Query Repository
	tracks, total, err := uc.trackRepo.FindAll(ctx, filters)
	if err != nil {
		return nil, err
	}

	// 3. Set Cache (e.g., 1 hour)
	_ = uc.cacheRepo.Set(ctx, cacheKey, tracks, time.Hour)

	return &dto.TrackListDTO{
		Tracks: tracks,
		PaginatedResponse: dto.PaginatedResponse{
			Total:  total,
			Limit:  filters.Limit,
			Offset: filters.Offset,
			Cached: false,
		},
	}, nil
}
