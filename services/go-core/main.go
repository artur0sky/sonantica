package main

import (
	"fmt"
	"io"
	"log"
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
	// Setup Logging
	logDir := "/var/log/sonantica"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		fmt.Printf("⚠️ Failed to create log directory: %v\n", err)
	}

	logFile, err := os.OpenFile(filepath.Join(logDir, "core.log"), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		fmt.Printf("⚠️ Failed to open log file: %v\n", err)
	} else {
		// MultiWriter to print to stdout and file
		mw := io.MultiWriter(os.Stdout, logFile)
		log.SetOutput(mw)
		// Redirect standard fmt output implies using log or fmt.Fprint(mw, ...)
		// For simplicity we'll keep using fmt.Printf for startup msgs or switch to log.Printf
	}
	// Initialize Database
	if err := database.Connect(); err != nil {
		log.Printf("❌ Failed to connect to database: %v\n", err)
	}
	defer database.Close()

	// Initialize Analytics Logger
	analytics.InitLogger("sonantica-analytics")

	// Run Analytics Migrations
	log.Printf("📊 Running analytics database migrations...\n")
	if err := analytics.RunMigrations(); err != nil {
		log.Printf("⚠️ Analytics migrations failed: %v\n", err)
		log.Printf("⚠️ Analytics features may not work correctly\n")
	} else {
		log.Printf("✅ Analytics migrations completed successfully\n")
	}

	// Initialize Shared Redis Cache (Secure & Optimized)
	redisHost := os.Getenv("REDIS_HOST")
	redisPort := os.Getenv("REDIS_PORT")
	redisPass := os.Getenv("REDIS_PASSWORD") // Support password

	if redisHost == "" {
		redisHost = "redis"
	}
	if redisPort == "" {
		redisPort = "6379"
	}

	cache.Init(redisHost, redisPort, redisPass)
	scanner.InitRedis(redisHost, redisPort, redisPass) // TODO: Refactor scanner to use shared cache

	// Start Scanner (Non-blocking)
	mediaPath := os.Getenv("MEDIA_PATH")
	if mediaPath == "" {
		mediaPath = "/media"
	}
	// Scan every 1 hour (users can trigger manual scans via API too)
	scanner.StartScanner(mediaPath, 1*time.Hour)

	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
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
	fmt.Printf("📂 Working directory: %s\n", workDir)

	// Serve the /covers directory statically
	// This is where the audio-worker extracts embedded art
	r.Handle("/covers/*", http.StripPrefix("/covers/", http.FileServer(http.Dir("/covers"))))
	r.Handle("/api/covers/*", http.StripPrefix("/api/covers/", http.FileServer(http.Dir("/covers"))))

	// Serve the /media directory statically (optional, for direct file access if needed)
	// r.Handle("/api/raw/*", http.StripPrefix("/api/raw/", http.FileServer(http.Dir("/media"))))

	// Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🎵 Sonántica High-Performance Core running on port %s\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Printf("Error starting server: %s\n", err)
	}
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status": "ok", "service": "sonantica-go-core", "version": "0.1.0"}`)
}
