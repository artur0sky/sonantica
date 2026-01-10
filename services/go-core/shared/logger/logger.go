package logger

import (
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
)

func Init(logLevel, logFormat string, logEnabled bool) {
	if !logEnabled {
		// Discard all logs if disabled
		logger := slog.New(slog.NewTextHandler(io.Discard, nil))
		slog.SetDefault(logger)
		return
	}

	logDir := "/var/log/sonantica"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "⚠️ Failed to create log directory: %v\n", err)
	}

	logFile, err := os.OpenFile(filepath.Join(logDir, "core.log"), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	var logOutput io.Writer = os.Stdout
	if err == nil {
		logOutput = io.MultiWriter(os.Stdout, logFile)
	} else {
		fmt.Fprintf(os.Stderr, "⚠️ Failed to open log file: %v\n", err)
	}

	var level slog.Level
	switch logLevel {
	case "debug":
		level = slog.LevelDebug
	case "info":
		level = slog.LevelInfo
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	default:
		level = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{
		Level: level,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			// High precision timestamp for everyone
			if a.Key == slog.TimeKey {
				t := a.Value.Time()
				// 2006-01-02 15:04:05.000000000 (Nano precision)
				return slog.String(slog.TimeKey, t.Format("2006-01-02 15:04:05.000000000"))
			}
			return a
		},
	}

	var baseHandler slog.Handler
	if logFormat == "text" {
		baseHandler = slog.NewTextHandler(logOutput, opts)
	} else {
		baseHandler = slog.NewJSONHandler(logOutput, opts)
	}

	logger := slog.New(NewTraceHandler(baseHandler))
	slog.SetDefault(logger)

	slog.Info("Logger initialized", "level", logLevel, "format", logFormat)
}
