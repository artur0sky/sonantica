package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// Plugin represents an extension module (AI or other)
type Plugin struct {
	ID         uuid.UUID       `json:"id" db:"id"`
	Name       string          `json:"name" db:"name"`
	Capability string          `json:"capability" db:"capability"`
	URL        string          `json:"url" db:"url"`
	IsEnabled  bool            `json:"isEnabled" db:"is_enabled"`
	Config     json.RawMessage `json:"config" db:"config"`
	CreatedAt  time.Time       `json:"createdAt" db:"created_at"`
	UpdatedAt  time.Time       `json:"updatedAt" db:"updated_at"`
}
