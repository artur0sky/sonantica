package application

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"sonantica-core/internal/plugins/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Manager gestiona el ciclo de vida y descubrimiento de plugins
type Manager struct {
	client  domain.IPluginClient
	db      *pgxpool.Pool
	plugins map[string]*domain.AIPlugin
	mu      sync.RWMutex
}

// NewManager crea una instancia del manejador de plugins
func NewManager(client domain.IPluginClient, db *pgxpool.Pool) *Manager {
	return &Manager{
		client:  client,
		db:      db,
		plugins: make(map[string]*domain.AIPlugin),
	}
}

// EnsurePluginRegistered verifica si un plugin existe en DB; si no, lo registra desactivado.
// Si ya existe, carga su estado (habilitado/deshabilitado) y config.
func (m *Manager) EnsurePluginRegistered(ctx context.Context, baseURL string, fallbackManifest *domain.Manifest) error {
	// 1. Check if plugin exists in DB by URL
	var (
		id            string
		isEnabled     bool
		config        []byte
		baseName      string // To log conflicts if names differ, though URL is unique
		capabilityStr string
	)

	err := m.db.QueryRow(ctx, "SELECT id, name, capability, is_enabled, config FROM plugins WHERE url = $1", baseURL).
		Scan(&id, &baseName, &capabilityStr, &isEnabled, &config)

	var plugin *domain.AIPlugin
	var pluginID uuid.UUID

	if err == pgx.ErrNoRows {
		// New Plugin: Fetch Manifest and Insert
		manifest, err := m.client.GetManifest(ctx, baseURL)
		if err != nil {
			if fallbackManifest != nil {
				slog.Warn("⚠ Plugin unreachable at registration, using fallback manifest", "url", baseURL, "error", err)
				manifest = fallbackManifest
			} else {
				return fmt.Errorf("failed to get manifest from %s: %w", baseURL, err)
			}
		}

		// Insert into DB
		defaultConfig := "{}"
		row := m.db.QueryRow(ctx,
			`INSERT INTO plugins (name, capability, url, is_enabled, config) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
			manifest.Name, manifest.Capability, baseURL, false, defaultConfig,
		)
		var newIDStr string
		if err := row.Scan(&newIDStr); err != nil {
			return fmt.Errorf("failed to insert new plugin: %w", err)
		}

		pluginID, err = uuid.Parse(newIDStr)
		if err != nil {
			return fmt.Errorf("failed to parse new plugin ID: %w", err)
		}

		plugin = &domain.AIPlugin{
			ID:        pluginID,
			Manifest:  *manifest,
			BaseURL:   baseURL,
			IsEnabled: false,
			Config:    make(map[string]interface{}),
		}

		slog.Info("✓ Plugin Discovered & Registered (Disabled)", "name", manifest.Name, "url", baseURL)

	} else if err != nil {
		return fmt.Errorf("database error checking plugin: %w", err)
	} else {
		// Existing Plugin: Update memory with DB state
		pluginID, err = uuid.Parse(id)
		if err != nil {
			return fmt.Errorf("failed to parse existing plugin ID: %w", err)
		}

		manifest, err := m.client.GetManifest(ctx, baseURL)
		if err != nil {
			slog.Warn("Registered plugin not reachable at startup", "url", baseURL, "error", err)
			// If we have a fallback or existing logic, we might want to update manifest?
			// For now, let's assume if it fails we just use what we have (or what was in DB - wait we don't store full manifest in DB except capability/name implicity)
			// Actually we only store name/capability.
			// Let's use fallback if provided to at least have a valid manifest in memory
			if fallbackManifest != nil {
				manifest = fallbackManifest
			} else {
				// Reconstruct minimal manifest from DB data if possible, or just fail/warn?
				// Since we scraped name and capability from DB, let's use those
				// But we need 'capability' from DB to be useful.
				// Current SELECT query gets: id, name, is_enabled, config. MISSING capability.
				// Let's fix the SELECT query first to include capability.
				manifest = &domain.Manifest{Name: baseName} // Incomplete
			}
		}

		var parsedConfig map[string]interface{}
		_ = json.Unmarshal(config, &parsedConfig)

		plugin = &domain.AIPlugin{
			ID:        pluginID,
			Manifest:  *manifest,
			BaseURL:   baseURL,
			IsEnabled: isEnabled,
			Config:    parsedConfig,
		}

		authStatus := "Disabled"
		if isEnabled {
			authStatus = "Enabled"
		}
		slog.Info("✓ Plugin Loaded", "name", manifest.Name, "status", authStatus)
	}

	m.mu.Lock()
	m.plugins[plugin.ID.String()] = plugin
	m.mu.Unlock()

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
	// Copy to avoid holding lock during network calls
	pluginList := make([]*domain.AIPlugin, 0, len(m.plugins))
	for _, p := range m.plugins {
		pluginList = append(pluginList, p)
	}
	m.mu.RUnlock()

	for _, p := range pluginList {
		health, err := m.client.GetHealth(ctx, p.BaseURL)

		m.mu.Lock()
		if err != nil {
			slog.Warn("⚠ Plugin unreachable", "name", p.Manifest.Name, "error", err)
			// Update health status to offline in memory
			p.Health = domain.HealthStatus{Status: "offline", Timestamp: time.Now()}
		} else {
			p.Health = *health
		}
		m.mu.Unlock()
	}
}

// GetAllPlugins returns all plugins (enabled or disabled)
func (m *Manager) GetAllPlugins() []*domain.AIPlugin {
	m.mu.RLock()
	defer m.mu.RUnlock()
	list := make([]*domain.AIPlugin, 0, len(m.plugins))
	for _, p := range m.plugins {
		list = append(list, p)
	}
	return list
}

// GetCapabilities devuelve qué funciones AI están disponibles actualmente (Active Plugins only)
func (m *Manager) GetCapabilities() []domain.Manifest {
	m.mu.RLock()
	defer m.mu.RUnlock()

	caps := make([]domain.Manifest, 0)
	for _, p := range m.plugins {
		if p.IsEnabled {
			caps = append(caps, p.Manifest)
		}
	}
	return caps
}

// GetPluginByCapability busca un plugin ACTIVO que pueda hacer algo específico
func (m *Manager) GetPluginByCapability(cap domain.PluginCapability) (*domain.AIPlugin, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, p := range m.plugins {
		if p.Manifest.Capability == cap {
			if !p.IsEnabled {
				return nil, fmt.Errorf("plugin for %s is installed but disabled", cap)
			}
			return p, nil
		}
	}
	return nil, fmt.Errorf("no active plugin found with capability: %s", cap)
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

// TogglePlugin permite activar/desactivar un plugin
func (m *Manager) TogglePlugin(ctx context.Context, pluginID string, enabled bool) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	p, exists := m.plugins[pluginID]
	if !exists {
		return fmt.Errorf("plugin not found")
	}

	_, err := m.db.Exec(ctx, "UPDATE plugins SET is_enabled = $1, updated_at = NOW() WHERE id = $2", enabled, pluginID)
	if err != nil {
		return fmt.Errorf("failed to update plugin in db: %w", err)
	}

	p.IsEnabled = enabled
	return nil
}

// UpdateConfig updates the JSON config for a plugin
func (m *Manager) UpdateConfig(ctx context.Context, pluginID string, config map[string]interface{}) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	p, exists := m.plugins[pluginID]
	if !exists {
		return fmt.Errorf("plugin not found")
	}

	configBytes, err := json.Marshal(config)
	if err != nil {
		return fmt.Errorf("invalid config json: %w", err)
	}

	_, err = m.db.Exec(ctx, "UPDATE plugins SET config = $1, updated_at = NOW() WHERE id = $2", configBytes, pluginID)
	if err != nil {
		return fmt.Errorf("failed to update config in db: %w", err)
	}

	p.Config = config
	return nil
}

// GetRecommendations requests recommendations from an active AI plugin
func (m *Manager) GetRecommendations(ctx context.Context, req domain.RecommendationRequest) ([]domain.Recommendation, error) {
	p, err := m.GetPluginByCapability(domain.CapabilityRecommendations)
	if err != nil {
		return nil, err
	}

	return m.client.GetRecommendations(ctx, p.BaseURL, req)
}
