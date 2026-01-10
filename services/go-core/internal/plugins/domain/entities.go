package domain

import (
	"context"
	"time"
)

// PluginCapability representa el tipo de IA
type PluginCapability string

const (
	CapabilityStemSeparation PluginCapability = "stem-separation"
	CapabilityEmbeddings     PluginCapability = "embeddings"
	CapabilityKnowledge      PluginCapability = "knowledge"
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
	ID           string           `json:"id"`
	Name         string           `json:"name"`
	Version      string           `json:"version"`
	Capability   PluginCapability `json:"capability"`
	Description  string           `json:"description"`
	Model        string           `json:"model"`
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
	Manifest Manifest
	BaseURL  string
	Health   HealthStatus
}

// IPluginClient define la interfaz para comunicarse con cualquier plugin AI (Port)
type IPluginClient interface {
	GetManifest(ctx context.Context, baseURL string) (*Manifest, error)
	GetHealth(ctx context.Context, baseURL string) (*HealthStatus, error)
	CreateJob(ctx context.Context, baseURL string, trackID, filePath string, stems []string) (*JobResponse, error)
	GetJobStatus(ctx context.Context, baseURL string, jobID string) (*JobResponse, error)
	CancelJob(ctx context.Context, baseURL string, jobID string) error
}
