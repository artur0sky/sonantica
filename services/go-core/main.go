package main

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"sonantica-core/analytics"
	"sonantica-core/analytics/handlers"
	"sonantica-core/api"
	"sonantica-core/cache"
	"sonantica-core/config"
	"sonantica-core/database"
	"sonantica-core/scanner"
	"sonantica-core/shared"
	"sonantica-core/shared/logger"
	"sonantica-core/shared/metrics"

	"log/slog"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	// 1. Load Configuration
	cfg := config.Load()

	// 2. Setup Structured Logging
	logger.Init(cfg.LogLevel)

	slog.Info("🚀 Starting Sonántica Core", "version", "0.2.0")

	// 3. Initialize Database
	if err := database.Connect(cfg.PostgresURL); err != nil {
		slog.Error("Failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer database.Close()

	// 4. Initialize Analytics
	analytics.InitLogger("sonantica-analytics")
	slog.Info("Running analytics database migrations...")
	if err := analytics.RunMigrations(); err != nil {
		slog.Error("Analytics migrations failed", "error", err)
	}

	// 5. Initialize Caches
	cache.Init(cfg.RedisHost, cfg.RedisPort, cfg.RedisPassword)
	scanner.InitRedis(cfg.RedisHost, cfg.RedisPort, cfg.RedisPassword)

	// 6. Start Scanner
	slog.Info("Starting Scanner Scheduler", "path", cfg.MediaPath, "interval", "1h")
	scanner.StartScanner(cfg.MediaPath, 1*time.Hour)

	// 7. Initialize Router
	r := chi.NewRouter()

	// 8. Middleware Stack
	r.Use(middleware.RequestID)
	r.Use(logger.TraceMiddleware)    // Injects Trace ID from RequestID or Header
	r.Use(metrics.MetricsMiddleware) // Prometheus metrics
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(shared.ErrorMiddleware) // Global error handling and panic recovery
	r.Use(middleware.Compress(5))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "Range", "Origin"},
		ExposedHeaders:   []string{"Link", "Content-Length", "Content-Range", "Accept-Ranges"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// 9. Routes
	r.HandleFunc("/metrics", promhttp.Handler().ServeHTTP)
	r.Get("/health", healthCheck)
	r.Get("/stream/{id}", api.StreamTrack)
	r.Get("/api/cover/*", api.GetAlbumCover)

	r.Route("/api/library", func(r chi.Router) {
		r.Get("/tracks", api.GetTracks)
		r.Get("/artists", api.GetArtists)
		r.Get("/artists/{id}/tracks", api.GetTracksByArtist)
		r.Get("/albums", api.GetAlbums)
		r.Get("/albums/{id}/tracks", api.GetTracksByAlbum)
		r.Get("/alphabet-index", api.GetAlphabetIndex)

		// Playlists
		r.Get("/playlists", api.GetPlaylists)
		r.Post("/playlists", api.CreatePlaylist)
		r.Get("/playlists/{id}", api.GetPlaylist)
		r.Delete("/playlists/{id}", api.DeletePlaylist)
	})

	r.Route("/api/scan", func(r chi.Router) {
		r.Post("/start", api.ScanLibrary)
		r.Get("/status", api.GetScanStatus)
	})

	// Analytics Routes
	analyticsHandler := handlers.NewAnalyticsHandler()
	analyticsHandler.RegisterRoutes(r)

	// Static Assets
	coverServer := http.FileServer(http.Dir(cfg.CoverPath))
	staticWithCache := func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			h.ServeHTTP(w, r)
		})
	}
	r.Handle("/covers/*", http.StripPrefix("/covers/", staticWithCache(coverServer)))
	r.Handle("/api/covers/*", http.StripPrefix("/api/covers/", staticWithCache(coverServer)))

	// 10. Start Server
	slog.Info("Sonántica High-Performance Core Listening", "port", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		slog.Error("Server failed to start", "error", err)
	}
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status": "ok", "service": "sonantica-go-core", "version": "0.2.0"}`)
}
