# Sonántica

> "Respect the intention of the sound and the freedom of the listener."

Sonántica is a professional, open-source multimedia player centered on high-fidelity audio and user autonomy. It is designed not just as a tool for playback, but as a **sound interpreter** that respects the original essence of every file.

---

## 📖 Index

- [🎵 Philosophy & Persona](#-philosophy--persona)
- [🏗️ Architecture](#-architecture)
  - [Monorepo Structure](#monorepo-structure)
  - [Core Packages (UI & Engine)](#core-packages-ui--engine)
  - [Active Services (Backend)](#active-services-backend)
  - [Plugins (The Workshop)](#plugins-the-workshop)
  - [Data & Infrastructure](#data--infrastructure)
- [🛡️ Security & Reliability](#-security--reliability)
- [⚡ Technical Performance](#-technical-performance)
- [🎧 Getting Started](#-getting-started)
- [🛠️ Developer Setup](#️-developer-setup-contribution)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🎵 Philosophy & Persona

Sonántica embodies the **Wise Craftsman**. It is meticulous with detail, reflective in its approach, and technically skilled without being arrogant. We believe that:

*   **Sound is a language**: Every recording carries an intention that deserves to be heard faithfully.
*   **Listening is an active act**: The player should accompany the listener, not dictate the experience.
*   **Acoustic Aesthetics**: Our interfaces are designed like well-treated rooms—quiet, clean, and free from visual noise.
*   **User Autonomy**: You decide. The software facilitates.

---

## 🏗️ Architecture

Following strict **Clean Architecture** and **SOLID** principles, Sonántica is built as a modular monorepo. This structure ensures that the core logic remains pure, platform-independent, and easily extensible.

### Monorepo Structure

```text
sonantica/
├─ apps/                # Interface surfaces
│  ├─ [web](./apps/web)          # Main PWA / Web Interface
│  └─ [mobile](./apps/mobile)    # Native Wrapper (Android/iOS)
│
├─ packages/            # Domain logic & reusable UI
│  └─ [Core Libraries...](#core-packages-ui--engine)
│
├─ services/            # Distributed backend processing
│  └─ [Microservices...](#active-services-backend)
│
├─ data/                # Infrastructure & templates
│  ├─ [psql](./data/psql)        # Relational persistence
│  └─ [redis](./data/redis)      # High-speed caching
│
└─ docs/                # [Identity](./docs/project/IDENTITY.md), [Roadmap](./docs/project/ROADMAP.md) & Guides
```

### Core Packages (UI & Engine)

Each package handles a specific responsibility in the audio lifecycle:

*   **[@sonantica/player-core](./packages/player-core)**: The heartbeat. A UI-agnostic engine managing the playback lifecycle.
*   **[@sonantica/ui](./packages/ui)**: The face. A token-based design system. See also the [Expanded Player](./packages/ui/src/components/organisms/ExpandedPlayer) architecture.
*   **[@sonantica/media-library](./packages/media-library)**: The librarian. Smart indexing and fuzzy search on the client.
*   **[@sonantica/dsp](./packages/dsp)**: The studio. Professional 10-band EQ and signal processing chain.
*   **[@sonantica/audio-analyzer](./packages/audio-analyzer)**: The scope. FFT analysis and real-time waveforms.
*   **[@sonantica/metadata](./packages/metadata)**: The archivist. Low-level parsing of ID3, Vorbis, and FLAC.
*   **[@sonantica/lyrics](./packages/lyrics)**: The interpreter. Synchronized lyrics parsing (LRC).
*   **[@sonantica/offline-manager](./packages/offline-manager)**: The guardian. Orchestrates downloads and caching.
*   **[@sonantica/recommendations](./packages/recommendations)**: The guide. Discovery engine based on audio similarity.
*   **[@sonantica/analytics](./packages/analytics)**: The observer. Privacy-first telemetry.
*   **[@sonantica/shared](./packages/shared)**: The foundation. Universal types and contracts.

### Active Services (Backend)

The heavyweight processing is handled by distributed services tuned for specific workloads:

*   **[Stream Core (Go)](./services/go-core)**: The engine room. High-performance streaming and library management.
*   **[Audio Worker (Python)](./services/python-worker)**: The analyst. Background deep analysis and relational indexing.

### Plugins (The Workshop)

The "Workshop" strategy allows Sonántica to extend its capabilities through specialized modules:

*   **[Plugin Downloader](./services/plugin-downloader)**: The procurement engine. Acquisition of external sources with FLAC preservation.
*   **[AI Extensions](./services/ai-plugins)**: Advanced analytical stack for deep acoustic insight:
    *   **[Demucs](./services/ai-plugins/demucs)**: Source separation (Vocals, Drums, Bass, Other).
    *   **[The Brain](./services/ai-plugins/brain)**: Semantic search and audio embeddings.
    *   **[Knowledge](./services/ai-plugins/knowledge)**: LLM-powered context and artist history.

### Data & Infrastructure

*   **[PostgreSQL](./data/psql)**: Primary relational store with `pgvector` for AI similarity.
*   **[Redis](./data/redis)**: Distributed cache and message broker for workers.

---

## 🛡️ Security & Reliability

We treat security not as an afterthought, but as a core quality attribute. Our packages are designed to ensure:

- **Memory Safety**: Protection against buffer overflows in low-level parsers.
- **Input Sanitization**: Strict validation at all system boundaries (URLs, file paths).
- **Resilience**: Comprehensive error boundaries and resource quotas via Docker.

---

## ⚡ Technical Performance

1.  **Redis Caching**: 90% faster library loads (50-200ms) for high-concurrency browsing.
2.  **Virtual Scrolling**: Smooth 60fps interaction with libraries of 10,000+ items.
3.  **Isomeric Workers**: Decoupled audio processing that continues even during heavy UI rendering.
4.  **GPU Animations**: Layout-stable transitions using the "Acoustic Aesthetics" design tokens.

---

## 🎧 Getting Started

Sonántica gives you full control. For detailed deployment instructions, please consult our **[Docker Deployment Guide](./docs/DOCKER.md)**.

### Quick Start (Dev Mode)

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/artur0sky/sonantica.git
    cd sonantica
    ```

2.  **Launch with Docker Compose:**
    ```bash
    docker compose up -d
    ```

3.  **Start Listening:**
    Open [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Developer Setup (Contribution)

**Prerequisites:** Node.js >= 18, pnpm >= 8.

```bash
pnpm install
pnpm build
pnpm dev
```

---

## 🤝 Contributing

Sonántica welcomes contributions. Every pull request must target the `development` branch and follow our architectural rhythm (SOLID, Clean Architecture).

Read our [**Contributing Guide**](./CONTRIBUTING.md) to join the orchestra.

---

## 📄 License

Licensed under the **Apache License, Version 2.0**.

> "Fidelity is not a destination, but a promise."

---

Made with ❤ and **Progressive Rock**.
