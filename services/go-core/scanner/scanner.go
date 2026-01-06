package scanner

import (
	"context"
	"fmt"
	"io/fs"
	"path/filepath"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

var (
	// Security: Strict whitelist of allowed audio extensions
	AllowedExtensions = map[string]bool{
		".flac": true,
		".mp3":  true,
		".wav":  true,
		".ogg":  true,
		".m4a":  true,
		".opus": true,
		".alac": true,
		".aiff": true,
	}
	rdb *redis.Client
)

// InitRedis initializes the Redis client for the scanner
func InitRedis(host, port, password string) {
	rdb = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", host, port),
		Password: password,
	})
}

// TriggerScan manually triggers a directory scan
func TriggerScan(mediaPath string) {
	fmt.Printf("👆 Manual scan triggered for: %s\n", mediaPath)
	go scan(mediaPath)
}

// StartScanner starts a periodic scan of the media directory
// It uses polling to ensure consistency and security across Docker volumes
func StartScanner(mediaPath string, interval time.Duration) {
	fmt.Printf("🔍 Scanner started. Watching: %s\n", mediaPath)

	ticker := time.NewTicker(interval)
	go func() {
		// Run immediately on start
		scan(mediaPath)

		for range ticker.C {
			scan(mediaPath)
		}
	}()
}

// scan performs the actual directory traversal
func scan(root string) {
	fmt.Println("🔄 Starting library scan...")
	startTime := time.Now()
	filesFound := 0
	jobsDispatched := 0

	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			fmt.Printf("⚠️ Error accessing path %q: %v\n", path, err)
			return nil // Continue walking
		}

		if d.IsDir() {
			// Security: Skip hidden directories (e.g. .git, .trash)
			if strings.HasPrefix(d.Name(), ".") && d.Name() != "." {
				return filepath.SkipDir
			}
			return nil
		}

		// Security: Validate file extension
		ext := strings.ToLower(filepath.Ext(path))
		if !AllowedExtensions[ext] {
			return nil
		}

		filesFound++

		// TODO: Check against DB cache to avoid re-processing existing files
		// For now, we'll simplisticly push everything to a "discovery" queue
		// The worker will be smart enough to skip if hash matches

		// Normalize path relative to root for consistency
		relPath, err := filepath.Rel(root, path)
		if err != nil {
			return nil
		}

		// Dispatch Job to Redis
		err = dispatchAnalysisJob(relPath, root)
		if err != nil {
			fmt.Printf("❌ Failed to dispatch job for %s: %v\n", relPath, err)
		} else {
			jobsDispatched++
		}

		return nil
	})

	if err != nil {
		fmt.Printf("❌ Scan failed: %v\n", err)
	} else {
		fmt.Printf("✅ Scan complete in %v. Found %d files, Dispatched %d jobs.\n",
			time.Since(startTime), filesFound, jobsDispatched)
	}
}

func dispatchAnalysisJob(relPath, root string) error {
	if rdb == nil {
		return fmt.Errorf("redis client not initialized")
	}

	// Payload match the Python worker expectation
	jobPayload := fmt.Sprintf(`{"file_path": "%s", "root": "%s"}`, relPath, root)

	// Security: Use a dedicated queue
	// We use RPUSH to add to the tail of the queue
	return rdb.RPush(context.Background(), "analysis_queue", jobPayload).Err()
}
