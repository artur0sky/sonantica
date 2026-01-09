package mappers

import (
	"sonantica-core/analytics/application/dto"
	"sonantica-core/analytics/domain/entities"
	"time"
)

// MapEventDTOToEntity converts an EventDTO to a Domain Event entity
func MapEventDTOToEntity(d dto.EventDTO) *entities.Event {
	id := d.EventID
	if id == "" {
		// In a real scenario, we might generate a UUID here if missing
	}

	timestamp := time.Unix(d.Timestamp, 0)
	if d.Timestamp == 0 {
		timestamp = time.Now()
	}

	return &entities.Event{
		ID:             id,
		Type:           entities.EventType(d.EventType),
		Timestamp:      timestamp,
		SessionID:      d.SessionID,
		UserID:         d.UserID,
		Platform:       entities.Platform(d.Platform),
		Browser:        d.Browser,
		BrowserVersion: d.BrowserVersion,
		OS:             d.OS,
		OSVersion:      d.OSVersion,
		DeviceModel:    d.DeviceModel,
		Locale:         d.Locale,
		Timezone:       d.Timezone,
		IPAddress:      d.IPAddress,
		Data:           d.Data,
	}
}

// MapEntityToEventDTO converts a Domain Event entity to an EventDTO
func MapEntityToEventDTO(e *entities.Event) dto.EventDTO {
	var ipAddr *string
	if e.IPAddress != nil {
		ipAddr = e.IPAddress
	}

	return dto.EventDTO{
		EventID:        e.ID,
		EventType:      string(e.Type),
		Timestamp:      e.Timestamp.Unix(),
		SessionID:      e.SessionID,
		UserID:         e.UserID,
		Platform:       string(e.Platform),
		Browser:        e.Browser,
		BrowserVersion: e.BrowserVersion,
		OS:             e.OS,
		OSVersion:      e.OSVersion,
		DeviceModel:    e.DeviceModel,
		Locale:         e.Locale,
		Timezone:       e.Timezone,
		IPAddress:      ipAddr,
		Data:           e.Data,
	}
}

// MapEventBatchDTOToEntities converts a batch DTO to a slice of Domain Event entities
func MapEventBatchDTOToEntities(b dto.EventBatchDTO) []*entities.Event {
	events := make([]*entities.Event, len(b.Events))
	for i, d := range b.Events {
		events[i] = MapEventDTOToEntity(d)
	}
	return events
}
