package entities

import "errors"

// Domain errors for validation
var (
	ErrInvalidEventID     = errors.New("invalid event ID")
	ErrInvalidEventType   = errors.New("invalid event type")
	ErrInvalidSessionID   = errors.New("invalid session ID")
	ErrInvalidTimestamp   = errors.New("invalid timestamp")
	ErrInvalidUserID      = errors.New("invalid user ID")
	ErrInvalidPlatform    = errors.New("invalid platform")
	ErrInvalidEventData   = errors.New("invalid event data")
	ErrSessionNotFound    = errors.New("session not found")
	ErrSessionExpired     = errors.New("session expired")
	ErrEventNotFound      = errors.New("event not found")
	ErrMetricsNotFound    = errors.New("metrics not found")
	ErrInvalidDateRange   = errors.New("invalid date range")
	ErrInvalidAggregation = errors.New("invalid aggregation type")
)
