# Plugin System Implementation Plan

This plan outlines the steps to implement a dynamic plugin system for Sonántica, focusing on AI plugins (Brain, Demucs) and their integration into the core experience.

## Objectives
1.  Allow enabling/disabling plugins via Settings.
2.  Persist plugin state and configuration.
3.  Support "Brain" plugin for enhanced recommendations.
4.  Support "Demucs" plugin for stem separation and DSP integration.
5.  Ensure progressive enhancement (core works without plugins).

## Phase 1: Database & Backend Architecture
### 1.1 Database Schema
Create a new table `plugins` to store plugin state and configuration.
```sql
CREATE TABLE IF NOT EXISTS plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    capability VARCHAR(50) NOT NULL, -- 'stem-separation', 'recommendations', etc.
    url VARCHAR(255) NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}', -- Store users thresholds, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 1.2 Go Core Update
-   **Model**: Create `Plugin` struct in `models/plugin.go`.
-   **Manager**: Update `application/manager.go` to:
    -   Load plugins from DB on startup.
    -   Sync with Config (docker-compose urls) - insert if not exists.
    -   Add methods `EnablePlugin`, `DisablePlugin`, `UpdatePluginConfig`.
    -   Expose `GetActivePlugin(capability)` which checks `is_enabled`.

### 1.3 API Endpoints
-   `GET /api/plugins`: List all plugins with status.
-   `POST /api/plugins`: Register new plugin (URL).
-   `PATCH /api/plugins/{id}`: Update status (enable/disable) and config.

## Phase 2: Frontend Settings UI
### 2.1 API Client
-   Update `web/src/services/api.ts` or similar to include plugin endpoints.

### 2.2 Components
-   `PluginCard.tsx`: Display plugin info, status toggle, and config button.
-   `PluginConfigModal.tsx`: Form to edit JSON-based config (thresholds).

### 2.3 Page
-   Create `features/settings/pages/PluginsSettings.tsx`.
-   Add to `SettingsLayout.tsx`.

## Phase 3: Brain Integration (Recommendations)
### 3.1 Backend Logic
-   Modify `api/library.go` or `recommendations` package.
-   In recommendation logic:
    ```go
    plugin, err := manager.GetActivePlugin(domain.CapabilityRecommendations)
    if err == nil {
        // Use AI recommendations
    } else {
        // Fallback to random/basic logic
    }
    ```
-   Pass user modifications (thresholds) from plugin config to the AI request.

## Phase 4: Demucs Integration (DSP)
### 4.1 Backend
-   Existing `SeparateStems` is good.
-   Add endpoint `GET /api/tracks/{id}/stems` to list available stems if processed.

### 4.2 Frontend
-   **Karaoke Mode**: Check if stems exist. If so, allow muting 'vocals'.
-   **DSP**: If stems exist, show 4-band EQ/Volume mixer (Vocals, Drums, Bass, Other).
-   **Track Detail**: "Enhance with AI" button if stems missing + Demucs plugin enabled.

## Phase 5: Testing & Verification
-   Verify default state (plugins disabled).
-   Enable Brain -> Check Discovery changes.
-   Enable Demucs -> Run separation -> Check DSP.
