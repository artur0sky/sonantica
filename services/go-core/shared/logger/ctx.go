package logger

import (
	"context"

	"github.com/google/uuid"
)

type contextKey string

const (
	TraceIDKey contextKey = "trace_id"
)

// FromContext extracts the trace ID from the context.
func FromContext(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	if id, ok := ctx.Value(TraceIDKey).(string); ok {
		return id
	}
	return ""
}

// WithTraceID adds a trace ID to the context if it doesn't already have one.
func WithTraceID(ctx context.Context, id string) context.Context {
	if id == "" {
		id = uuid.New().String()
	}
	return context.WithValue(ctx, TraceIDKey, id)
}
