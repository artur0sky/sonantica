package main

import (
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"sonantica-core/analytics"
	"sonantica-core/analytics/handlers"
	"sonantica-core/api"
	"sonantica-core/cache"
	"sonantica-core/database"
	"sonantica-core/scanner"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	// Setup Structured Logging (JSON)
	logDir := "/var/log/sonantica"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		// Fallback to stderr if we can't create log dir
		fmt.Fprintf(os.Stderr, "⚠️ Failed to create log directory: %v\n", err)
	}

	logFile, err := os.OpenFile(filepath.Join(logDir, "core.log"), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	var logOutput io.Writer = os.Stdout
	if err == nil {
		logOutput = io.MultiWriter(os.Stdout, logFile)
	} else {
		fmt.Fprintf(os.Stderr, "⚠️ Failed to open log file: %v\n", err)
	}

	// Initialize slog with JSON Handler
	logger := slog.New(slog.NewJSONHandler(logOutput, &slog.HandlerOptions{
		Level: slog.LevelInfo,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			// Optional: Customize timestamp format or keys here
			return a
		},
	}))
	slog.SetDefault(logger)

	slog.Info("🚀 Starting Sonántica Core", "version", "0.2.0")

	// Initialize Database
	if err := database.Connect(); err != nil {
		slog.Error("Failed to connect to database", "error", err)
		os.Exit(1) // Critical failure
	}
	defer database.Close()

	// Initialize Analytics Logger
	analytics.InitLogger("sonantica-analytics")

	// Run Analytics Migrations
	slog.Info("Running analytics database migrations...")
	if err := analytics.RunMigrations(); err != nil {
		slog.Error("Analytics migrations failed", "error", err)
		slog.Warn("Analytics features may not work correctly")
	} else {
		slog.Info("Analytics migrations completed successfully")
	}

	// Initialize Shared Redis Cache
	redisHost := os.Getenv("REDIS_HOST")
	redisPort := os.Getenv("REDIS_PORT")
	redisPass := os.Getenv("REDIS_PASSWORD")

	if redisHost == "" {
		redisHost = "redis"
	}
	if redisPort == "" {
		redisPort = "6379"
	}

	cache.Init(redisHost, redisPort, redisPass)
	scanner.InitRedis(redisHost, redisPort, redisPass)

	// Start Scanner (Non-blocking)
	mediaPath := os.Getenv("MEDIA_PATH")
	if mediaPath == "" {
		mediaPath = "/media"
	}
	slog.Info("Starting Scanner Scheduler", "path", mediaPath, "interval", "1h")
	scanner.StartScanner(mediaPath, 1*time.Hour)

	r := chi.NewRouter()

	// Middleware Stack
	r.Use(middleware.RequestID) // Inject X-Request-Id
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger) // Default logger is okay, but structured is better. We'll keep it for now for simple console view, or replace it.
	// Ideally we replace middleware.Logger with a custom slog middleware.
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"}, // TODO: tightened in production
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "Range"},
		ExposedHeaders:   []string{"Link", "Content-Length", "Content-Range", "Accept-Ranges"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Routes
	r.Get("/health", healthCheck)
	r.Get("/stream/{id}", api.StreamTrack)
	r.Get("/api/cover/*", api.GetAlbumCover)

	// API Routes
	r.Route("/api/library", func(r chi.Router) {
		r.Get("/tracks", api.GetTracks)
		r.Get("/artists", api.GetArtists)
		r.Get("/artists/{id}/tracks", api.GetTracksByArtist)
		r.Get("/albums", api.GetAlbums)
		r.Get("/albums/{id}/tracks", api.GetTracksByAlbum)
	})

	r.Route("/api/scan", func(r chi.Router) {
		r.Post("/start", api.ScanLibrary)
		r.Get("/status", api.GetScanStatus)
	})

	// Analytics Routes
	analyticsHandler := handlers.NewAnalyticsHandler()
	analyticsHandler.RegisterRoutes(r)

	// Static Assets
	workDir, _ := os.Getwd()
	slog.Info("Server Config", "work_dir", workDir, "log_dir", logDir)

	r.Handle("/covers/*", http.StripPrefix("/covers/", http.FileServer(http.Dir("/covers"))))
	r.Handle("/api/covers/*", http.StripPrefix("/api/covers/", http.FileServer(http.Dir("/covers"))))

	// Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	slog.Info("Sonántica High-Performance Core Listenin", "port", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		slog.Error("Server failed to start", "error", err)
	}
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status": "ok", "service": "sonantica-go-core", "version": "0.1.0"}`)
}
