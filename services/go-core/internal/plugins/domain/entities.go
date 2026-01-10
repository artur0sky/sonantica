package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// PluginCapability representa el tipo de IA
type PluginCapability string

const (
	CapabilityStemSeparation  PluginCapability = "stem-separation"
	CapabilityEmbeddings      PluginCapability = "embeddings"
	CapabilityKnowledge       PluginCapability = "knowledge"
	CapabilityRecommendations PluginCapability = "recommendations"
)

// JobStatus representa el estado de un trabajo en el plugin
type JobStatus string

const (
	JobPending    JobStatus = "pending"
	JobProcessing JobStatus = "processing"
	JobCompleted  JobStatus = "completed"
	JobFailed     JobStatus = "failed"
	JobCancelled  JobStatus = "cancelled"
)

// Manifest representa la identidad de un plugin
type Manifest struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Version      string            `json:"version"`
	Capability   PluginCapability  `json:"capability"`
	Description  string            `json:"description"`
	Model        string            `json:"model"`
	Requirements map[string]string `json:"requirements"`
}

// HealthStatus representa el estado de salud del plugin
type HealthStatus struct {
	Status       string    `json:"status"`
	Timestamp    time.Time `json:"timestamp"`
	GPUAvailable bool      `json:"gpu_available"`
	ActiveJobs   int       `json:"active_jobs"`
	ModelCached  bool      `json:"model_cached"`
}

// JobResponse representa la respuesta de un trabajo
type JobResponse struct {
	ID        string            `json:"id"`
	TrackID   string            `json:"track_id"`
	Status    JobStatus         `json:"status"`
	Progress  float64           `json:"progress"`
	Result    map[string]string `json:"result,omitempty"`
	Error     string            `json:"error,omitempty"`
	CreatedAt time.Time         `json:"created_at"`
	UpdatedAt time.Time         `json:"updated_at"`
}

// AIPlugin representa un plugin registrado en el sistema
type AIPlugin struct {
	ID        uuid.UUID              `json:"id"`
	Manifest  Manifest               `json:"manifest"`
	BaseURL   string                 `json:"baseUrl"`
	Health    HealthStatus           `json:"health"`
	IsEnabled bool                   `json:"isEnabled"`
	Config    map[string]interface{} `json:"config"`
}

// RecommendationRequest represents a request for recommendations
type RecommendationRequest struct {
	TrackID  string   `json:"track_id,omitempty"`
	ArtistID string   `json:"artist_id,omitempty"`
	Limit    int      `json:"limit"`
	Context  []string `json:"context,omitempty"` // e.g. "favorites", "recent"
}

// Recommendation represents a recommended item
type Recommendation struct {
	ID     string  `json:"id"`
	Type   string  `json:"type"` // track, artist, album
	Score  float64 `json:"score"`
	Reason string  `json:"reason"`
}

// IPluginClient define la interfaz para comunicarse con cualquier plugin AI (Port)
type IPluginClient interface {
	GetManifest(ctx context.Context, baseURL string) (*Manifest, error)
	GetHealth(ctx context.Context, baseURL string) (*HealthStatus, error)
	CreateJob(ctx context.Context, baseURL string, trackID, filePath string, stems []string) (*JobResponse, error)
	GetJobStatus(ctx context.Context, baseURL string, jobID string) (*JobResponse, error)
	CancelJob(ctx context.Context, baseURL string, jobID string) error
	GetRecommendations(ctx context.Context, baseURL string, req RecommendationRequest) ([]Recommendation, error)
}
