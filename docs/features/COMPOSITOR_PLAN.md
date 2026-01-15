# Sonántica Compositor — Implementation Plan
## Professional Audio Engine: Advanced Routing & Recording

> **Philosophy**: "Respect the intention of the sound and the freedom of the listener."  
> This plan extends Sonántica from a multimedia player to a **lightweight audio compositor** with professional routing and recording capabilities.

---

## 📋 Executive Summary

### Vision
Transform the Tauri desktop app from a web-wrapped player into a **hybrid audio workstation** that combines:
- **Professional routing**: Multi-device output, virtual cables, loopback capture
- **High-fidelity recording**: Bit-perfect, low-latency, multi-track capture
- **Sonántica's soul**: Minimalist UI, technical transparency, user autonomy

### Technical Strategy
- **Current Core** (`player-core`): Remains for standard playback (web, mobile)
- **New Studio Core** (`studio-core`): Rust-based audio engine for desktop-exclusive features
- **Architecture**: Clean separation following SOLID principles, zero impact on existing platforms

---

## 🎯 Core Objectives

1. **Professional Audio I/O**
   - Direct access to WASAPI/ASIO/CoreAudio
   - Exclusive mode for bit-perfect playback
   - Low-latency monitoring (<10ms round-trip)

2. **Flexible Routing**
   - Multi-output (send to multiple devices simultaneously)
   - Virtual patchbay (any input → any output)
   - WASAPI Loopback capture (record system audio)

3. **High-Fidelity Recording**
   - Lock-free real-time recording
   - Support for WAV (PCM), FLAC, and future formats
   - Multi-track session management

4. **Transparent UX**
   - Real-time peak meters and spectrum analysis
   - Technical inspector showing buffer size, sample rate, bit depth
   - Educational tooltips explaining audio concepts

---

## 🏗️ Technology Stack

### Rust Crates (Tauri Backend)

| Crate | Purpose | Priority |
|-------|---------|----------|
| **`cpal`** | Cross-platform audio I/O (WASAPI, ASIO, CoreAudio) | 🔴 Critical |
| **`ringbuf`** | Lock-free ring buffer for real-time audio | 🔴 Critical |
| **`hound`** | WAV file writing | 🟠 High |
| **`symphonia`** | Advanced codec support (FLAC, etc.) | 🟡 Medium |
| **`rubato`** | High-quality sample rate conversion | 🟡 Medium |
| **`anyhow`** | Ergonomic error handling | 🔴 Critical |

### Frontend Integration
- **Tauri Commands**: Async bridge between Rust and TypeScript
- **Tauri Events**: Real-time audio metrics (peak levels, spectrum data)
- **Canvas/WebGL**: Waveform visualization

---

## 📐 Architecture

### Layer Separation

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (React/TS)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Studio View  │  │ Mixer Panel  │  │ Recorder UI  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▲ Tauri Commands/Events
┌─────────────────────────────────────────────────────────────┐
│              Studio Core (Rust - Tauri Backend)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Device Mgr   │  │ Stream Mgr   │  │ Recorder Svc │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Patchbay     │  │ DSP Chain    │  │ Meter Engine │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▲ cpal API
┌─────────────────────────────────────────────────────────────┐
│                   OS Audio Layer                            │
│         WASAPI (Win) | CoreAudio (Mac) | ALSA (Linux)       │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

```
apps/desktop/src-tauri/src/
├── services/
│   ├── audio/
│   │   ├── mod.rs              # Public API
│   │   ├── device_manager.rs   # Device enumeration
│   │   ├── stream_manager.rs   # Audio stream lifecycle
│   │   ├── patchbay.rs         # Routing matrix
│   │   ├── recorder.rs         # Recording engine
│   │   └── meter.rs            # Peak/RMS metering
│   ├── metadata/               # Existing
│   └── filesystem/             # Existing
├── commands/
│   ├── audio.rs                # Tauri commands for audio
│   └── ...
└── models/
    ├── audio.rs                # AudioDevice, AudioConfig, etc.
    └── ...
```

---

## 🚀 Implementation Phases

### Phase 1: Audio Engine Foundation (Week 1-2)
**Status**: ✅ Backend Complete | 🚧 Frontend Pending  
**Goal**: Establish Rust audio infrastructure without breaking existing functionality

#### Tasks

| ID | Task | Owner | Status | Priority |
|----|------|-------|--------|----------|
| 1.1 | Add `cpal`, `ringbuf`, `hound`, `anyhow` to `Cargo.toml` | - | ✅ | 🔴 |
| 1.1b | Add `tracing`, `tracing-subscriber`, `tracing-appender` for logging | - | ✅ | 🔴 |
| 1.2 | Create `services/audio/` module structure | - | ✅ | 🔴 |
| 1.3 | Implement `DeviceManager::list_devices()` | - | ✅ | 🔴 |
| 1.4 | Expose `get_audio_devices()` Tauri command | - | ✅ | 🔴 |
| 1.5 | Create `AudioDevice` model with Serde serialization | - | ✅ | 🔴 |
| 1.6 | Add unit tests for device enumeration | - | ✅ | 🟠 |
| 1.7 | Create "Studio Settings" UI page (minimal) | - | 📋 | 🟠 |
| 1.8 | Display available input/output devices in UI | - | 📋 | 🟠 |

**Progress**: 6/9 tasks complete (67%)  
**Backend**: ✅ 100% Complete  
**Frontend**: 📋 0% Complete

#### Deliverables
- ✅ Rust can enumerate audio devices on Windows/Mac/Linux
- ✅ Structured logging system (JSON/Pretty formatters)
- ✅ Three Tauri commands exposed (`get_audio_devices`, `get_default_input_device`, `get_default_output_device`)
- ✅ Unit tests passing
- ✅ Production build successful (`Sonántica_0.1.0_x64-setup.exe`)
- ✅ Zero impact on existing playback functionality
- ✅ Documentation: `COMPOSITOR_PHASE1_COMPLETE.md`
- ⏭️ Frontend UI for device display (next)

---

### Phase 2: Routing & Monitoring (Week 3-4)
**Status**: 📋 Planned  
**Goal**: Implement Voicemeeter-style audio routing

#### Tasks

| ID | Task | Status | Priority |
|----|------|--------|----------|
| 2.1 | Implement `StreamManager` for audio stream lifecycle | 📋 | 🔴 |
| 2.2 | Create `Patchbay` for input→output routing | 📋 | 🔴 |
| 2.3 | Implement multi-output (send to 2+ devices) | 📋 | 🟠 |
| 2.4 | Add WASAPI Loopback capture support | 📋 | 🟠 |
| 2.5 | Implement real-time peak metering | 📋 | 🟠 |
| 2.6 | Create Tauri event stream for meter data | 📋 | 🟠 |
| 2.7 | Build "Mixer Panel" UI with VU meters | 📋 | 🟡 |
| 2.8 | Add routing preset save/load | 📋 | 🟡 |

#### Deliverables
- ✅ User can route audio to multiple outputs
- ✅ Real-time visual feedback (peak meters)
- ✅ Loopback capture functional
- ✅ Routing configurations persist

---

### Phase 3: Recording Engine (Week 5-6)
**Status**: 📋 Planned  
**Goal**: Implement Audacity-style recording with bit-perfect quality

#### Tasks

| ID | Task | Status | Priority |
|----|------|--------|----------|
| 3.1 | Implement lock-free ring buffer for audio capture | 📋 | 🔴 |
| 3.2 | Create `RecorderService` with start/stop/pause | 📋 | 🔴 |
| 3.3 | Integrate `hound` for WAV writing | 📋 | 🔴 |
| 3.4 | Add FLAC encoding support (via `symphonia`) | 📋 | 🟠 |
| 3.5 | Implement file writer thread (separate from audio thread) | 📋 | 🔴 |
| 3.6 | Add recording session metadata (timestamp, device, format) | 📋 | 🟡 |
| 3.7 | Create "Transport Controls" UI (REC, STOP, PAUSE) | 📋 | 🟠 |
| 3.8 | Implement real-time waveform visualization during recording | 📋 | 🟡 |
| 3.9 | Add automatic file naming and organization | 📋 | 🟡 |

#### Deliverables
- ✅ Record from any input device to WAV/FLAC
- ✅ Zero audio dropouts (lock-free architecture)
- ✅ Professional transport controls
- ✅ Recordings auto-indexed in library

---

### Phase 4: Advanced Features (Week 7-8)
**Status**: 📋 Planned  
**Goal**: Polish and differentiation

#### Tasks

| ID | Task | Status | Priority |
|----|------|--------|----------|
| 4.1 | Implement sample rate conversion (via `rubato`) | 📋 | 🟡 |
| 4.2 | Add ASIO support for ultra-low latency | 📋 | 🟡 |
| 4.3 | Create "Technical Inspector" panel (buffer size, latency, etc.) | 📋 | 🟠 |
| 4.4 | Implement multi-track recording | 📋 | 🟡 |
| 4.5 | Add DSP chain (EQ, compressor) to recording path | 📋 | ⚪ |
| 4.6 | Create educational tooltips for audio concepts | 📋 | 🟡 |
| 4.7 | Implement "Zen Mode" for distraction-free recording | 📋 | 🟡 |
| 4.8 | Add plugin system for custom DSP modules | 📋 | ⚪ |

#### Deliverables
- ✅ Professional-grade latency (<5ms with ASIO)
- ✅ Multi-track session support
- ✅ Educational UX ("The Wise Craftsman")
- ✅ Extensible DSP architecture

---

## 🎨 UX Design Principles

### Visual Identity
- **Minimalist**: No clutter, focus on the audio
- **Technical**: Show real metrics (not fake animations)
- **Educational**: Explain concepts without condescension
- **Elegant**: Professional tools deserve professional design

### Key UI Components

1. **Studio Settings Page**
   - Device selection (input/output)
   - Sample rate, bit depth, buffer size
   - Exclusive mode toggle
   - Latency monitor

2. **Mixer Panel**
   - Routing matrix (visual patchbay)
   - Per-channel VU meters
   - Mute/Solo/Gain controls
   - Preset management

3. **Recorder View**
   - Transport controls (REC/STOP/PAUSE)
   - Real-time waveform
   - Time counter
   - Format selector (WAV/FLAC)
   - Input level meter with clip indicator

4. **Technical Inspector**
   - Current buffer size
   - Actual latency (measured)
   - Sample rate, bit depth
   - Audio thread CPU usage
   - Dropout counter

---

## 🔒 Quality Assurance

### Performance Targets
- **Latency**: <10ms round-trip (WASAPI), <5ms (ASIO)
- **CPU Usage**: <5% on audio thread (single stream)
- **Dropouts**: Zero in 1-hour continuous recording
- **Memory**: <50MB for audio engine (excluding buffers)

### Testing Strategy
1. **Unit Tests**: All audio services (device enumeration, routing logic)
2. **Integration Tests**: End-to-end recording scenarios
3. **Stress Tests**: 24-hour continuous recording
4. **Platform Tests**: Windows 10/11, macOS 12+, Ubuntu 22.04+

### Security Considerations
- **File Permissions**: Validate recording paths (prevent directory traversal)
- **Device Access**: Request permissions properly (especially macOS)
- **Buffer Overflows**: Use Rust's memory safety guarantees
- **Resource Limits**: Cap maximum recording duration/file size

---

## 📊 Success Metrics

### Technical Excellence
- [ ] Zero audio dropouts in 24-hour test
- [ ] Latency within 10ms of theoretical minimum
- [ ] All audio operations lock-free
- [ ] 100% test coverage for critical paths

### User Experience
- [ ] Device setup takes <2 minutes
- [ ] Recording starts in <1 second
- [ ] UI remains responsive during recording
- [ ] Technical Inspector helps users optimize settings

### Code Quality
- [ ] All modules follow SOLID principles
- [ ] Zero `unsafe` blocks in audio hot-path
- [ ] Comprehensive error handling (no panics)
- [ ] API documentation for all public functions

---

## 🚧 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Platform-specific audio bugs | 🔴 High | Extensive testing on all platforms, fallback to safe defaults |
| Real-time performance issues | 🔴 High | Lock-free algorithms, dedicated audio thread, profiling |
| Complex UI overwhelming users | 🟠 Medium | Progressive disclosure, sane defaults, educational tooltips |
| Scope creep | 🟡 Low | Strict phase gates, MVP-first approach |

---

## 📚 Documentation Plan

### Developer Docs
- `AUDIO_ARCHITECTURE.md`: Deep dive into audio engine design
- `CONTRIBUTING_AUDIO.md`: How to add new audio features
- `TESTING_AUDIO.md`: Audio testing guidelines

### User Docs
- "Getting Started with Studio Mode"
- "Understanding Audio Routing"
- "Recording Best Practices"
- "Troubleshooting Audio Issues"

---

## 🎯 Current Status & Next Steps

### Phase 1 Progress (Backend Complete ✅)
1. ✅ Create implementation plan (`STUDIO_CORE_PLAN.md`)
2. ✅ Update `Cargo.toml` with audio dependencies
3. ✅ Add structured logging dependencies (`tracing` ecosystem)
4. ✅ Create `services/audio/` module structure
5. ✅ Implement device enumeration with logging
6. ✅ Expose Tauri commands (`get_audio_devices`, `get_default_input_device`, `get_default_output_device`)
7. ✅ Add unit tests
8. ✅ Verify production build (`Sonántica_0.1.0_x64-setup.exe`)
9. 📋 **NEXT**: Build Studio Settings UI page
10. 📋 **NEXT**: Display audio devices in frontend

**Backend Status**: ✅ 100% Complete (6/6 tasks)  
**Frontend Status**: 📋 Pending (0/2 tasks)  
**Overall Phase 1**: 67% Complete

**Estimated Time Remaining**: 2-3 days (frontend UI)  
**Blocking Dependencies**: None  
**Risk Level**: Low (UI only, backend proven)

---

## 🌟 Vision Statement

> "Sonántica Compositor transforms listening into creation. By respecting the raw material of sound and empowering the user with professional tools, we enable a new generation of audio craftsmen to capture, route, and shape audio with intention and precision."

This is not just a feature addition—it's the evolution of Sonántica from a **player** to a **compositor's workshop**.

---

**Document Version**: 1.1  
**Last Updated**: 2026-01-15  
**Status**: Phase 1 Backend Complete (67% overall) | Frontend Pending  
**Owner**: Sonántica Core Team
