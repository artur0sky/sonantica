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
		Password: password, // no password set
		DB:       0,        // use default DB
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
