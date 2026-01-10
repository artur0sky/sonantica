package application

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"sonantica-core/internal/plugins/domain"
)

// Manager gestiona el ciclo de vida y descubrimiento de plugins
type Manager struct {
	client  domain.IPluginClient
	plugins map[string]*domain.AIPlugin
	mu      sync.RWMutex
}

// NewManager crea una instancia del manejador de plugins
func NewManager(client domain.IPluginClient) *Manager {
	return &Manager{
		client:  client,
		plugins: make(map[string]*domain.AIPlugin),
	}
}

// RegisterPlugin añade un plugin a la lista de monitoreo
func (m *Manager) RegisterPlugin(ctx context.Context, baseURL string) error {
	manifest, err := m.client.GetManifest(ctx, baseURL)
	if err != nil {
		return fmt.Errorf("failed to get manifest from %s: %w", baseURL, err)
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	m.plugins[manifest.ID] = &domain.AIPlugin{
		Manifest: *manifest,
		BaseURL:  baseURL,
	}

	log.Printf("✓ Internal Plugin Registered: %s (%s) at %s", manifest.Name, manifest.Capability, baseURL)
	return nil
}

// StartMonitoring inicia el chequeo periódico de salud
func (m *Manager) StartMonitoring(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				m.checkHealth(ctx)
			}
		}
	}()
}

func (m *Manager) checkHealth(ctx context.Context) {
	m.mu.RLock()
	pluginURLs := make(map[string]string)
	for id, p := range m.plugins {
		pluginURLs[id] = p.BaseURL
	}
	m.mu.RUnlock()

	for id, url := range pluginURLs {
		health, err := m.client.GetHealth(ctx, url)
		m.mu.Lock()
		if err != nil {
			log.Printf("⚠ Plugin %s is unreachable: %v", id, err)
			// Podríamos marcar el estado como offline aquí si tuviéramos ese campo
		} else {
			m.plugins[id].Health = *health
		}
		m.mu.Unlock()
	}
}

// GetCapabilities devuelve qué funciones AI están disponibles actualmente
func (m *Manager) GetCapabilities() []domain.Manifest {
	m.mu.RLock()
	defer m.mu.RUnlock()

	caps := make([]domain.Manifest, 0, len(m.plugins))
	for _, p := range m.plugins {
		caps = append(caps, p.Manifest)
	}
	return caps
}

// GetPluginByCapability busca un plugin que pueda hacer algo específico
func (m *Manager) GetPluginByCapability(cap domain.PluginCapability) (*domain.AIPlugin, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, p := range m.plugins {
		if p.Manifest.Capability == cap {
			return p, nil
		}
	}
	return nil, fmt.Errorf("no plugin found with capability: %s", cap)
}

// SeparateStems orquestra el envío de un trabajo al plugin de separación
func (m *Manager) SeparateStems(ctx context.Context, trackID, filePath string) (*domain.JobResponse, error) {
	p, err := m.GetPluginByCapability(domain.CapabilityStemSeparation)
	if err != nil {
		return nil, err
	}

	// Por defecto pedimos todos los stems
	return m.client.CreateJob(ctx, p.BaseURL, trackID, filePath, []string{"vocals", "drums", "bass", "other"})
}

// GetJobStatus consulta el estado de un trabajo en un plugin específico
func (m *Manager) GetJobStatus(ctx context.Context, cap domain.PluginCapability, jobID string) (*domain.JobResponse, error) {
	p, err := m.GetPluginByCapability(cap)
	if err != nil {
		return nil, err
	}

	return m.client.GetJobStatus(ctx, p.BaseURL, jobID)
}
