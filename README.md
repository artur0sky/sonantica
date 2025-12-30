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
│  ├─ media-library/    # Indexing, metadata management & search
│  ├─ metadata/         # Low-level metadata extraction (ID3, Vorbis, FLAC)
│  ├─ api-server/       # Self-hosted API for streaming and library sync
│  ├─ audio-analyzer/   # FFT Analysis & waveform generation
│  ├─ dsp/              # Audio processing (EQ, Presets, Gain)
│  ├─ recommendations/  # Discovery engine (similar tracks, artists)
│  ├─ lyrics/           # Synchronized lyrics parsing and management
│  ├─ offline-manager/  # Offline playback and synchronization logic
│  ├─ ui/               # Shared Design System & Components
│  └─ shared/           # Fundamental types & utilities
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

1.  **Asynchronous Audio Engine**: The core audio processing runs independently of the UI main thread.
    *   *Result:* Glitch-free playback even during heavy UI interaction.
    
2.  **GPU-Accelerated Interface**: All animations avoid layout thrashing.
    *   *Result:* Smooth 60fps transitions on any device.

3.  **Smart Persistence**: Batch-write strategy for large libraries.
    *   *Result:* 50-70% faster scans and saves.

4.  **Zero-Allocation Paths**: Audio processing reuses memory buffers.
    *   *Result:* No garbage collection pauses during playback.

See the full [Performance Guide](./docs/PERFORMANCE_OPTIMIZATIONS.md).

## 🚀 Quick Start

### Prerequisites
- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0

### Installation
```bash
# Clone and install
pnpm install

# Build all packages in the correct order
pnpm build

# Start the web application
pnpm dev
```

### Docker Deployment 🐳

For a production-ready environment with localized media support:

```bash
docker compose up -d
```

Configure your library paths in `.env`:
- `MEDIA_PATH`: Your high-fidelity music collection.
- `CONFIG_PATH`: Where Sonántica remembers your preferences.

## 📦 Core Packages

*   **[@sonantica/player-core](./packages/player-core)**: The heartbeat of the system. A framework-agnostic audio engine.
*   **[@sonantica/media-library](./packages/media-library)**: The librarian. Organized indexing and fast search.
*   **[@sonantica/ui](./packages/ui)**: The aesthetic interface. Built with React and Framer Motion.
*   **[@sonantica/audio-analyzer](./packages/audio-analyzer)**: The scientific eye. Visualizing sound with precision.
*   **[@sonantica/dsp](./packages/dsp)**: The studio. Advanced EQ and signal processing.
*   **[@sonantica/api-server](./packages/api-server)**: The tower. Streaming and sync for your personal cloud.
*   **[@sonantica/recommendations](./packages/recommendations)**: The guide. Intelligent discovery based on acoustic features.

## 🛠️ Built With

We stand on the shoulders of giants. Sonántica is made possible by:

- **[React](https://reactjs.org/)**: For a reactive and expressive UI.
- **[TypeScript](https://www.typescriptlang.org/)**: For technical reliability and clarity.
- **[Vite](https://vitejs.dev/)**: For a fast and modern development experience.
- **[Framer Motion](https://www.framer.com/motion/)**: For subtle, functional animations.
- **[Zustand](https://github.com/pmndrs/zustand)**: For minimalist and predictable state management.
- **[Tailwind CSS](https://tailwindcss.com/)**: For our token-based design system.
- **[Tabler Icons](https://tabler.io/icons)**: For clear, professional iconography.

---

## 📄 License

Licensed under the **Apache License, Version 2.0**.

> "Fidelity is not a destination, but a promise."

---

Made with ❤ and **Progressive Rock**.
