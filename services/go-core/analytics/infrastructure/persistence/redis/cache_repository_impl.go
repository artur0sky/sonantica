package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"sonantica-core/analytics/domain/repositories"
	"time"

	"github.com/redis/go-redis/v9"
)

// CacheRepositoryImpl implements the CacheRepository interface for Redis
type CacheRepositoryImpl struct {
	client *redis.Client
}

// NewCacheRepositoryImpl creates a new Redis cache repository
func NewCacheRepositoryImpl(client *redis.Client) repositories.CacheRepository {
	return &CacheRepositoryImpl{
		client: client,
	}
}

// Get retrieves a value from Redis and unmarshals it
func (r *CacheRepositoryImpl) Get(ctx context.Context, key string) (interface{}, error) {
	val, err := r.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, nil // Return nil for not found consistently
	} else if err != nil {
		return nil, err
	}

	var target interface{}
	if err := json.Unmarshal([]byte(val), &target); err != nil {
		return nil, err
	}

	return target, nil
}

// Set marshals a value to JSON and stores it in Redis
func (r *CacheRepositoryImpl) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	jsonVal, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return r.client.Set(ctx, key, jsonVal, ttl).Err()
}

// Delete removes a key from Redis
func (r *CacheRepositoryImpl) Delete(ctx context.Context, key string) error {
	return r.client.Del(ctx, key).Err()
}

// DeletePattern removes all keys matching a glob pattern
func (r *CacheRepositoryImpl) DeletePattern(ctx context.Context, pattern string) error {
	iter := r.client.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		if err := r.client.Del(ctx, iter.Val()).Err(); err != nil {
			return err
		}
	}
	return iter.Err()
}

// Exists checks for the presence of a key
func (r *CacheRepositoryImpl) Exists(ctx context.Context, key string) (bool, error) {
	n, err := r.client.Exists(ctx, key).Result()
	return n > 0, err
}

// Increment atomicity increments a counter
func (r *CacheRepositoryImpl) Increment(ctx context.Context, key string) (int64, error) {
	return r.client.Incr(ctx, key).Result()
}

// IncrementBy atomically adds a specific value to a counter
func (r *CacheRepositoryImpl) IncrementBy(ctx context.Context, key string, value int64) (int64, error) {
	return r.client.IncrBy(ctx, key, value).Result()
}

// GetMultiple retrieves multiple keys in a single MGET call
func (r *CacheRepositoryImpl) GetMultiple(ctx context.Context, keys []string) (map[string]interface{}, error) {
	if len(keys) == 0 {
		return make(map[string]interface{}), nil
	}

	vals, err := r.client.MGet(ctx, keys...).Result()
	if err != nil {
		return nil, err
	}

	result := make(map[string]interface{})
	for i, val := range vals {
		if val == nil {
			result[keys[i]] = nil
			continue
		}

		var target interface{}
		if str, ok := val.(string); ok {
			if err := json.Unmarshal([]byte(str), &target); err == nil {
				result[keys[i]] = target
			}
		}
	}

	return result, nil
}

// SetMultiple stores multiple items with the same TTL
func (r *CacheRepositoryImpl) SetMultiple(ctx context.Context, items map[string]interface{}, ttl time.Duration) error {
	if len(items) == 0 {
		return nil
	}

	pipe := r.client.Pipeline()
	for key, val := range items {
		jsonVal, err := json.Marshal(val)
		if err != nil {
			return fmt.Errorf("failed to marshal key %s: %w", key, err)
		}
		pipe.Set(ctx, key, jsonVal, ttl)
	}

	_, err := pipe.Exec(ctx)
	return err
}
