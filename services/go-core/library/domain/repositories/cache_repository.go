package repositories

import (
	"context"
	"time"
)

// LibraryCacheRepository defines the interface for library-specific caching
type LibraryCacheRepository interface {
	Get(ctx context.Context, key string, dest any) error
	Set(ctx context.Context, key string, value any, ttl time.Duration) error
	Delete(ctx context.Context, key string) error
	InvalidateByPrefix(ctx context.Context, prefix string) error
}
