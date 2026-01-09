# Sonántica

> "Respect the intention of the sound and the freedom of the listener."

Sonántica is a professional, open-source multimedia player centered on high-fidelity audio and user autonomy. It is designed not just as a tool for playback, but as a **sound interpreter** that respects the original essence of every file.

## 🎵 Philosophy & Persona

Sonántica embodies the **Wise Craftsman**. It is meticulous with detail, reflective in its approach, and technically skilled without being arrogant. We believe that:

*   **Sound is a language**: Every recording carries an intention that deserves to be heard faithfully.
*   **Listening is an active act**: The player should accompany the listener, not dictate the experience.
*   **Acoustic Aesthetics**: Our interfaces are designed like well-treated rooms—quiet, clean, and free from visual noise.
*   **User Autonomy**: You decide. The software facilitates.

## 🏗️ Architecture

Following strict **Clean Architecture** and **SOLID** principles, Sonántica is built as a modular monorepo. This structure ensures that the core logic remains pure and platform-independent.

### Monorepo Structure

```text
sonantica/
├─ apps/
│  ├─ web/              # Main PWA / Web Interface
│  └─ mobile/           # Native Capacitor Wrapper (Android/iOS)
│
├─ packages/
│  ├─ player-core/      # Audio engine & playback logic (UI-agnostic)
│  ├─ media-library/    # Client-side library index & manager
│  ├─ metadata/         # Low-level metadata extraction (ID3, Vorbis, FLAC)
│  ├─ audio-analyzer/   # FFT Analysis & waveform generation
│  ├─ dsp/              # Audio processing (EQ, Presets, Gain)
│  ├─ recommendations/  # Discovery engine (similar tracks, artists)
│  ├─ lyrics/           # Synchronized lyrics parsing and management
│  ├─ offline-manager/  # Offline playback, downloads & cache
│  ├─ analytics/        # Privacy-first telemetry & metrics
│  ├─ ui/               # Shared Design System & Components
│  └─ shared/           # Fundamental types & utilities
│
├─ services/
│  ├─ go-core/          # Stream Core (API, Streaming, Indexing)
│  └─ python-worker/    # Audio Worker (Analysis, Waveforms)
│
└─ docs/                # Identity, Architecture & Roadmap
```

### Dependency Rules

1.  **Packages don't know apps.**
2.  **Apps never implement domain logic.**
3.  **Communication is by contract.**
4.  **The core runs without a UI.**

### 🛡️ Security First

We treat security not as an afterthought, but as a core quality attribute. Our packages undergo rigorous auditing to ensure:
- **Memory Safety**: Protection against buffer overflows and integer exploits in low-level parsers.
- **Input Sanitization**: Strict validation at all system boundaries (URLs, file paths, parameters).
- **Resilience**: Comprehensive error boundaries and DoS protection (resource limits, timeouts).
- **Transparency**: Security decisions and validations are explicit and documented.

### ⚡ Technical Performance

Sonántica is built to be **invisible**. It should never compete with your music for resources.

1.  **Redis Caching Layer**: Intelligent caching for 90% faster library loads.
    *   *First load:* ~2-5s (PostgreSQL query)
    *   *Subsequent loads:* ~50-200ms (Redis cache) ⚡
    *   *Result:* Near-instant library browsing after initial load.
    
2.  **Virtual Scrolling**: Efficient rendering for large libraries (10,000+ tracks).
    *   *Renders:* Only ~20-30 visible items at a time
    *   *Memory:* Minimal footprint regardless of library size
    *   *Result:* Smooth 60fps scrolling with instant alphabet navigation.

3.  **Asynchronous Audio Engine**: The core audio processing runs independently of the UI main thread.
    *   *Result:* Glitch-free playback even during heavy UI interaction.
    
4.  **GPU-Accelerated Interface**: All animations avoid layout thrashing.
    *   *Result:* Smooth 60fps transitions on any device.

5.  **Smart Persistence**: Batch-write strategy for large libraries.
    *   *Result:* 50-70% faster scans and saves.

6.  **Zero-Allocation Paths**: Audio processing reuses memory buffers.
    *   *Result:* No garbage collection pauses during playback.

#### Performance Metrics

| Operation | Without Cache | With Redis Cache | Improvement |
|-----------|---------------|------------------|-------------|
| Load 1000 tracks | ~2-5s | ~50-200ms | **90% faster** ⚡ |
| Load all artists | ~1-3s | ~30-100ms | **95% faster** ⚡ |
| Load all albums | ~1-3s | ~30-100ms | **95% faster** ⚡ |
| Alphabet navigation | 3-5 clicks | 1 click (instant) | **100% faster** ⚡ |

See the full [Performance Guide](./docs/PERFORMANCE_OPTIMIZATIONS.md).

## 🎧 Getting Started
Sonántica gives you full control. For detailed deployment instructions, including production hardening, resource quotas, and volume configuration, please consult our **[Docker Deployment Guide](./docs/DOCKER.md)**.

### Quick Start (Dev Mode)
For a quick test drive:

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/artur0sky/sonantica.git
    cd sonantica
    ```

2.  **Launch with Docker Compose:**
    ```bash
    # Mounts ./media by default. Music added there will appear automatically.
    docker compose up -d
    ```

3.  **Start Listening:**
    Open [http://localhost:3000](http://localhost:3000).

> **Note:** The system immediately starts indexing your `/media` folder. Initial scanning and acoustic analysis may take time depending on library size. The UI updates in real-time.

### 4. Access the Player

Open your browser and navigate to:
**http://localhost:3000**

---

### 🛠️ Developer Setup (Contribution)

If you wish to contribute to the code:

**Prerequisites:**
- Node.js >= 18.0.0
- pnpm >= 8.0.0

**Installation:**
```bash
# Clone the repository
git clone https://github.com/artur0sky/sonantica.git

# Install dependencies
pnpm install

# Build packages in order
pnpm build

# Start development server
pnpm dev
```

## 📦 Core Packages & Services

### Shared Libraries (`/packages`)
*   **[@sonantica/player-core](./packages/player-core)**: The heartbeat. A UI-agnostic audio engine that manages the playback lifecycle.
*   **[@sonantica/media-library](./packages/media-library)**: The librarian (client). Smart indexing, fuzzy search, and instant library management.
*   **[@sonantica/ui](./packages/ui)**: The face. A token-based design system implementing our "Acoustic Aesthetics".
*   **[@sonantica/dsp](./packages/dsp)**: The studio. Professional 10-band EQ, preamp, and signal processing chain.
*   **[@sonantica/lyrics](./packages/lyrics)**: The interpreter. Synchronized lyrics parsing (LRC) and metadata extraction.
*   **[@sonantica/metadata](./packages/metadata)**: The archivist. High-performance batch metadata extraction.
*   **[@sonantica/offline-manager](./packages/offline-manager)**: The guardian. Robust download orchestration and cache management.
*   **[@sonantica/recommendations](./packages/recommendations)**: The guide. Acoustically-aware discovery engine.
*   **[@sonantica/audio-analyzer](./packages/audio-analyzer)**: The scope. Real-time visualization and metric extraction.
*   **[@sonantica/analytics](./packages/analytics)**: The observer. Privacy-first telemetry and playback insights.
*   **[@sonantica/shared](./packages/shared)**: The foundation. Universal types and contracts.

### Active Services (`/services`)
*   **[Stream Core (Go)](./services/go-core)**: The engine room. High-performance, concurrent streaming server and library manager.
*   **[Audio Worker (Python)](./services/python-worker)**: The analyst. Background process for deep metadata extraction and waveform generation.

## 🛠️ Built With

We stand on the shoulders of giants. Sonántica is made possible by:

- **[React](https://reactjs.org/)**: For a reactive and expressive UI.
- **[TypeScript](https://www.typescriptlang.org/)**: For technical reliability and clarity.
- **[Vite](https://vitejs.dev/)**: For a fast and modern development experience.
- **[CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations/Using_CSS_animations)**: For high-performance, layout-stable animations (Zero Framer Motion).
- **[Zustand](https://github.com/pmndrs/zustand)**: For minimalist and predictable state management.
- **[Tailwind CSS](https://tailwindcss.com/)**: For our token-based design system.
- **[Tabler Icons](https://tabler.io/icons)**: For clear, professional iconography.

---

## 🤝 Contributing

Sonántica welcomes contributions from the community. Like a violinist joining an orchestra, every contribution must follow the rhythm.

**Contribution Flow:**
```
your_feature_branch → development → qa → main
```

All pull requests must:
- Target the `development` branch (not `main`)
- Follow our architectural principles (SOLID, Clean Architecture)
- Pass automated checks (TypeScript, linting, builds)
- Be approved by @artur0sky

**Want to contribute?** Read our comprehensive [**Contributing Guide**](./CONTRIBUTING.md) to get started.

**Want to create your own remix?** Sonántica is open-source! Fork the project and make it your own. See the [Forking & Remixing](./CONTRIBUTING.md#-forking--remixing) section for details.

---

## 📄 License

Licensed under the **Apache License, Version 2.0**.

> "Fidelity is not a destination, but a promise."

---

Made with ❤ and **Progressive Rock**.
