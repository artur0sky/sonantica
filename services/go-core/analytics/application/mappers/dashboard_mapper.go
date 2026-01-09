package mappers

import (
	"sonantica-core/analytics/application/dto"
	"sonantica-core/analytics/domain/entities"
	"time"
)

// MapMetricsToDTO converts domain metrics to DashboardMetricsDTO
func MapMetricsToDTO(m *entities.Metrics) dto.DashboardMetricsDTO {
	return dto.DashboardMetricsDTO{
		StartDate: m.StartDate.Format(time.RFC3339),
		EndDate:   m.EndDate.Format(time.RFC3339),
		Overview: dto.OverviewStatsDTO{
			TotalPlays:              m.TotalPlays,
			TotalPlayTime:           m.TotalPlayTime,
			AverageSessionDuration:  m.AverageSessionDuration,
			CompletionRate:          m.CompletionRate,
			UniqueTracks:            m.UniqueTracks,
			UniqueAlbums:            m.UniqueAlbums,
			UniqueArtists:           m.UniqueArtists,
			TotalSessions:           m.TotalSessions,
			AverageTracksPerSession: m.AverageTracksPerSession,
			SkipRate:                m.SkipRate,
			PlaysChange:             m.PlaysChange,
			PlayTimeChange:          m.PlayTimeChange,
			SessionsChange:          m.SessionsChange,
		},
	}
}

// MapTrackMetricsToDTOs converts a slice of domain track metrics to DTOs
func MapTrackMetricsToDTOs(tracks []*entities.TrackMetrics) []dto.TopTrackDTO {
	dtos := make([]dto.TopTrackDTO, len(tracks))
	for i, t := range tracks {
		lastPlayed := ""
		if t.LastPlayedAt != nil {
			lastPlayed = t.LastPlayedAt.Format(time.RFC3339)
		}

		dtos[i] = dto.TopTrackDTO{
			TrackID:        t.TrackID,
			PlayCount:      t.PlayCount,
			PlayTime:       t.TotalPlayTime,
			CompletionRate: t.AverageCompletion,
			LastPlayed:     lastPlayed,
			Rank:           i + 1,
		}
	}
	return dtos
}

// MapArtistMetricsToDTOs converts domain artist metrics to DTOs
func MapArtistMetricsToDTOs(artists []*entities.ArtistMetrics) []dto.TopArtistDTO {
	dtos := make([]dto.TopArtistDTO, len(artists))
	for i, a := range artists {
		dtos[i] = dto.TopArtistDTO{
			ArtistID:   a.ArtistID,
			ArtistName: a.ArtistName,
			PlayCount:  a.PlayCount,
			PlayTime:   a.TotalPlayTime,
			Rank:       i + 1,
		}
	}
	return dtos
}

// MapAlbumMetricsToDTOs converts domain album metrics to DTOs
func MapAlbumMetricsToDTOs(albums []*entities.AlbumMetrics) []dto.TopAlbumDTO {
	dtos := make([]dto.TopAlbumDTO, len(albums))
	for i, a := range albums {
		dtos[i] = dto.TopAlbumDTO{
			AlbumID:    a.AlbumID,
			AlbumTitle: a.AlbumTitle,
			ArtistName: a.ArtistName,
			PlayCount:  a.PlayCount,
			PlayTime:   a.TotalPlayTime,
			Rank:       i + 1,
		}
	}
	return dtos
}
