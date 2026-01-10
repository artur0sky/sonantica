package repositories

import (
	"context"
	"time"
)

// CacheRepository defines the contract for caching operations
type CacheRepository interface {
	// Get retrieves a value from cache
	Get(ctx context.Context, key string) (interface{}, error)

	// Set stores a value in cache with TTL
	Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error

	// Delete removes a value from cache
	Delete(ctx context.Context, key string) error

	// DeletePattern removes all keys matching a pattern
	DeletePattern(ctx context.Context, pattern string) error

	// Exists checks if a key exists in cache
	Exists(ctx context.Context, key string) (bool, error)

	// Increment increments a counter
	Increment(ctx context.Context, key string) (int64, error)

	// IncrementBy increments a counter by a specific amount
	IncrementBy(ctx context.Context, key string, value int64) (int64, error)

	// GetMultiple retrieves multiple values from cache
	GetMultiple(ctx context.Context, keys []string) (map[string]interface{}, error)

	// SetMultiple stores multiple values in cache
	SetMultiple(ctx context.Context, items map[string]interface{}, ttl time.Duration) error
}
