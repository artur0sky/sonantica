# Sonántica AI Plugin: Demucs Stem Separation

**Philosophy:** *"Respect for sound"* - Preserve audio intention through isolation

## Overview

This plugin provides AI-powered stem separation capabilities for Sonántica, allowing users to isolate individual instruments (vocals, drums, bass, other) from mixed audio tracks.

## Architecture

This plugin follows **Clean Architecture** principles with clear separation of concerns:

```
src/
├── domain/              # Core business logic (no external dependencies)
│   ├── entities.py      # Domain entities (SeparationJob, PluginCapability)
│   └── repositories.py  # Abstract interfaces (IJobRepository, IStemSeparator)
│
├── application/         # Use cases (business workflows)
│   └── use_cases.py     # CreateJob, GetStatus, CancelJob, ProcessJob, GetHealth
│
├── infrastructure/      # External adapters & implementations
│   ├── config.py        # Configuration management
│   ├── redis_client.py  # Redis connection singleton
│   ├── redis_job_repository.py  # IJobRepository implementation
│   └── demucs_separator.py      # IStemSeparator implementation
│
└── presentation/        # API layer
    └── routes/          # FastAPI endpoints
        ├── manifest.py  # Plugin discovery
        ├── health.py    # Health checks
        └── jobs.py      # Job management
```

### Design Principles Applied

#### SOLID
- **S**ingle Responsibility: Each class/module has one reason to change
- **O**pen/Closed: Open for extension (swap Demucs for another engine), closed for modification
- **L**iskov Substitution: Any `IStemSeparator` implementation can replace `DemucsStemSeparator`
- **I**nterface Segregation: Small, focused interfaces (`IJobRepository`, `IStemSeparator`)
- **D**ependency Inversion: Use cases depend on abstractions, not concrete implementations

#### Clean Architecture
- **Domain layer** is independent of frameworks and infrastructure
- **Application layer** orchestrates business workflows
- **Infrastructure layer** implements technical details
- **Presentation layer** handles HTTP concerns

#### DRY (Don't Repeat Yourself)
- Configuration centralized in `config.py`
- Redis connection managed by singleton `RedisClient`
- Job state transitions encapsulated in `SeparationJob` entity

## API Contract

This plugin implements the standard Sonántica AI Plugin Contract:

### Discovery
```http
GET /manifest
```
Returns plugin identity and capabilities (public, no auth).

### Health Check
```http
GET /health
```
Returns system status, GPU availability, active jobs, model cache status.

### Job Management
```http
POST /jobs
Headers: X-Internal-Secret: <secret>
Body: {
  "track_id": "string",
  "file_path": "relative/path/to/audio.flac",
  "model": "htdemucs",
  "stems": ["vocals", "drums", "bass", "other"]
}
```

```http
GET /jobs/{job_id}
Headers: X-Internal-Secret: <secret>
```

```http
DELETE /jobs/{job_id}
Headers: X-Internal-Secret: <secret>
```

## Configuration

Environment variables (set in `docker-compose.yml`):

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_HOST` | `redis` | Redis server hostname |
| `REDIS_PORT` | `6379` | Redis server port |
| `REDIS_PASSWORD` | `sonantica` | Redis authentication password |
| `MEDIA_PATH` | `/media` | Path to audio files (read-only) |
| `OUTPUT_PATH` | `/stems` | Path to save separated stems |
| `TORCH_HOME` | `/model_cache/torch` | PyTorch model cache directory |
| `HF_HOME` | `/model_cache/huggingface` | HuggingFace model cache directory |
| `INTERNAL_API_SECRET` | `generate-secure-token-here` | Secret for internal API authentication |
| `MAX_CONCURRENT_JOBS` | `2` | Maximum number of simultaneous separation jobs |
| `JOB_TIMEOUT_SECONDS` | `600` | Job timeout (10 minutes) |
| `LOG_LEVEL` | `INFO` | Logging level |

## Requirements

### Hardware
- **GPU (Recommended):** NVIDIA GPU with 6GB+ VRAM (GTX 1060 or better)
- **CPU Fallback:** Will work on CPU but 10-20x slower
- **Disk:** ~2.5 GB for Demucs models (cached)
- **RAM:** 4-8 GB depending on track length

### Software
- Docker with NVIDIA runtime (for GPU support)
- Python 3.10+
- PyTorch 2.1+ with CUDA support

## Usage

### Enable Plugin
```bash
# Start Sonántica with AI profile
docker compose --profile ai up -d
```

### Check Health
```bash
curl http://localhost:8091/health
```

### Separate Stems (via Go Core)
The plugin is not meant to be called directly. The Go Core service will:
1. Receive user request from frontend
2. Validate authentication
3. Forward to plugin with internal secret
4. Poll for job completion
5. Return results to frontend

## Performance

| Track Length | GPU (RTX 3060) | CPU (i7-10700K) |
|--------------|----------------|-----------------|
| 3 minutes    | ~45 seconds    | ~8 minutes      |
| 5 minutes    | ~1.5 minutes   | ~15 minutes     |
| 10 minutes   | ~3 minutes     | ~30 minutes     |

## Error Handling

The plugin implements graceful degradation:

1. **Transient Errors** (retry): GPU OOM, network timeout
2. **Permanent Errors** (fail): Corrupted audio, unsupported format
3. **Degraded Mode** (fallback): Use CPU if GPU fails

All errors are logged with structured JSON format for monitoring.

## Security

- **Internal API Secret:** All job endpoints require `X-Internal-Secret` header
- **Read-only Media:** Audio files mounted as read-only
- **Isolated Network:** Plugin runs on internal Docker network
- **No Telemetry:** All processing happens locally

## Philosophy Alignment

This plugin embodies Sonántica's core values:

- **Respect for Sound:** High-fidelity separation preserves audio quality
- **User Autonomy:** Opt-in feature, users control when to enable
- **Technical Transparency:** Clear documentation of models and processing
- **Intentional Minimalism:** Simple API, focused functionality

---

*"Sound deserves respect. Technology should serve listening, not distract from it."*
