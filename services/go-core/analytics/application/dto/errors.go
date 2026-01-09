package dto

import "errors"

// DTO validation errors
var (
	ErrInvalidEventID   = errors.New("invalid event ID")
	ErrInvalidEventType = errors.New("invalid event type")
	ErrInvalidSessionID = errors.New("invalid session ID")
	ErrInvalidPlatform  = errors.New("invalid platform")
	ErrEmptyBatch       = errors.New("event batch is empty")
	ErrBatchTooLarge    = errors.New("event batch exceeds maximum size")
	ErrInvalidDateRange = errors.New("invalid date range")
	ErrInvalidPeriod    = errors.New("invalid period")
	ErrInvalidLimit     = errors.New("invalid limit")
)
