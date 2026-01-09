package dto

import (
	"sonantica-core/library/domain/entities"
)

type PaginatedResponse struct {
	Total  int  `json:"total"`
	Limit  int  `json:"limit"`
	Offset int  `json:"offset"`
	Cached bool `json:"cached"`
}

type TrackListDTO struct {
	Tracks []*entities.Track `json:"tracks"`
	PaginatedResponse
}

type ArtistListDTO struct {
	Artists []*entities.Artist `json:"artists"`
	PaginatedResponse
}

type AlbumListDTO struct {
	Albums []*entities.Album `json:"albums"`
	PaginatedResponse
}

type LibraryFiltersDTO struct {
	Limit  int    `json:"limit"`
	Offset int    `json:"offset"`
	Sort   string `json:"sort"`
	Order  string `json:"order"`
	Search string `json:"search"`
}

func (d LibraryFiltersDTO) ToDomain() entities.LibraryFilters {
	return entities.LibraryFilters{
		Limit:  d.Limit,
		Offset: d.Offset,
		Sort:   d.Sort,
		Order:  d.Order,
		Search: d.Search,
	}
}
