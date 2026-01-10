package logging

import (
	"context"
	"log/slog"
	"os"
)

// Logger defines the interface for our structured logging
type Logger interface {
	Debug(ctx context.Context, msg string, args ...any)
	Info(ctx context.Context, msg string, args ...any)
	Warn(ctx context.Context, msg string, args ...any)
	Error(ctx context.Context, msg string, err error, args ...any)
}

// StructuredLogger implements the Logger interface using slog
type StructuredLogger struct {
	logger *slog.Logger
}

// NewStructuredLogger creates a new StructuredLogger instance
func NewStructuredLogger(serviceName string) *StructuredLogger {
	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})

	logger := slog.New(handler).With(
		slog.String("service", serviceName),
	)

	return &StructuredLogger{
		logger: logger,
	}
}

// Debug logs a debug message
func (l *StructuredLogger) Debug(ctx context.Context, msg string, args ...any) {
	l.logger.DebugContext(ctx, msg, l.appendTraceID(ctx, args)...)
}

// Info logs an info message
func (l *StructuredLogger) Info(ctx context.Context, msg string, args ...any) {
	l.logger.InfoContext(ctx, msg, l.appendTraceID(ctx, args)...)
}

// Warn logs a warning message
func (l *StructuredLogger) Warn(ctx context.Context, msg string, args ...any) {
	l.logger.WarnContext(ctx, msg, l.appendTraceID(ctx, args)...)
}

// Error logs an error message with asscociated error
func (l *StructuredLogger) Error(ctx context.Context, msg string, err error, args ...any) {
	if err != nil {
		args = append(args, slog.String("error", err.Error()))
	}
	l.logger.ErrorContext(ctx, msg, l.appendTraceID(ctx, args)...)
}

// appendTraceID extracts traceId from context and appends it to args if present
func (l *StructuredLogger) appendTraceID(ctx context.Context, args []any) []any {
	if traceID, ok := ctx.Value("traceId").(string); ok {
		return append(args, slog.String("traceId", traceID))
	}
	return args
}
