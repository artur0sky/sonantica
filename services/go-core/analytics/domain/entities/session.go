package entities

import (
	"time"
)

// Session represents an analytics session (Domain Entity)
type Session struct {
	ID             string
	SessionID      string
	UserID         *string
	Platform       Platform
	Browser        string
	BrowserVersion string
	OS             string
	OSVersion      string
	DeviceModel    string
	Locale         string
	Timezone       string
	IPHash         *string
	IPAddress      *string
	StartedAt      time.Time
	EndedAt        *time.Time
	LastHeartbeat  *time.Time
	CreatedAt      time.Time
}

// IsActive returns true if the session is currently active
func (s *Session) IsActive() bool {
	return s.EndedAt == nil
}

// Duration returns the session duration
func (s *Session) Duration() time.Duration {
	if s.EndedAt != nil {
		return s.EndedAt.Sub(s.StartedAt)
	}
	return time.Since(s.StartedAt)
}

// IsExpired checks if the session is expired (no heartbeat for 30 minutes)
func (s *Session) IsExpired() bool {
	if s.LastHeartbeat == nil {
		return time.Since(s.StartedAt) > 30*time.Minute
	}
	return time.Since(*s.LastHeartbeat) > 30*time.Minute
}

// End marks the session as ended
func (s *Session) End() {
	now := time.Now()
	s.EndedAt = &now
}

// UpdateHeartbeat updates the last heartbeat timestamp
func (s *Session) UpdateHeartbeat() {
	now := time.Now()
	s.LastHeartbeat = &now
}

// Validate performs domain validation on the session
func (s *Session) Validate() error {
	if s.SessionID == "" {
		return ErrInvalidSessionID
	}
	if s.StartedAt.IsZero() {
		return ErrInvalidTimestamp
	}
	if s.Platform == "" {
		return ErrInvalidPlatform
	}
	return nil
}
