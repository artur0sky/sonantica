package handlers

import (
	"encoding/json"
	"net/http"
	"sonantica-core/analytics/application/dto"
	"sonantica-core/analytics/application/usecases"
	"strconv"
)

// DashboardHandler handles HTTP requests for dashboard metrics
type DashboardHandler struct {
	dashboardUseCase *usecases.GetDashboardUseCase
	realtimeUseCase  *usecases.GetRealtimeStatsUseCase
}

// NewDashboardHandler creates a new DashboardHandler
func NewDashboardHandler(
	dashboardUseCase *usecases.GetDashboardUseCase,
	realtimeUseCase *usecases.GetRealtimeStatsUseCase,
) *DashboardHandler {
	return &DashboardHandler{
		dashboardUseCase: dashboardUseCase,
		realtimeUseCase:  realtimeUseCase,
	}
}

// GetDashboard returns aggregated metrics for the dashboard
func (h *DashboardHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	// Simple parsing of common filters from query string
	// In a full implementation, we might use a helper to map all query params to the DTO
	req := dto.DashboardRequestDTO{
		Limit: 20,
	}

	response, err := h.dashboardUseCase.Execute(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetRealtimeStats returns live status from cache
func (h *DashboardHandler) GetRealtimeStats(w http.ResponseWriter, r *http.Request) {
	minutesStr := r.URL.Query().Get("minutes")
	minutes := 30
	if m, err := strconv.Atoi(minutesStr); err == nil {
		minutes = m
	}

	response, err := h.realtimeUseCase.Execute(r.Context(), minutes)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
