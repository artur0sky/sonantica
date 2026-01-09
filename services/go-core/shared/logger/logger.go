package logger

import (
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
)

func Init(logLevel string) {
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

	baseHandler := slog.NewJSONHandler(logOutput, &slog.HandlerOptions{
		Level: level,
	})

	logger := slog.New(NewTraceHandler(baseHandler))
	slog.SetDefault(logger)

	slog.Info("Logger initialized", "level", logLevel)
}
