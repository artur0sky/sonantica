package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type LibraryCacheRepositoryImpl struct {
	redis *redis.Client
}

func NewLibraryCacheRepositoryImpl(redis *redis.Client) *LibraryCacheRepositoryImpl {
	return &LibraryCacheRepositoryImpl{redis: redis}
}

func (r *LibraryCacheRepositoryImpl) Get(ctx context.Context, key string, dest any) error {
	val, err := r.redis.Get(ctx, key).Result()
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(val), dest)
}

func (r *LibraryCacheRepositoryImpl) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return r.redis.Set(ctx, key, data, ttl).Err()
}

func (r *LibraryCacheRepositoryImpl) Delete(ctx context.Context, key string) error {
	return r.redis.Del(ctx, key).Err()
}

func (r *LibraryCacheRepositoryImpl) InvalidateByPrefix(ctx context.Context, prefix string) error {
	iter := r.redis.Scan(ctx, 0, fmt.Sprintf("%s*", prefix), 0).Iterator()
	for iter.Next(ctx) {
		if err := r.redis.Del(ctx, iter.Val()).Err(); err != nil {
			return err
		}
	}
	return iter.Err()
}
