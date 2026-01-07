package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

var rdb *redis.Client

// Init initializes the Redis client
func Init(host, port, password string) {
	rdb = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", host, port),
		Password: password,
		DB:       0,
	})
}

// GetClient returns the Redis client
func GetClient() *redis.Client {
	return rdb
}

// Set stores a value in Redis with a TTL
func Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if rdb == nil {
		return fmt.Errorf("redis client not initialized")
	}

	jsonVal, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return rdb.Set(ctx, key, jsonVal, ttl).Err()
}

// Get retrieves a value from Redis and unmarshals it into the target
func Get(ctx context.Context, key string, target interface{}) error {
	if rdb == nil {
		return fmt.Errorf("redis client not initialized")
	}

	val, err := rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		return fmt.Errorf("key not found")
	} else if err != nil {
		return err
	}

	return json.Unmarshal([]byte(val), target)
}

// Invalidate clears keys matching a pattern
func Invalidate(ctx context.Context, pattern string) error {
	if rdb == nil {
		return fmt.Errorf("redis client not initialized")
	}

	iter := rdb.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		if err := rdb.Del(ctx, iter.Val()).Err(); err != nil {
			return err
		}
	}
	return iter.Err()
}

// ============================================
// Library-specific cache functions
// ============================================

// SetLibraryStats caches library statistics
func SetLibraryStats(ctx context.Context, stats map[string]interface{}) error {
	return Set(ctx, "library:stats", stats, 1*time.Minute)
}

// GetLibraryStats retrieves cached library statistics
func GetLibraryStats(ctx context.Context) (map[string]interface{}, error) {
	var stats map[string]interface{}
	err := Get(ctx, "library:stats", &stats)
	return stats, err
}

// SetScanStatus caches scan status
func SetScanStatus(ctx context.Context, isScanning bool, filesScanned int) error {
	status := map[string]interface{}{
		"isScanning":   isScanning,
		"filesScanned": filesScanned,
		"lastUpdate":   time.Now().Unix(),
	}
	return Set(ctx, "scan:status", status, 1*time.Hour)
}

// GetScanStatus retrieves cached scan status
func GetScanStatus(ctx context.Context) (map[string]interface{}, error) {
	var status map[string]interface{}
	err := Get(ctx, "scan:status", &status)
	return status, err
}

// SetTracks caches tracks list with pagination
func SetTracks(ctx context.Context, offset, limit int, sort, order string, tracks interface{}) error {
	key := fmt.Sprintf("library:tracks:%d:%d:%s:%s", offset, limit, sort, order)
	return Set(ctx, key, tracks, 5*time.Minute)
}

// GetTracks retrieves cached tracks list
func GetTracks(ctx context.Context, offset, limit int, sort, order string, target interface{}) error {
	key := fmt.Sprintf("library:tracks:%d:%d:%s:%s", offset, limit, sort, order)
	return Get(ctx, key, target)
}

// SetArtists caches artists list with pagination
func SetArtists(ctx context.Context, offset, limit int, sort, order string, artists interface{}) error {
	key := fmt.Sprintf("library:artists:%d:%d:%s:%s", offset, limit, sort, order)
	return Set(ctx, key, artists, 5*time.Minute)
}

// GetArtists retrieves cached artists list
func GetArtists(ctx context.Context, offset, limit int, sort, order string, target interface{}) error {
	key := fmt.Sprintf("library:artists:%d:%d:%s:%s", offset, limit, sort, order)
	return Get(ctx, key, target)
}

// SetAlbums caches albums list with pagination
func SetAlbums(ctx context.Context, offset, limit int, sort, order string, albums interface{}) error {
	key := fmt.Sprintf("library:albums:%d:%d:%s:%s", offset, limit, sort, order)
	return Set(ctx, key, albums, 5*time.Minute)
}

// GetAlbums retrieves cached albums list
func GetAlbums(ctx context.Context, offset, limit int, sort, order string, target interface{}) error {
	key := fmt.Sprintf("library:albums:%d:%d:%s:%s", offset, limit, sort, order)
	return Get(ctx, key, target)
}

// InvalidateLibraryCache clears all library-related cache
func InvalidateLibraryCache(ctx context.Context) error {
	patterns := []string{
		"library:*",
		"scan:*",
	}

	for _, pattern := range patterns {
		if err := Invalidate(ctx, pattern); err != nil {
			return err
		}
	}
	return nil
}

// PublishScanEvent publishes a scan event to Redis Pub/Sub
func PublishScanEvent(ctx context.Context, event string, data interface{}) error {
	if rdb == nil {
		return fmt.Errorf("redis client not initialized")
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return rdb.Publish(ctx, "scan:events", fmt.Sprintf("%s:%s", event, string(jsonData))).Err()
}

// SubscribeScanEvents subscribes to scan events
func SubscribeScanEvents(ctx context.Context) *redis.PubSub {
	if rdb == nil {
		return nil
	}
	return rdb.Subscribe(ctx, "scan:events")
}

// ============================================
// Full Library Cache (for Virtual Scrolling)
// ============================================

// SetAllTracks caches the complete tracks library
func SetAllTracks(ctx context.Context, tracks interface{}) error {
	return Set(ctx, "library:all:tracks", tracks, 10*time.Minute)
}

// GetAllTracks retrieves the complete tracks library from cache
func GetAllTracks(ctx context.Context, target interface{}) error {
	return Get(ctx, "library:all:tracks", target)
}

// SetAllArtists caches the complete artists library
func SetAllArtists(ctx context.Context, artists interface{}) error {
	return Set(ctx, "library:all:artists", artists, 10*time.Minute)
}

// GetAllArtists retrieves the complete artists library from cache
func GetAllArtists(ctx context.Context, target interface{}) error {
	return Get(ctx, "library:all:artists", target)
}

// SetAllAlbums caches the complete albums library
func SetAllAlbums(ctx context.Context, albums interface{}) error {
	return Set(ctx, "library:all:albums", albums, 10*time.Minute)
}

// GetAllAlbums retrieves the complete albums library from cache
func GetAllAlbums(ctx context.Context, target interface{}) error {
	return Get(ctx, "library:all:albums", target)
}
