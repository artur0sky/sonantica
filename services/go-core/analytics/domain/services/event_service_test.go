package services

import (
	"context"
	"sonantica-core/analytics/domain/entities"
	"testing"
	"time"
)

// MockEventRepository provides a mock implementation for testing
type MockEventRepository struct {
	StoreFunc func(ctx context.Context, event *entities.Event) error
}

func (m *MockEventRepository) Store(ctx context.Context, event *entities.Event) error {
	return m.StoreFunc(ctx, event)
}

func (m *MockEventRepository) StoreBatch(ctx context.Context, events []*entities.Event) error {
	return nil
}
func (m *MockEventRepository) GetByID(ctx context.Context, id string) (*entities.Event, error) {
	return nil, nil
}
func (m *MockEventRepository) GetBySessionID(ctx context.Context, id string) ([]*entities.Event, error) {
	return nil, nil
}
func (m *MockEventRepository) GetByTimeRange(ctx context.Context, s, e time.Time) ([]*entities.Event, error) {
	return nil, nil
}
func (m *MockEventRepository) GetByType(ctx context.Context, t entities.EventType, l int) ([]*entities.Event, error) {
	return nil, nil
}
func (m *MockEventRepository) Count(ctx context.Context) (int64, error) { return 0, nil }
func (m *MockEventRepository) CountByType(ctx context.Context, t entities.EventType) (int64, error) {
	return 0, nil
}
func (m *MockEventRepository) Delete(ctx context.Context, id string) error { return nil }

// MockSessionRepository provides a mock implementation for testing
type MockSessionRepository struct {
	CreateFunc func(ctx context.Context, session *entities.Session) error
}

func (m *MockSessionRepository) Create(ctx context.Context, session *entities.Session) error {
	return m.CreateFunc(ctx, session)
}

func (m *MockSessionRepository) GetByID(ctx context.Context, id string) (*entities.Session, error) {
	return nil, nil
}
func (m *MockSessionRepository) GetByUserID(ctx context.Context, u string, l int) ([]*entities.Session, error) {
	return nil, nil
}
func (m *MockSessionRepository) GetActive(ctx context.Context) ([]*entities.Session, error) {
	return nil, nil
}
func (m *MockSessionRepository) Update(ctx context.Context, s *entities.Session) error { return nil }
func (m *MockSessionRepository) UpdateHeartbeat(ctx context.Context, id string) error  { return nil }
func (m *MockSessionRepository) End(ctx context.Context, id string, t time.Time) error { return nil }
func (m *MockSessionRepository) GetByTimeRange(ctx context.Context, s, e time.Time) ([]*entities.Session, error) {
	return nil, nil
}
func (m *MockSessionRepository) Count(ctx context.Context) (int64, error)    { return 0, nil }
func (m *MockSessionRepository) Delete(ctx context.Context, id string) error { return nil }

func TestProcessEvent_Privacy(t *testing.T) {
	ip := "192.168.1.1"
	event := &entities.Event{
		ID:        "test-event",
		Type:      entities.EventPlaybackStart,
		SessionID: "test-session",
		IPAddress: &ip,
	}

	mockEventRepo := &MockEventRepository{
		StoreFunc: func(ctx context.Context, e *entities.Event) error {
			if e.IPAddress != nil {
				t.Errorf("Expected IPAddress to be nil after processing, got %s", *e.IPAddress)
			}
			if e.IPHash == nil {
				t.Error("Expected IPHash to be set")
			}
			return nil
		},
	}

	service := NewEventService(mockEventRepo, &MockSessionRepository{})
	err := service.ProcessEvent(context.Background(), event)
	if err != nil {
		t.Errorf("Failed to process event: %v", err)
	}
}
