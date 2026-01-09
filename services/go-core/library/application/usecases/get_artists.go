package usecases

import (
	"context"
	"fmt"
	"sonantica-core/library/application/dto"
	"sonantica-core/library/domain/entities"
	"sonantica-core/library/domain/repositories"
	"time"
)

type GetArtistsUseCase struct {
	artistRepo repositories.ArtistRepository
	cacheRepo  repositories.LibraryCacheRepository
}

func NewGetArtistsUseCase(ar repositories.ArtistRepository, cr repositories.LibraryCacheRepository) *GetArtistsUseCase {
	return &GetArtistsUseCase{artistRepo: ar, cacheRepo: cr}
}

func (uc *GetArtistsUseCase) Execute(ctx context.Context, filters entities.LibraryFilters) (*dto.ArtistListDTO, error) {
	cacheKey := fmt.Sprintf("artists:%d:%d:%s:%s:%s", filters.Offset, filters.Limit, filters.Sort, filters.Order, filters.Search)

	var cachedArtists []*entities.Artist
	if err := uc.cacheRepo.Get(ctx, cacheKey, &cachedArtists); err == nil {
		return &dto.ArtistListDTO{
			Artists: cachedArtists,
			PaginatedResponse: dto.PaginatedResponse{
				Limit:  filters.Limit,
				Offset: filters.Offset,
				Cached: true,
			},
		}, nil
	}

	artists, total, err := uc.artistRepo.FindAll(ctx, filters)
	if err != nil {
		return nil, err
	}

	_ = uc.cacheRepo.Set(ctx, cacheKey, artists, time.Hour)

	return &dto.ArtistListDTO{
		Artists: artists,
		PaginatedResponse: dto.PaginatedResponse{
			Total:  total,
			Limit:  filters.Limit,
			Offset: filters.Offset,
			Cached: false,
		},
	}, nil
}
