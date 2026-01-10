package api

import (
	"encoding/json"
	"net/http"

	"sonantica-core/internal/plugins/application"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type PluginsHandler struct {
	manager *application.Manager
}

func NewPluginsHandler(manager *application.Manager) *PluginsHandler {
	return &PluginsHandler{manager: manager}
}

func (h *PluginsHandler) RegisterRoutes(r chi.Router) {
	r.Route("/api/plugins", func(r chi.Router) {
		r.Get("/", h.GetAllPlugins)
		r.Post("/", h.RegisterPlugin)
		r.Patch("/{id}/toggle", h.TogglePlugin)
		r.Patch("/{id}/config", h.UpdateConfig)
	})
}

func (h *PluginsHandler) GetAllPlugins(w http.ResponseWriter, r *http.Request) {
	plugins := h.manager.GetAllPlugins()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(plugins)
}

func (h *PluginsHandler) RegisterPlugin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		URL string `json:"url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	if err := h.manager.EnsurePluginRegistered(r.Context(), body.URL, nil); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *PluginsHandler) TogglePlugin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if _, err := uuid.Parse(id); err != nil {
		http.Error(w, "Invalid UUID: "+id, http.StatusBadRequest)
		return
	}

	var body struct {
		Enabled bool `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	if err := h.manager.TogglePlugin(r.Context(), id, body.Enabled); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *PluginsHandler) UpdateConfig(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if _, err := uuid.Parse(id); err != nil {
		http.Error(w, "Invalid UUID: "+id, http.StatusBadRequest)
		return
	}

	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	if err := h.manager.UpdateConfig(r.Context(), id, body); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
