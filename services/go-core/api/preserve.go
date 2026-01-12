package api

import (
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"sonantica-core/internal/plugins/application"
	"sonantica-core/internal/plugins/domain"

	"github.com/go-chi/chi/v5"
)

// PreserveHandler handles requests related to the downloader/preservation plugin
type PreserveHandler struct {
	manager           *application.Manager
	internalAPISecret string
}

// NewPreserveHandler creates a new preserve handler
func NewPreserveHandler(manager *application.Manager, secret string) *PreserveHandler {
	return &PreserveHandler{
		manager:           manager,
		internalAPISecret: secret,
	}
}

// RegisterRoutes registers preserve routes in the router
func (h *PreserveHandler) RegisterRoutes(r chi.Router) {
	r.Route("/api/v1/preserve", func(r chi.Router) {
		r.HandleFunc("/", h.Proxy)
		r.HandleFunc("/*", h.Proxy)
	})
}

// Proxy forwards requests to the downloader plugin
func (h *PreserveHandler) Proxy(w http.ResponseWriter, r *http.Request) {
	slog.Info("Proxying preservation request", "path", r.URL.Path, "method", r.Method)

	plugin, err := h.manager.GetPluginByCapability(domain.CapabilityDownload)
	if err != nil {
		slog.Error("Preservation plugin not found", "error", err)
		http.Error(w, "Downloader plugin not found or not active", http.StatusNotFound)
		return
	}

	target, err := url.Parse(plugin.BaseURL)
	if err != nil {
		slog.Error("Invalid plugin base URL", "url", plugin.BaseURL, "error", err)
		http.Error(w, "Invalid plugin base URL", http.StatusInternalServerError)
		return
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	// Update the request for the proxy
	originalPath := r.URL.Path

	// Strip /api/v1/preserve from path
	newPath := strings.TrimPrefix(originalPath, "/api/v1/preserve")

	if newPath == "" || newPath == "/" {
		r.URL.Path = "/download"
	} else {
		r.URL.Path = newPath
	}

	// Extra safety for job status ID
	segments := strings.Split(strings.Trim(newPath, "/"), "/")
	if len(segments) == 1 && segments[0] != "" &&
		segments[0] != "identify" && segments[0] != "download" &&
		segments[0] != "downloads" && segments[0] != "jobs" &&
		segments[0] != "config" && segments[0] != "manifest" &&
		segments[0] != "status" {
		r.URL.Path = fmt.Sprintf("/status/%s", segments[0])
	}

	slog.Info("Forwarding to plugin", "target_url", target.String()+r.URL.Path)

	r.URL.Host = target.Host
	r.URL.Scheme = target.Scheme
	r.Header.Set("X-Forwarded-Host", r.Header.Get("Host"))
	r.Header.Set("X-Internal-Secret", h.internalAPISecret) // Added secret for plugin validation
	r.Host = target.Host

	proxy.ServeHTTP(w, r)
}
