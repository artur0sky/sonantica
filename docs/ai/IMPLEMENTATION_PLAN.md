# Implementation Plan: AI Plugin Architecture (Option C)

## Goal Description
Implement an extensible "Plugin Architecture" for Sonántica where AI capabilities (Stem Separation, Recommendation, Knowledge) are provided by optional, standalone Docker containers. The Core system will discover and utilize these capabilities if available, adhering to the "User Autonomy" and "Intentional Minimalism" principles.

## User Review Required
**IMPORTANT**

**Resource Requirements:** The `sonantica-plugin-demucs` and `sonantica-plugin-brain` containers are resource-intensive (RAM/CPU/GPU). Users on low-end hardware (Raspberry Pi) should utilize the opt-in settings to keep these disabled.

## Proposed Architecture

### 1. The Core Registry (Go-Core)
- **Role:** Manages the lifecycle and discovery of plugins.
- **Mechanism:**
  - Plugins register themselves on startup via a Core internal API or are defined statically in `docker-compose`.
  - Core checks health (`GET /health`) periodically.
  - Core exposes capabilities to the Frontend via `GET /api/v1/system/capabilities`.

### 2. The Plugin Contract (HTTP/REST)
All AI plugins must implement a standard interface:
- `GET /manifest`: Returns identity (e.g., "Demucs Separator"), version, and capability type.
- `POST /jobs`: Accepts a task payload (input file path, parameters). Returns a `job_id`.
- `GET /jobs/{id}`: Returns status (pending, processing, completed, failed) and result.
- `DELETE /jobs/{id}`: Cancels a job.

### 3. Data Flow (Async)
- **Trigger:** User requests "Separate Stems" or "Find Similar" in UI.
- **Dispatch:** API -> Go-Core -> Redis Queue (`ai:jobs:{plugin_type}`).
- **Process:** Plugin Worker monitors queue or receives Webhook -> Processes Audio -> Writes Result to Shared Volume.
- **Completion:** Plugin updates Job Status -> Core detects completion -> Updates DB/UI.

### 4. Database Schema Updates (PostgreSQL)
We need to support Vector Search for the "Brain" plugin.
- **Extension:** Enable `pgvector`.
- **Table:** `track_embeddings`
  - `track_id` (FK)
  - `embedding` (`vector(512)` - dimension depends on model)
  - `model_version` (string)

## 5. Technical Requirements & Infrastructure

### 5.1 Docker Compose Strategy (GPU & Persistence)
AI Plugins generate heavy computational load. To ensure acceptable performance and data efficiency, the `docker-compose` definition must include:

1.  **Model Caching:** Map host volumes to `~/.cache` (Torch/HuggingFace) to prevent re-downloading large models (GBs) on container restart.
2.  **GPU Passthrough:** Enable NVIDIA runtime for `demucs` and `brain` containers to achieve real-time or near-real-time processing.

**Configuration Prototype:**
```yaml
services:
  plugin-demucs:
    build:
      context: ./services/ai-plugins/demucs
      dockerfile: Dockerfile
    container_name: sonantica-plugin-demucs
    profiles: ["ai"] # Opt-in only - user must explicitly enable
    environment:
      - TORCH_HOME=/model_cache/torch
      - HF_HOME=/model_cache/huggingface
      - REDIS_HOST=${REDIS_HOST:-redis}
      - REDIS_PORT=${REDIS_PORT:-6379}
      - REDIS_PASSWORD=${REDIS_PASSWORD:-sonantica}
    volumes:
      - ./media:/media:ro
      - sonantica_ai_cache:/model_cache # Critical for persistence
    networks:
      - sonantica-net
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  plugin-brain:
    build:
      context: ./services/ai-plugins/brain
      dockerfile: Dockerfile
    container_name: sonantica-plugin-brain
    profiles: ["ai"]
    environment:
      - TORCH_HOME=/model_cache/torch
      - HF_HOME=/model_cache/huggingface
      - POSTGRES_URL=postgres://${POSTGRES_USER:-sonantica}:${PSQL_PASSWORD:-sonantica}@postgres:${PSQL_PORT:-5432}/${POSTGRES_DB:-sonantica}?sslmode=disable
      - REDIS_HOST=${REDIS_HOST:-redis}
      - REDIS_PORT=${REDIS_PORT:-6379}
      - REDIS_PASSWORD=${REDIS_PASSWORD:-sonantica}
    volumes:
      - ./media:/media:ro
      - sonantica_ai_cache:/model_cache
    networks:
      - sonantica-net
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  plugin-knowledge:
    build:
      context: ./services/ai-plugins/knowledge
      dockerfile: Dockerfile
    container_name: sonantica-plugin-knowledge
    profiles: ["ai"]
    environment:
      - OLLAMA_HOST=${OLLAMA_HOST:-http://host.docker.internal:11434}
      - REDIS_HOST=${REDIS_HOST:-redis}
      - REDIS_PORT=${REDIS_PORT:-6379}
      - REDIS_PASSWORD=${REDIS_PASSWORD:-sonantica}
    networks:
      - sonantica-net
    depends_on:
      redis:
        condition: service_healthy

volumes:
  sonantica_ai_cache:
    driver: local
```

**Notes:**
- **Ollama Strategy:** The `plugin-knowledge` service acts as a client to Ollama. We do NOT include Ollama in `docker-compose.yml` by default due to its size. Users must run Ollama externally or configure `OLLAMA_HOST` to point to their instance.
- **GPU Requirements:** Users without NVIDIA GPUs can still run plugins, but performance will be severely degraded. Consider adding CPU-only fallback configurations or clear documentation warnings.

### 5.2 Shared Contracts & Type Safety
To ensure type safety across the stack (Go Core, Python Plugins, TypeScript Frontend):

**Backend (Go):**
- Define JSON schemas in `services/go-core/internal/plugins/contracts/`
  - `manifest.go`: Plugin identity and capabilities
  - `job.go`: Job request/response structures

**Frontend (TypeScript):**
- Sync types to `packages/shared/src/ai/contracts.ts`
  - Example interfaces:
    ```typescript
    export interface PluginManifest {
      id: string;
      name: string;
      version: string;
      capability: 'stem-separation' | 'embeddings' | 'knowledge';
    }

    export interface SeparationJob {
      id: string;
      trackId: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      progress?: number;
      result?: {
        vocals: string;
        drums: string;
        bass: string;
        other: string;
      };
      error?: string;
    }

    export interface EmbeddingJob {
      id: string;
      trackId: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      embedding?: number[];
      modelVersion?: string;
      error?: string;
    }
    ```

**Recommendation:** Consider using OpenAPI/Swagger to auto-generate types for both Go and TypeScript from a single source of truth.

### 5.3 Directory Structure
Plugin code should reside in the monorepo under `services/ai-plugins/`:

```
services/
├── ai-plugins/
│   ├── demucs/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   └── worker.py
│   ├── brain/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   └── embeddings.py
│   └── knowledge/
│       ├── Dockerfile
│       ├── requirements.txt
│       └── main.py
├── go-core/
│   └── internal/
│       └── plugins/
│           ├── manager.go
│           ├── client.go
│           └── contracts/
│               ├── manifest.go
│               └── job.go
└── python-worker/
    └── ... (existing analytics worker)
```

This structure maintains separation of concerns and prepares for future multi-repo extraction if needed.

### 5.4 Security & Authentication
To prevent unauthorized access to AI plugins, implement a shared secret mechanism:

**Environment Variables:**
```yaml
# In docker-compose.yml for all AI plugins
environment:
  - INTERNAL_API_SECRET=${INTERNAL_API_SECRET:-generate-secure-token-here}
```

**Implementation:**
- **Go-Core:** Sends `X-Internal-Secret` header with every plugin request.
- **Plugins:** Validate the header before processing any job.
- **Rejection:** Return `401 Unauthorized` if the secret doesn't match.

**Token Generation:**
```bash
# Generate a secure token for production
openssl rand -hex 32
```

**Why:** Even though plugins are on an internal network, defense-in-depth prevents accidental exposure or container escape scenarios.

### 5.5 Monitoring & Observability
AI workloads are resource-intensive and prone to silent failures. Implement structured logging and metrics:

**Logging Strategy:**
- **Format:** JSON structured logs for all plugins.
- **Fields:** `timestamp`, `level`, `service`, `job_id`, `track_id`, `duration_ms`, `gpu_utilization`, `error`.
- **Aggregation:** All logs should be written to `/var/log/sonantica` (mounted volume) for centralized collection.

**Key Metrics to Track:**
| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `job_duration_seconds` | Time to complete a job | > 300s for Demucs |
| `job_failure_rate` | % of failed jobs | > 10% |
| `gpu_memory_usage_mb` | GPU VRAM consumption | > 90% |
| `model_cache_size_gb` | Disk space for models | > 50GB |
| `queue_depth` | Pending jobs in Redis | > 20 |

**Implementation:**
- Use Prometheus-compatible metrics endpoints (`GET /metrics`) in each plugin.
- Optionally integrate with existing Flower monitoring for Celery-like visibility.

### 5.6 Error Handling & Retry Policy
AI jobs can fail due to transient issues (OOM, network glitches). Implement graceful degradation:

**Retry Strategy:**
```python
# Pseudo-code for plugin workers
MAX_RETRIES = 3
BACKOFF_MULTIPLIER = 2  # 2s, 4s, 8s

def process_job(job_id):
    for attempt in range(MAX_RETRIES):
        try:
            result = run_ai_model(job_id)
            return result
        except GPUOutOfMemoryError:
            if attempt < MAX_RETRIES - 1:
                clear_gpu_cache()
                sleep(BACKOFF_MULTIPLIER ** attempt)
            else:
                # Fallback to CPU or mark as failed
                return fallback_to_cpu(job_id)
        except Exception as e:
            log_error(job_id, e)
            raise
```

**Failure Modes:**
1. **Transient (Retry):** GPU OOM, network timeout, Redis connection lost.
2. **Permanent (Fail):** Corrupted audio file, unsupported format, model not found.
3. **Degraded (Fallback):** Use CPU if GPU fails, use smaller model if full model OOMs.

**User Notification:**
- Update job status to `failed` with a human-readable error message.
- Frontend should display: *"Stem separation failed due to insufficient GPU memory. Try a shorter track or contact support."*

### 5.7 Resource Limits & Queue Management
Prevent system overload by controlling concurrency and prioritization:

**Concurrency Limits:**
```yaml
# In docker-compose.yml
services:
  plugin-demucs:
    environment:
      - MAX_CONCURRENT_JOBS=2  # Only 2 stems at a time
      - JOB_TIMEOUT_SECONDS=600  # 10 minutes max
```

**Queue Configuration (Redis):**
- **Queue Names:**
  - `ai:jobs:demucs:high` (premium users or small files)
  - `ai:jobs:demucs:normal`
  - `ai:jobs:brain:batch` (library-wide analysis, low priority)

**Priority Logic:**
- User-initiated actions (UI button click) → High priority.
- Background batch jobs (analyze entire library) → Low priority.
- Implement weighted round-robin or priority queue in the plugin worker.

**Resource Reservations (Docker):**
```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 8G
    reservations:
      cpus: '2.0'
      memory: 4G
```

### 5.8 Model Versioning & Migration Strategy
AI models evolve. Plan for seamless upgrades without breaking existing data:

**Version Tracking:**
- The `track_embeddings` table already includes `model_version` (line 39).
- Store version in format: `clap-htsat-unfused-v1.0`.

**Migration Process:**
1. **Deploy New Model:** Update plugin with new model, increment version.
2. **Dual-Write Period:** Generate embeddings with both old and new models for 30 days.
3. **Background Re-analysis:** Celery beat task to re-analyze old tracks.
4. **Deprecation:** After 90 days, remove old model from cache.

**Compatibility Matrix:**
| Model Version | Embedding Dimension | Compatible With |
|---------------|---------------------|-----------------|
| `clap-v1.0` | 512 | All |
| `clap-v2.0` | 768 | v2.0+ only |

**User Control:**
- Settings option: *"Re-analyze library with latest AI models"* (manual trigger).
- Progress bar showing: *"Analyzing 1,234 / 5,000 tracks"*.

### 5.9 UI/UX Specifications
Define the user-facing interface for plugin management, aligned with Sonántica's *"Intentional Minimalism"*:

**Settings → AI Capabilities**

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ AI Capabilities (Optional)                          │
│                                                      │
│ These features require additional resources.        │
│ Enable only if you have a dedicated GPU.            │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🎵 Stem Separation (Demucs)                     │ │
│ │ Status: ● Online                                │ │
│ │ Isolate vocals, drums, bass, and instruments.   │ │
│ │                                                  │ │
│ │ Requirements: NVIDIA GPU, 6GB VRAM              │ │
│ │ Disk Usage: 2.3 GB (models cached)              │ │
│ │                                                  │ │
│ │ [Disable] [View Logs] [Clear Cache]             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🧠 Audio Similarity (Brain)                     │ │
│ │ Status: ● Online                                │ │
│ │ Find tracks that sound similar.                 │ │
│ │                                                  │ │
│ │ Requirements: NVIDIA GPU, 4GB VRAM              │ │
│ │ Analyzed: 1,234 / 5,000 tracks                  │ │
│ │                                                  │ │
│ │ [Re-analyze Library] [View Logs]                │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📚 Knowledge Enrichment (Ollama)                │ │
│ │ Status: ⚠ Offline (Ollama not detected)        │ │
│ │ Fetch artist bios and album context.            │ │
│ │                                                  │ │
│ │ [Configure Ollama URL]                          │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Status Indicators:**
- **● Online (Green):** Plugin is healthy and accepting jobs.
- **⚠ Degraded (Yellow):** Plugin is running but slow (CPU fallback).
- **○ Offline (Gray):** Plugin is disabled or unreachable.
- **✕ Error (Red):** Plugin crashed or misconfigured.

**Interaction Flow:**
1. User clicks **"Separate Stems"** on a track.
2. Modal appears: *"Separating stems... This may take 2-5 minutes."*
3. Progress bar updates in real-time (via WebSocket or polling).
4. On completion: *"Stems ready. [Play Vocals] [Play Drums] [Play Bass] [Play Other]"*

**Voice & Tone (per IDENTITY.md):**
- **Avoid:** "AI-powered separation!" (marketing language)
- **Use:** "Isolate individual instruments." (clear, functional)
- **Avoid:** "Analyzing your music with cutting-edge ML!"
- **Use:** "Finding similar tracks based on audio patterns."

### 5.10 User Documentation
Create user-facing documentation that respects the *"Wise Craftsman"* persona:

**File:** `docs/AI_CAPABILITIES.md`

**Structure:**
```markdown
# AI Capabilities in Sonántica

Sonántica offers optional AI-powered features to help you explore and understand your music library. These are **opt-in** and require additional hardware resources.

## What Are AI Capabilities?

### Stem Separation
**What it does:** Isolates vocals, drums, bass, and other instruments from a mixed track.

**Why it's useful:**
- Practice along with isolated instrument tracks.
- Create karaoke versions by removing vocals.
- Analyze production techniques by listening to individual stems.

**Requirements:**
- NVIDIA GPU with 6GB+ VRAM (GTX 1060 or better)
- ~2.5 GB disk space for models
- Processing time: 2-5 minutes per song

**How to enable:**
1. Ensure you have Docker with NVIDIA runtime installed.
2. Start Sonántica with: `docker-compose --profile ai up`
3. Go to Settings → AI Capabilities → Enable Stem Separation.

---

### Audio Similarity (Recommendations)
**What it does:** Analyzes the sonic characteristics of your tracks to find similar-sounding music.

**Why it's useful:**
- Discover hidden gems in your library.
- Create cohesive playlists based on sound, not just genre tags.
- Understand relationships between different artists.

**Requirements:**
- NVIDIA GPU with 4GB+ VRAM
- ~1.8 GB disk space for models
- Initial analysis: 5-10 seconds per track

**How to enable:**
1. Enable in Settings → AI Capabilities.
2. Click "Analyze Library" (runs in background).
3. Once complete, right-click any track → "Play Similar".

---

### Knowledge Enrichment
**What it does:** Fetches artist biographies, album reviews, and contextual information using Ollama.

**Why it's useful:**
- Learn about the artists you listen to.
- Discover the story behind albums.
- Enrich your listening experience with context.

**Requirements:**
- Ollama running locally or on your network
- Internet connection (for initial data fetch)

**How to enable:**
1. Install Ollama: https://ollama.ai
2. In Sonántica Settings → AI Capabilities → Configure Ollama URL.
3. Right-click any artist → "Learn More".

---

## Privacy & Data

- **All processing happens locally.** Your audio never leaves your machine.
- **No telemetry.** We don't track what you analyze or listen to.
- **Model updates are optional.** You control when to download new AI models.

## Troubleshooting

**"Stem separation is very slow"**
→ Ensure your GPU is detected: `docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi`

**"Brain plugin shows 'Offline'"**
→ Check logs: `docker logs sonantica-plugin-brain`

**"Out of memory errors"**
→ Reduce concurrent jobs in `.env`: `MAX_CONCURRENT_JOBS=1`

---

## Philosophy

These AI features are tools, not magic. They help you **interpret** your music, not replace your judgment. As always, *you decide* what to enable and how to use it.

*"Sound deserves respect. Technology should serve listening, not distract from it."*
```

**Translation Strategy:**
- Provide Spanish version (`docs/AI_CAPABILITIES.es.md`) given the project's bilingual nature.
- Use the same calm, educational tone in both languages.

## Component Implementation

### [A] sonantica-core (Go) - ✅ COMPLETED
- **Status:** Integrated Plugin Manager, client, and API routes.
- **Components:**
  - `services/go-core/internal/plugins/`: Manager, Client, Domain entities.
  - `services/go-core/api/ai.go`: API handlers for discovery and jobs.
  - `services/go-core/models/models.go`: Updated with AI fields.

### [B] sonantica-plugin-demucs (Python) - ✅ COMPLETED
- **Status:** Fully implemented with Clean Architecture
- **Architecture:**
  - **Domain Layer:** Entities (SeparationJob, PluginCapability) and Interfaces (IJobRepository, IStemSeparator)
  - **Application Layer:** Use Cases (CreateJob, GetStatus, CancelJob, ProcessJob, GetHealth)
  - **Infrastructure Layer:** Redis adapter, Demucs adapter, Configuration management
  - **Presentation Layer:** FastAPI routes (manifest, health, jobs)
- **Base Image:** `python:3.10-slim` + `ffmpeg`.
- **Libs:** `demucs`, `fastapi`, `uvicorn`, `redis`, `torch`, `torchaudio`.
- **Endpoints:**
  - `GET /manifest`: Plugin discovery (public)
  - `GET /health`: Health check with metrics
  - `POST /jobs`: Create separation job (authenticated)
  - `GET /jobs/{id}`: Get job status (authenticated)
  - `DELETE /jobs/{id}`: Cancel job (authenticated)
- **Features:**
  - Async job processing with Redis queue
  - GPU acceleration with CPU fallback
  - Lazy loading of heavy dependencies
  - Structured logging (JSON format)
  - Graceful error handling and retry logic
  - State machine for job lifecycle
- **Output:** 4 stems (vocals, drums, bass, other) in `/stems/{job_id}/`
- **Documentation:** See `services/ai-plugins/demucs/README.md`

### [C] sonantica-plugin-brain (Python) - ✅ COMPLETED
- **Status:** Fully implemented with Clean Architecture.
- **Base Image:** `pytorch/pytorch`.
- **Libs:** `torchaudio`, `transformers` (Hugging Face), `pgvector`.
- **Function:**
  - **Embeddings Model:** `laion/clap-htsat-unfused` (Music-Audio-Text).
  - Handles `POST /jobs` and provides embeddings for pgvector.

### [D] sonantica-plugin-knowledge (Go/Python) - ⏸️ ON HOLD
- **Status:** Postponed until metadata APIs are integrated.
- **Function:** Middleman to Ollama.
- **Logic:**
  - `POST /jobs/enrich`: Takes Artist/Album -> Prompts Ollama ("Tell me about...") -> Returns JSON.

## 6. Strategic Evolution (Max-ROI Features)

To maximize the Return on Investment (ROI) of heavy AI containers (GBs of RAM/GPU), the system will evolve beyond basic utility towards "Creative & Deep Listening":

### 6.1 Plugin: Demucs (Active Listening)
*   **Isolation Faders:** Transition from "Separation" to "Mixing". Real-time faders to lower vocals for ambient focus or karaoke without losing quality.
*   **Multi-Stem EQ:** Apply independent equalization to stems (e.g., boost the "Bass" stem without muddying the vocal "Stem").
*   **Constituent Waveforms:** Instead of a single waveform, display 4 synchronized layers (Vocals, Drums, Bass, Other) showing the "architecture" of the track.

### 6.2 Plugin: Brain (Intentional Discovery)
*   **Semantic Search:** Enable natural language queries like *"Música melancólica de piano para una mañana de lluvia"* using vector embeddings.
*   **Sonic Map (2D/3D):** Interactive visual galaxy where tracks are positioned by sonic similarity, allowing physical "navigation" through the library.
*   **Smart Transitions:** Use BPM and Key detection to perform automated, beat-matched crossfades between tracks.

### 6.3 Plugin: Knowledge (The Digital Documentarist)
*   **Lyric Explainer (Ollama):** Local LLM integration to explain metaphors or cultural context in lyrics (e.g., *"Explain the subtext of this verse"*).
*   **Relationship Graph:** Visualize hidden connections (e.g., *"This drummer also played on these 5 other tracks in your library"*).
*   **Fidelity Validator:** Technical audit comparing metadata vs audio spectrum (e.g., *"Warning: This FLAC appears to be an upscale from a lossy MP3"*).

---

## 7. Verification Plan

### Automated Tests
- **Contract Tests:** Ensure each plugin image responds correctly to `GET /manifest` and `GET /health`.
- **Flow Tests:** Mock the plugin response in Go-Core and verify that the UI receives the "Job Completed" event.

### Manual Verification
1. **Docker Up:** Start with `docker-compose --profile ai up`.
2. **Discovery:** Open **Settings -> AI Plugins**. Verify "Demucs" and "Brain" are listed as "Online".
3. **Separation:**
   - Upload a song.
   - Click "Separate Stems".
   - Monitor logs: `sonantica-plugin-demucs` should show progress.
   - Verify 4 new files appear in the track folder.
4. **Recommendation:**
   - Analyze library (Brain).
   - Go to a track -> "Play Similar".
   - Verify the playlist makes sense sonically.