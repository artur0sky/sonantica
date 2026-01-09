package handlers

import (
	"encoding/json"
	"net/http"
	"sonantica-core/analytics/application/dto"
	"sonantica-core/analytics/application/usecases"
)

// EventHandler handles HTTP requests related to analytics events
type EventHandler struct {
	ingestUseCase *usecases.IngestEventUseCase
}

// NewEventHandler creates a new EventHandler
func NewEventHandler(ingestUseCase *usecases.IngestEventUseCase) *EventHandler {
	return &EventHandler{
		ingestUseCase: ingestUseCase,
	}
}

// IngestEvent handles single event ingestion
func (h *EventHandler) IngestEvent(w http.ResponseWriter, r *http.Request) {
	var input dto.EventDTO
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	response, err := h.ingestUseCase.ExecuteIngestSingle(r.Context(), input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// IngestEventBatch handles batch event ingestion
func (h *EventHandler) IngestEventBatch(w http.ResponseWriter, r *http.Request) {
	var input dto.EventBatchDTO
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	response, err := h.ingestUseCase.ExecuteIngestBatch(r.Context(), input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
