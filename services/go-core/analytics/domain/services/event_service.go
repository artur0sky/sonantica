package services

import (
	"context"
	"crypto/sha256"
	"fmt"
	"sonantica-core/analytics/domain/entities"
	"sonantica-core/analytics/domain/repositories"
	"time"
)

// EventService contains business logic for event processing
// This is pure domain logic, independent of infrastructure
type EventService struct {
	eventRepo   repositories.EventRepository
	sessionRepo repositories.SessionRepository
}

// NewEventService creates a new event service
func NewEventService(
	eventRepo repositories.EventRepository,
	sessionRepo repositories.SessionRepository,
) *EventService {
	return &EventService{
		eventRepo:   eventRepo,
		sessionRepo: sessionRepo,
	}
}

// ProcessEvent processes a single event with business rules
func (s *EventService) ProcessEvent(ctx context.Context, event *entities.Event) error {
	// Validate event
	if err := event.Validate(); err != nil {
		return fmt.Errorf("event validation failed: %w", err)
	}

	// Hash IP address for privacy
	if event.IPAddress != nil {
		hash := s.hashIP(*event.IPAddress)
		event.IPHash = &hash
		event.IPAddress = nil // Remove raw IP after hashing
	}

	// Set timestamp if not provided
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	// Store event
	if err := s.eventRepo.Store(ctx, event); err != nil {
		return fmt.Errorf("failed to store event: %w", err)
	}

	// Handle session-specific logic
	if event.IsSessionEvent() {
		if err := s.handleSessionEvent(ctx, event); err != nil {
			return fmt.Errorf("failed to handle session event: %w", err)
		}
	}

	return nil
}

// ProcessEventBatch processes multiple events efficiently
func (s *EventService) ProcessEventBatch(ctx context.Context, events []*entities.Event) error {
	// Validate all events first
	for i, event := range events {
		if err := event.Validate(); err != nil {
			return fmt.Errorf("event %d validation failed: %w", i, err)
		}

		// Hash IP addresses
		if event.IPAddress != nil {
			hash := s.hashIP(*event.IPAddress)
			event.IPHash = &hash
			event.IPAddress = nil
		}

		// Set timestamp if not provided
		if event.Timestamp.IsZero() {
			events[i].Timestamp = time.Now()
		}
	}

	// Store all events in a batch
	if err := s.eventRepo.StoreBatch(ctx, events); err != nil {
		return fmt.Errorf("failed to store event batch: %w", err)
	}

	// Handle session events
	for _, event := range events {
		if event.IsSessionEvent() {
			if err := s.handleSessionEvent(ctx, event); err != nil {
				// Log error but don't fail the entire batch
				// In production, this should use structured logging
				continue
			}
		}
	}

	return nil
}

// handleSessionEvent handles session-specific business logic
func (s *EventService) handleSessionEvent(ctx context.Context, event *entities.Event) error {
	switch event.Type {
	case entities.EventSessionStart:
		return s.createSession(ctx, event)
	case entities.EventSessionEnd:
		return s.endSession(ctx, event)
	case entities.EventSessionHeartbeat:
		return s.updateSessionHeartbeat(ctx, event)
	}
	return nil
}

// createSession creates a new session from an event
func (s *EventService) createSession(ctx context.Context, event *entities.Event) error {
	session := &entities.Session{
		SessionID:      event.SessionID,
		UserID:         event.UserID,
		Platform:       event.Platform,
		Browser:        event.Browser,
		BrowserVersion: event.BrowserVersion,
		OS:             event.OS,
		OSVersion:      event.OSVersion,
		DeviceModel:    event.DeviceModel,
		Locale:         event.Locale,
		Timezone:       event.Timezone,
		IPHash:         event.IPHash,
		StartedAt:      event.Timestamp,
		CreatedAt:      time.Now(),
	}

	if err := session.Validate(); err != nil {
		return fmt.Errorf("session validation failed: %w", err)
	}

	return s.sessionRepo.Create(ctx, session)
}

// endSession marks a session as ended
func (s *EventService) endSession(ctx context.Context, event *entities.Event) error {
	return s.sessionRepo.End(ctx, event.SessionID, event.Timestamp)
}

// updateSessionHeartbeat updates the session heartbeat
func (s *EventService) updateSessionHeartbeat(ctx context.Context, event *entities.Event) error {
	return s.sessionRepo.UpdateHeartbeat(ctx, event.SessionID)
}

// hashIP hashes an IP address for privacy
func (s *EventService) hashIP(ip string) string {
	hash := sha256.Sum256([]byte(ip))
	return fmt.Sprintf("%x", hash)
}

// GetEventsBySession retrieves all events for a session
func (s *EventService) GetEventsBySession(ctx context.Context, sessionID string) ([]*entities.Event, error) {
	return s.eventRepo.GetBySessionID(ctx, sessionID)
}

// GetEventsByTimeRange retrieves events within a time range
func (s *EventService) GetEventsByTimeRange(ctx context.Context, startTime, endTime time.Time) ([]*entities.Event, error) {
	if startTime.After(endTime) {
		return nil, entities.ErrInvalidDateRange
	}
	return s.eventRepo.GetByTimeRange(ctx, startTime, endTime)
}
