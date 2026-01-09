package routes

import (
	"sonantica-core/analytics/presentation/http/handlers"

	"github.com/go-chi/chi/v5"
)

// AnalyticsRouter handles routing for analytics endpoints
type AnalyticsRouter struct {
	eventHandler     *handlers.EventHandler
	dashboardHandler *handlers.DashboardHandler
}

// NewAnalyticsRouter creates a new instance of the AnalyticsRouter
func NewAnalyticsRouter(
	eventHandler *handlers.EventHandler,
	dashboardHandler *handlers.DashboardHandler,
) *AnalyticsRouter {
	return &AnalyticsRouter{
		eventHandler:     eventHandler,
		dashboardHandler: dashboardHandler,
	}
}

// RegisterRoutes registers all analytics endpoints
func (ar *AnalyticsRouter) RegisterRoutes(r chi.Router) {
	r.Route("/analytics", func(r chi.Router) {
		// Ingestion endpoints
		r.Post("/ingest", ar.eventHandler.IngestEvent)
		r.Post("/ingest/batch", ar.eventHandler.IngestEventBatch)

		// Retrieval endpoints
		r.Get("/dashboard", ar.dashboardHandler.GetDashboard)
		r.Get("/realtime", ar.dashboardHandler.GetRealtimeStats)

		// Detailed stats (can be extended)
		r.Get("/top/tracks", ar.dashboardHandler.GetDashboard) // Example reuse
	})
}
