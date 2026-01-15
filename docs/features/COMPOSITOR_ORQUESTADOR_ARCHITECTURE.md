# Sonántica Compositor & Orquestador — Plugin Architecture
## The Modular DAW Engine: "Eevee's Evolutions"

> **Philosophy**: "Respect the intention of the sound and the freedom of the listener."  
> Sonántica is a **multivalent multimedia player** — like Eevee, it evolves based on user needs.

---

## 🎯 Vision Statement

Sonántica is fundamentally a **music player**, but with the architectural flexibility to evolve into:
- **Compositor**: A DAW-lite for audio editing, mixing, cutting, and manipulation (Audacity/Adobe Audition/FL Studio capabilities)
- **Orquestador**: Advanced multi-channel audio routing and management

**Key Principle**: These are **optional plugins**, not core features. Users who only want to listen to music should never be burdened with DAW complexity.

---

## 🏗️ Architectural Philosophy

### The "Eevee Strategy"
Like Pokémon's Eevee evolves into different forms based on stones/conditions, Sonántica evolves based on **installed plugins**:

- **Base Form (Eevee)**: Pure music player (player-core)
- **Compositor (Flareon)**: Audio editing & manipulation
- **Orquestador (Vaporeon)**: Multi-channel routing
- **Future Evolutions**: Visualizer plugins, AI mastering, etc.

### Plugin Hierarchy
```
┌─────────────────────────────────────────────────────────┐
│                   Sonántica Core                        │
│              (Music Player - Always Active)             │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼────────┐                 ┌────────▼────────┐
│   Compositor   │                 │  Orquestador    │
│    (Plugin)    │                 │    (Plugin)     │
│                │                 │                 │
│ ┌────────────┐ │                 │ ┌─────────────┐ │
│ │  Desktop   │ │                 │ │   Desktop   │ │
│ │  Plugins   │ │                 │ │   Plugins   │ │
│ └────────────┘ │                 │ └─────────────┘ │
│                │                 │                 │
│ ┌────────────┐ │                 │ ┌─────────────┐ │
│ │  Server    │ │                 │ │   Server    │ │
│ │  Plugins   │ │                 │ │   Plugins   │ │
│ │ (Demucs)   │ │                 │ │  (Future)   │ │
│ └────────────┘ │                 │ └─────────────┘ │
└────────────────┘                 └─────────────────┘
```

---

## 📐 Plugin System Architecture

### 1. Plugin Types

#### A. Platform Plugins (Desktop vs Server)
- **Desktop Plugins**: Native Rust/WASM, low-latency, direct hardware access
- **Server Plugins**: Microservices (Python/Go), GPU-accelerated, heavy processing

#### B. Feature Plugins
- **Compositor Plugins**: Audio editing, effects, synthesis
- **Orquestador Plugins**: Routing, mixing, channel management

### 2. Plugin Interface (Rust Trait)

```rust
// packages/plugin-system/src/traits.rs
pub trait SonanticaPlugin: Send + Sync {
    /// Plugin metadata
    fn metadata(&self) -> PluginMetadata;
    
    /// Initialize plugin with host capabilities
    fn initialize(&mut self, host: &dyn PluginHost) -> Result<()>;
    
    /// Process audio (if applicable)
    fn process_audio(&mut self, buffer: &mut AudioBuffer) -> Result<()>;
    
    /// Handle UI events
    fn handle_event(&mut self, event: PluginEvent) -> Result<()>;
    
    /// Cleanup resources
    fn shutdown(&mut self) -> Result<()>;
}

pub struct PluginMetadata {
    pub id: String,
    pub name: String,
    pub version: String,
    pub category: PluginCategory,
    pub platform: PluginPlatform,
    pub capabilities: Vec<PluginCapability>,
}

pub enum PluginCategory {
    Compositor,
    Orquestador,
    Visualizer,
    Effect,
}

pub enum PluginPlatform {
    Desktop,
    Server,
    Both,
}

pub enum PluginCapability {
    AudioProcessing,
    MidiProcessing,
    UIRendering,
    FileIO,
    NetworkIO,
}
```

### 3. Plugin Discovery & Loading

```rust
// apps/desktop/src-tauri/src/plugins/loader.rs
pub struct PluginLoader {
    registry: HashMap<String, Box<dyn SonanticaPlugin>>,
    config: PluginConfig,
}

impl PluginLoader {
    /// Scan plugin directories
    pub fn discover_plugins(&mut self) -> Result<Vec<PluginMetadata>> {
        // Desktop: ~/.sonantica/plugins/
        // Server: Check plugin-* services via API
    }
    
    /// Load plugin dynamically
    pub fn load_plugin(&mut self, id: &str) -> Result<()> {
        match self.get_plugin_type(id) {
            PluginType::Desktop => self.load_native_plugin(id),
            PluginType::Server => self.register_server_plugin(id),
        }
    }
    
    /// Unload plugin and free resources
    pub fn unload_plugin(&mut self, id: &str) -> Result<()> {
        // Graceful shutdown, cleanup
    }
}
```

---

## 🎼 Compositor Plugin Architecture

### Core Responsibilities
- **Audio Editing**: Cut, copy, paste, trim waveforms
- **Effects Processing**: EQ, compression, reverb, etc.
- **Multi-track Mixing**: Layer multiple audio sources
- **Export**: Render to various formats (WAV, FLAC, MP3)

### Module Structure
```
packages/compositor/
├── src/
│   ├── core/
│   │   ├── timeline.rs          # Multi-track timeline
│   │   ├── clip.rs              # Audio clip management
│   │   ├── transport.rs         # Play/pause/record controls
│   │   └── renderer.rs          # Export/bounce engine
│   ├── effects/
│   │   ├── eq.rs                # Parametric EQ
│   │   ├── compressor.rs        # Dynamics processing
│   │   ├── reverb.rs            # Convolution reverb
│   │   └── plugin_chain.rs      # Effect chain manager
│   ├── desktop/
│   │   ├── native_effects.rs    # Low-latency native DSP
│   │   └── hardware_io.rs       # Direct audio I/O
│   └── server/
│       ├── demucs_integration.rs # Stem separation
│       └── gpu_effects.rs        # GPU-accelerated processing
└── Cargo.toml
```

### Desktop vs Server Plugins

#### Desktop Plugins (Default Enabled)
- **Native DSP**: EQ, compressor, limiter (using `dsp` package)
- **Real-time Effects**: Low-latency (<10ms)
- **Direct Hardware**: ASIO/WASAPI for bit-perfect I/O

#### Server Plugins (Disabled by Default on Desktop)
- **Demucs**: AI stem separation (vocals, drums, bass, other)
- **GPU Mastering**: Neural network-based mastering
- **Cloud Rendering**: Offload heavy processing to server

**Rationale**: Desktop users may not have server infrastructure, so server-dependent features are opt-in.

---

## 🎛️ Orquestador Plugin Architecture

### Core Responsibilities
- **Multi-channel Routing**: Route audio to multiple outputs
- **Virtual Mixer**: Per-channel volume, pan, mute, solo
- **Bus Management**: Aux sends, submixes
- **Monitoring**: Real-time metering, spectrum analysis

### Module Structure
```
packages/orquestador/
├── src/
│   ├── core/
│   │   ├── router.rs            # Audio routing matrix
│   │   ├── channel.rs           # Channel strip (vol, pan, fx)
│   │   ├── bus.rs               # Aux/submix buses
│   │   └── meter.rs             # Peak/RMS metering
│   ├── desktop/
│   │   ├── device_manager.rs    # Multi-device output
│   │   ├── asio_router.rs       # ASIO routing
│   │   └── loopback.rs          # System audio capture
│   └── server/
│       └── network_streaming.rs # Stream to remote devices
└── Cargo.toml
```

### Desktop vs Server Plugins

#### Desktop Plugins (Default Enabled)
- **Multi-output Routing**: Send to headphones + speakers simultaneously
- **WASAPI Loopback**: Capture system audio
- **Virtual Cables**: Internal routing (like VoiceMeeter)

#### Server Plugins (Disabled by Default on Desktop)
- **Network Streaming**: Stream audio to remote devices (Chromecast, AirPlay)
- **Multi-room Audio**: Synchronized playback across devices

---

## 🔌 Plugin Configuration System

### User-facing Configuration
```typescript
// packages/shared/src/types/plugins.ts
export interface PluginConfig {
  id: string;
  enabled: boolean;
  platform: 'desktop' | 'server';
  settings: Record<string, any>;
}

export interface CompositorConfig extends PluginConfig {
  settings: {
    defaultSampleRate: number;
    defaultBitDepth: number;
    enableServerEffects: boolean; // Demucs, etc.
  };
}

export interface OrquestadorConfig extends PluginConfig {
  settings: {
    enableMultiOutput: boolean;
    enableLoopback: boolean;
    enableNetworkStreaming: boolean; // Server-only
  };
}
```

### Settings UI
```
Settings > Plugins
├── Compositor
│   ├── [x] Enable Compositor (DAW features)
│   ├── Desktop Plugins
│   │   ├── [x] Native EQ
│   │   ├── [x] Compressor
│   │   └── [x] Reverb
│   └── Server Plugins (requires server connection)
│       ├── [ ] Demucs Stem Separation (disabled on desktop)
│       └── [ ] GPU Mastering
│
└── Orquestador
    ├── [x] Enable Orquestador (Multi-channel routing)
    ├── Desktop Plugins
    │   ├── [x] Multi-output Routing
    │   └── [x] WASAPI Loopback
    └── Server Plugins
        └── [ ] Network Streaming (disabled on desktop)
```

---

## 🚀 Implementation Phases

### Phase 1: Plugin System Foundation (Week 1-2)
**Goal**: Establish plugin infrastructure

| Task | Priority | Status |
|------|----------|--------|
| Create `packages/plugin-system` with trait definitions | 🔴 | 📋 |
| Implement `PluginLoader` in Tauri backend | 🔴 | 📋 |
| Add plugin discovery (filesystem + API) | 🔴 | 📋 |
| Create plugin settings UI | 🟠 | 📋 |
| Add plugin enable/disable functionality | 🟠 | 📋 |

### Phase 2: Compositor Core (Week 3-4)
**Goal**: Basic DAW functionality

| Task | Priority | Status |
|------|----------|--------|
| Create `packages/compositor` package | 🔴 | 📋 |
| Implement timeline & clip management | 🔴 | 📋 |
| Add transport controls (play/pause/record) | 🔴 | 📋 |
| Integrate native DSP effects (EQ, compressor) | 🟠 | 📋 |
| Build waveform editor UI | 🟠 | 📋 |
| Add export/render engine | 🟡 | 📋 |

### Phase 3: Compositor Server Plugins (Week 5)
**Goal**: GPU-accelerated processing

| Task | Priority | Status |
|------|----------|--------|
| Integrate Demucs for stem separation | 🟠 | 📋 |
| Add server plugin detection | 🟠 | 📋 |
| Disable server plugins on desktop by default | 🔴 | 📋 |
| Create fallback UI for missing server plugins | 🟡 | 📋 |

### Phase 4: Orquestador Core (Week 6-7)
**Goal**: Multi-channel routing

| Task | Priority | Status |
|------|----------|--------|
| Create `packages/orquestador` package | 🔴 | 📋 |
| Implement audio routing matrix | 🔴 | 📋 |
| Add channel strip (volume, pan, mute, solo) | 🔴 | 📋 |
| Integrate with existing `studio-core` device manager | 🟠 | 📋 |
| Build mixer UI | 🟠 | 📋 |

### Phase 5: Polish & Integration (Week 8)
**Goal**: Seamless user experience

| Task | Priority | Status |
|------|----------|--------|
| Add plugin marketplace (future) | ⚪ | 📋 |
| Create plugin developer documentation | 🟡 | 📋 |
| Optimize plugin loading performance | 🟠 | 📋 |
| Add plugin crash isolation | 🟠 | 📋 |

---

## 🎨 UI/UX Considerations

### Conditional UI Rendering
```typescript
// Only show Compositor UI if plugin is enabled
{usePluginStore().isEnabled('compositor') && (
  <CompositorWorkspace />
)}

// Show disabled state with explanation
{!usePluginStore().isEnabled('compositor') && (
  <PluginDisabledBanner
    pluginName="Compositor"
    description="Enable DAW features in Settings > Plugins"
  />
)}
```

### Navigation
```
Main Menu (Base Player)
├── Library
├── Queue
├── Playlists
└── Settings

Main Menu (With Compositor Enabled)
├── Library
├── Queue
├── Playlists
├── 🎼 Compositor (NEW)
│   ├── Projects
│   ├── Editor
│   └── Effects
└── Settings

Main Menu (With Orquestador Enabled)
├── Library
├── Queue
├── Playlists
├── 🎛️ Mixer (NEW)
│   ├── Routing
│   ├── Channels
│   └── Buses
└── Settings
```

---

## 🔒 Security & Stability

### Plugin Sandboxing
- **Desktop Plugins**: Run in separate threads with panic handlers
- **Server Plugins**: Network isolation, API key validation

### Resource Limits
```rust
pub struct PluginLimits {
    pub max_memory_mb: usize,      // 500MB default
    pub max_cpu_percent: f32,      // 50% default
    pub max_network_kbps: usize,   // 1000 kbps default
}
```

### Crash Recovery
- Plugin crashes should NOT crash the main player
- Auto-disable misbehaving plugins
- User notification with error logs

---

## 📊 Success Metrics

### Technical
- [ ] Plugins load in <500ms
- [ ] Plugin crashes don't affect core player
- [ ] Desktop plugins work offline
- [ ] Server plugins gracefully degrade when server unavailable

### User Experience
- [ ] Users can disable all plugins and use pure player
- [ ] Plugin settings are intuitive
- [ ] Clear distinction between desktop/server plugins
- [ ] No performance impact when plugins disabled

---

## 🌟 Future Vision

### Plugin Marketplace (Phase 6+)
- Community-developed plugins
- VST/AU plugin bridge
- AI-powered plugins (mastering, mixing, etc.)

### Cross-platform Plugins
- WASM plugins for web/mobile
- Native plugins for desktop
- Server plugins for heavy processing

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-15  
**Status**: Planning Phase  
**Owner**: Sonántica Core Team
