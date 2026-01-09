package dto

import "fmt"

// EventDTO represents an analytics event for API communication
type EventDTO struct {
	EventID        string                 `json:"eventId"`
	EventType      string                 `json:"eventType"`
	Timestamp      int64                  `json:"timestamp"`
	SessionID      string                 `json:"sessionId"`
	UserID         *string                `json:"userId,omitempty"`
	Platform       string                 `json:"platform"`
	Browser        string                 `json:"browser,omitempty"`
	BrowserVersion string                 `json:"browserVersion,omitempty"`
	OS             string                 `json:"os,omitempty"`
	OSVersion      string                 `json:"osVersion,omitempty"`
	DeviceModel    string                 `json:"deviceModel,omitempty"`
	Locale         string                 `json:"locale,omitempty"`
	Timezone       string                 `json:"timezone,omitempty"`
	IPAddress      *string                `json:"ipAddress,omitempty"`
	Data           map[string]interface{} `json:"data,omitempty"`
}

// EventBatchDTO represents a batch of events
type EventBatchDTO struct {
	Events []EventDTO `json:"events"`
}

// EventResponseDTO represents the response after ingesting an event
type EventResponseDTO struct {
	Success   bool   `json:"success"`
	EventID   string `json:"eventId,omitempty"`
	Message   string `json:"message,omitempty"`
	Timestamp int64  `json:"timestamp"`
}

// BatchResponseDTO represents the response after ingesting a batch
type BatchResponseDTO struct {
	Success        bool     `json:"success"`
	ProcessedCount int      `json:"processedCount"`
	FailedCount    int      `json:"failedCount"`
	FailedEvents   []string `json:"failedEvents,omitempty"`
	Message        string   `json:"message,omitempty"`
	Timestamp      int64    `json:"timestamp"`
}

// Validate validates the event DTO
func (e *EventDTO) Validate() error {
	if e.EventID == "" {
		return ErrInvalidEventID
	}
	if e.EventType == "" {
		return ErrInvalidEventType
	}
	if e.SessionID == "" {
		return ErrInvalidSessionID
	}
	if e.Platform == "" {
		return ErrInvalidPlatform
	}
	return nil
}

// Validate validates the event batch DTO
func (b *EventBatchDTO) Validate() error {
	if len(b.Events) == 0 {
		return ErrEmptyBatch
	}
	if len(b.Events) > 100 {
		return ErrBatchTooLarge
	}
	for i, event := range b.Events {
		if err := event.Validate(); err != nil {
			return fmt.Errorf("event %d: %w", i, err)
		}
	}
	return nil
}
