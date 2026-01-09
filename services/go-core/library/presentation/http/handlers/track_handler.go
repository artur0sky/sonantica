package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sonantica-core/library/application/usecases"
	"sonantica-core/library/domain/entities"
)

type TrackHandler struct {
	getTracksUseCase *usecases.GetTracksUseCase
}

func NewTrackHandler(uc *usecases.GetTracksUseCase) *TrackHandler {
	return &TrackHandler{getTracksUseCase: uc}
}

func (h *TrackHandler) GetTracks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	limit := 50
	offset := 0

	if l := r.URL.Query().Get("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		fmt.Sscanf(o, "%d", &offset)
	}

	filters := entities.LibraryFilters{
		Limit:  limit,
		Offset: offset,
		Sort:   r.URL.Query().Get("sort"),
		Order:  r.URL.Query().Get("order"),
		Search: r.URL.Query().Get("search"),
	}

	if filters.Order == "" {
		filters.Order = "asc"
	}

	response, err := h.getTracksUseCase.Execute(r.Context(), filters)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(response)
}
