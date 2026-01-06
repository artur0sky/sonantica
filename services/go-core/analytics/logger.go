package analytics

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
)

// LogLevel represents the severity of a log message
type LogLevel string

const (
	LogLevelDebug LogLevel = "DEBUG"
	LogLevelInfo  LogLevel = "INFO"
	LogLevelWarn  LogLevel = "WARN"
	LogLevelError LogLevel = "ERROR"
)

// Logger provides structured logging for analytics operations
type Logger struct {
	serviceName string
	logLevel    LogLevel
	logger      *log.Logger
}

// LogEntry represents a structured log entry
type LogEntry struct {
	Timestamp  time.Time              `json:"timestamp"`
	Level      LogLevel               `json:"level"`
	Service    string                 `json:"service"`
	TraceID    string                 `json:"traceId,omitempty"`
	Message    string                 `json:"message"`
	Operation  string                 `json:"operation,omitempty"`
	Duration   *time.Duration         `json:"duration,omitempty"`
	EventType  string                 `json:"eventType,omitempty"`
	EventCount int                    `json:"eventCount,omitempty"`
	SessionID  string                 `json:"sessionId,omitempty"`
	Error      string                 `json:"error,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

// NewLogger creates a new analytics logger
func NewLogger(serviceName string) *Logger {
	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "INFO"
	}

	return &Logger{
		serviceName: serviceName,
		logLevel:    LogLevel(logLevel),
		logger:      log.New(os.Stdout, "", 0),
	}
}

// Debug logs a debug message
func (l *Logger) Debug(message string, metadata ...map[string]interface{}) {
	if l.shouldLog(LogLevelDebug) {
		l.log(LogLevelDebug, message, "", nil, metadata...)
	}
}

// Info logs an info message
func (l *Logger) Info(message string, metadata ...map[string]interface{}) {
	if l.shouldLog(LogLevelInfo) {
		l.log(LogLevelInfo, message, "", nil, metadata...)
	}
}

// Warn logs a warning message
func (l *Logger) Warn(message string, metadata ...map[string]interface{}) {
	if l.shouldLog(LogLevelWarn) {
		l.log(LogLevelWarn, message, "", nil, metadata...)
	}
}

// Error logs an error message
func (l *Logger) Error(message string, err error, metadata ...map[string]interface{}) {
	if l.shouldLog(LogLevelError) {
		errMsg := ""
		if err != nil {
			errMsg = err.Error()
		}
		l.log(LogLevelError, message, errMsg, nil, metadata...)
	}
}

// LogOperation logs the start and completion of an operation
func (l *Logger) LogOperation(operation string, fn func() error) error {
	traceID := uuid.New().String()
	start := time.Now()

	l.Info(fmt.Sprintf("Starting operation: %s", operation), map[string]interface{}{
		"traceId":   traceID,
		"operation": operation,
	})

	err := fn()
	duration := time.Since(start)

	if err != nil {
		l.Error(fmt.Sprintf("Operation failed: %s", operation), err, map[string]interface{}{
			"traceId":   traceID,
			"operation": operation,
			"duration":  duration.String(),
		})
	} else {
		l.Info(fmt.Sprintf("Operation completed: %s", operation), map[string]interface{}{
			"traceId":   traceID,
			"operation": operation,
			"duration":  duration.String(),
		})
	}

	return err
}

// LogEventIngestion logs event ingestion with metrics
func (l *Logger) LogEventIngestion(eventType string, eventCount int, sessionID string, duration time.Duration) {
	l.Info("Events ingested", map[string]interface{}{
		"eventType":  eventType,
		"eventCount": eventCount,
		"sessionId":  sessionID,
		"duration":   duration.String(),
	})
}

// LogAggregation logs aggregation operations
func (l *Logger) LogAggregation(operation string, recordsProcessed int, duration time.Duration) {
	l.Info("Aggregation completed", map[string]interface{}{
		"operation":        operation,
		"recordsProcessed": recordsProcessed,
		"duration":         duration.String(),
	})
}

// LogQueryPerformance logs query performance metrics
func (l *Logger) LogQueryPerformance(query string, duration time.Duration, rowsReturned int) {
	l.Debug("Query executed", map[string]interface{}{
		"query":        query,
		"duration":     duration.String(),
		"rowsReturned": rowsReturned,
	})
}

// WithContext adds context information to logs
func (l *Logger) WithContext(ctx context.Context) *ContextLogger {
	traceID := ""
	if val := ctx.Value("traceId"); val != nil {
		traceID = val.(string)
	}

	return &ContextLogger{
		logger:  l,
		traceID: traceID,
		ctx:     ctx,
	}
}

// ContextLogger wraps Logger with context information
type ContextLogger struct {
	logger  *Logger
	traceID string
	ctx     context.Context
}

// Info logs with context
func (cl *ContextLogger) Info(message string, metadata ...map[string]interface{}) {
	meta := cl.mergeMetadata(metadata...)
	meta["traceId"] = cl.traceID
	cl.logger.Info(message, meta)
}

// Error logs with context
func (cl *ContextLogger) Error(message string, err error, metadata ...map[string]interface{}) {
	meta := cl.mergeMetadata(metadata...)
	meta["traceId"] = cl.traceID
	cl.logger.Error(message, err, meta)
}

// Debug logs with context
func (cl *ContextLogger) Debug(message string, metadata ...map[string]interface{}) {
	meta := cl.mergeMetadata(metadata...)
	meta["traceId"] = cl.traceID
	cl.logger.Debug(message, meta)
}

// Warn logs with context
func (cl *ContextLogger) Warn(message string, metadata ...map[string]interface{}) {
	meta := cl.mergeMetadata(metadata...)
	meta["traceId"] = cl.traceID
	cl.logger.Warn(message, meta)
}

// Private methods

func (l *Logger) shouldLog(level LogLevel) bool {
	levels := map[LogLevel]int{
		LogLevelDebug: 0,
		LogLevelInfo:  1,
		LogLevelWarn:  2,
		LogLevelError: 3,
	}

	return levels[level] >= levels[l.logLevel]
}

func (l *Logger) log(level LogLevel, message string, errMsg string, duration *time.Duration, metadata ...map[string]interface{}) {
	entry := LogEntry{
		Timestamp: time.Now(),
		Level:     level,
		Service:   l.serviceName,
		Message:   message,
		Duration:  duration,
	}

	if errMsg != "" {
		entry.Error = errMsg
	}

	if len(metadata) > 0 && metadata[0] != nil {
		entry.Metadata = metadata[0]

		// Extract common fields
		if val, ok := metadata[0]["traceId"].(string); ok {
			entry.TraceID = val
		}
		if val, ok := metadata[0]["operation"].(string); ok {
			entry.Operation = val
		}
		if val, ok := metadata[0]["eventType"].(string); ok {
			entry.EventType = val
		}
		if val, ok := metadata[0]["eventCount"].(int); ok {
			entry.EventCount = val
		}
		if val, ok := metadata[0]["sessionId"].(string); ok {
			entry.SessionID = val
		}
	}

	// Format log output
	logMsg := fmt.Sprintf("[%s] [%s] %s",
		entry.Timestamp.Format("2006-01-02 15:04:05.000"),
		entry.Level,
		entry.Message,
	)

	if entry.TraceID != "" {
		logMsg += fmt.Sprintf(" | traceId=%s", entry.TraceID)
	}

	if entry.Operation != "" {
		logMsg += fmt.Sprintf(" | operation=%s", entry.Operation)
	}

	if entry.Duration != nil {
		logMsg += fmt.Sprintf(" | duration=%s", entry.Duration.String())
	}

	if entry.EventType != "" {
		logMsg += fmt.Sprintf(" | eventType=%s", entry.EventType)
	}

	if entry.EventCount > 0 {
		logMsg += fmt.Sprintf(" | eventCount=%d", entry.EventCount)
	}

	if entry.SessionID != "" {
		logMsg += fmt.Sprintf(" | sessionId=%s", entry.SessionID)
	}

	if entry.Error != "" {
		logMsg += fmt.Sprintf(" | error=%s", entry.Error)
	}

	// Add icon based on level
	icon := ""
	switch level {
	case LogLevelDebug:
		icon = "🔍"
	case LogLevelInfo:
		icon = "ℹ️"
	case LogLevelWarn:
		icon = "⚠️"
	case LogLevelError:
		icon = "❌"
	}

	l.logger.Println(icon + " " + logMsg)
}

func (cl *ContextLogger) mergeMetadata(metadata ...map[string]interface{}) map[string]interface{} {
	if len(metadata) > 0 && metadata[0] != nil {
		return metadata[0]
	}
	return make(map[string]interface{})
}

// Global logger instance
var globalLogger *Logger

// InitLogger initializes the global logger
func InitLogger(serviceName string) {
	globalLogger = NewLogger(serviceName)
	globalLogger.Info("Analytics logger initialized", map[string]interface{}{
		"service": serviceName,
	})
}

// GetLogger returns the global logger instance
func GetLogger() *Logger {
	if globalLogger == nil {
		InitLogger("sonantica-analytics")
	}
	return globalLogger
}
