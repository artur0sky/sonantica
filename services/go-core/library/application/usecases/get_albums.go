package usecases

import (
	"context"
	"fmt"
	"sonantica-core/library/application/dto"
	"sonantica-core/library/domain/entities"
	"sonantica-core/library/domain/repositories"
	"time"
)

type GetAlbumsUseCase struct {
	albumRepo repositories.AlbumRepository
	cacheRepo repositories.LibraryCacheRepository
}

func NewGetAlbumsUseCase(ar repositories.AlbumRepository, cr repositories.LibraryCacheRepository) *GetAlbumsUseCase {
	return &GetAlbumsUseCase{albumRepo: ar, cacheRepo: cr}
}

func (uc *GetAlbumsUseCase) Execute(ctx context.Context, filters entities.LibraryFilters) (*dto.AlbumListDTO, error) {
	cacheKey := fmt.Sprintf("albums:%d:%d:%s:%s:%s", filters.Offset, filters.Limit, filters.Sort, filters.Order, filters.Search)
	if filters.ArtistID != nil {
		cacheKey += ":" + filters.ArtistID.String()
	}

	var cachedAlbums []*entities.Album
	if err := uc.cacheRepo.Get(ctx, cacheKey, &cachedAlbums); err == nil {
		return &dto.AlbumListDTO{
			Albums: cachedAlbums,
			PaginatedResponse: dto.PaginatedResponse{
				Limit:  filters.Limit,
				Offset: filters.Offset,
				Cached: true,
			},
		}, nil
	}

	albums, total, err := uc.albumRepo.FindAll(ctx, filters)
	if err != nil {
		return nil, err
	}

	_ = uc.cacheRepo.Set(ctx, cacheKey, albums, time.Hour)

	return &dto.AlbumListDTO{
		Albums: albums,
		PaginatedResponse: dto.PaginatedResponse{
			Total:  total,
			Limit:  filters.Limit,
			Offset: filters.Offset,
			Cached: false,
		},
	}, nil
}
