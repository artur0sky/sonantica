package mappers

import (
	"sonantica-core/analytics/application/dto"
	"sonantica-core/analytics/domain/repositories"
	"time"
)

// MapDashboardRequestToFilters converts a DTO request to Domain QueryFilters
func MapDashboardRequestToFilters(d dto.DashboardRequestDTO) *repositories.QueryFilters {
	filters := &repositories.QueryFilters{
		Period:   d.Period,
		Platform: d.Platform,
		Genre:    d.Genre,
		ArtistID: d.ArtistID,
		AlbumID:  d.AlbumID,
		GroupBy:  d.GroupBy,
		Limit:    d.Limit,
		Offset:   d.Offset,
	}

	if d.StartDate != nil {
		if t, err := time.Parse(time.RFC3339, *d.StartDate); err == nil {
			filters.StartDate = &t
		}
	}

	if d.EndDate != nil {
		if t, err := time.Parse(time.RFC3339, *d.EndDate); err == nil {
			filters.EndDate = &t
		}
	}

	return filters
}
