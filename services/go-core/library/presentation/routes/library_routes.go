package routes

import (
	"sonantica-core/library/presentation/http/handlers"

	"github.com/go-chi/chi/v5"
)

type LibraryRouter struct {
	trackHandler  *handlers.TrackHandler
	artistHandler *handlers.ArtistHandler
	albumHandler  *handlers.AlbumHandler
}

func NewLibraryRouter(th *handlers.TrackHandler, ah *handlers.ArtistHandler, alh *handlers.AlbumHandler) *LibraryRouter {
	return &LibraryRouter{
		trackHandler:  th,
		artistHandler: ah,
		albumHandler:  alh,
	}
}

func (lr *LibraryRouter) RegisterRoutes(r chi.Router) {
	r.Route("/library", func(r chi.Router) {
		r.Get("/tracks", lr.trackHandler.GetTracks)
		r.Get("/artists", lr.artistHandler.GetArtists)
		r.Get("/albums", lr.albumHandler.GetAlbums)
	})
}
