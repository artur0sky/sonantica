# AI Integration - Docker Compose Implementation Summary

## Overview
This document summarizes the Docker Compose integration for Sonántica's AI plugin architecture, completed on 2026-01-09.

---

## Files Modified

### 1. `docker-compose.yml` (Development)
**Changes:**
- Added 3 AI plugin services: `plugin-demucs`, `plugin-brain`, `plugin-knowledge`
- All plugins use `profiles: ["ai"]` for opt-in activation
- Configured GPU passthrough via NVIDIA runtime
- Added persistent volumes: `sonantica_ai_cache`, `sonantica_stems`
- Exposed debug ports: 8091 (demucs), 8092 (brain), 8093 (knowledge)

**Key Features:**
- Model caching to prevent re-downloading GBs on restart
- Resource limits (CPU/Memory/GPU)
- Health checks and dependencies
- Structured logging to `logs/ai/`

### 2. `docker-compose.prod.yml` (Production)
**Changes:**
- Added same 3 AI plugin services with production-grade configuration
- Integrated with Traefik reverse proxy
- Routes: `/api/v1/ai/demucs`, `/api/v1/ai/brain`, `/api/v1/ai/knowledge`
- No exposed ports (internal network only)
- Enhanced security with `INTERNAL_API_SECRET` requirement

**Key Features:**
- HTTPS via Let's Encrypt
- Rate limiting and security headers
- Stricter resource reservations
- Production logging format (JSON)

### 3. `.env.example`
**Changes:**
- Added comprehensive AI configuration section
- Security: `INTERNAL_API_SECRET` with generation instructions
- Resource management: `AI_MAX_CONCURRENT_JOBS`, `AI_JOB_TIMEOUT`
- Model configuration: `AI_EMBEDDING_MODEL`, `AI_EMBEDDING_DIM`
- Ollama integration: `OLLAMA_HOST`, `AI_KNOWLEDGE_CACHE_TTL`

---

## New Documentation

### 1. `docs/ai/AI_DOCKER_SETUP.md`
**Content:**
- Comprehensive user guide for AI capabilities
- Installation prerequisites (NVIDIA Docker, Ollama)
- Configuration instructions
- Usage examples for each plugin
- Resource management and monitoring
- Troubleshooting guide
- Privacy and performance benchmarks
- Advanced configuration options

**Philosophy:**
- Aligned with Sonántica's "Wise Craftsman" persona
- Educational tone, technical transparency
- Respects "User Autonomy" principle

### 2. `docs/ai/DOCKER_COMMANDS.md`
**Content:**
- Quick reference for Docker commands
- Starting/stopping services
- Monitoring and logs
- Maintenance tasks
- Troubleshooting commands
- Production checklist
- Useful shell aliases

---

## Architecture Highlights

### Plugin Services

#### 1. **plugin-demucs** (Stem Separation)
- **Base:** Python 3.10 + FFmpeg
- **Model:** Hybrid Transformer Demucs (htdemucs)
- **Resources:** 4-8GB RAM, 6GB VRAM
- **Output:** 4 stems (vocals, drums, bass, other)
- **Storage:** `sonantica_stems` volume

#### 2. **plugin-brain** (Audio Similarity)
- **Base:** PyTorch
- **Model:** CLAP (laion/clap-htsat-unfused)
- **Resources:** 2-6GB RAM, 4GB VRAM
- **Database:** PostgreSQL with pgvector
- **Embedding:** 512-dimensional vectors

#### 3. **plugin-knowledge** (Enrichment)
- **Base:** Go or Python (lightweight)
- **External:** Ollama client
- **Resources:** 128-512MB RAM (no GPU)
- **Cache:** Redis (7 days TTL)

### Shared Infrastructure

#### Volumes
```yaml
sonantica_ai_cache:    # AI models (Torch, HuggingFace)
sonantica_stems:       # Separated audio stems
```

#### Networks
```yaml
sonantica-net:         # Internal bridge network
```

#### Security
- `INTERNAL_API_SECRET`: Shared secret for Core ↔ Plugin auth
- Traefik middlewares: rate limiting, security headers
- No exposed ports in production

---

## Usage Instructions

### Development Mode
```bash
# Start with AI plugins:
docker compose --profile ai up

# Start specific plugin:
docker compose up plugin-demucs

# View logs:
docker compose logs -f plugin-brain
```

### Production Mode
```bash
# Start with AI plugins:
docker compose -f docker-compose.prod.yml --profile ai up -d

# Monitor:
docker compose -f docker-compose.prod.yml logs -f plugin-demucs
```

### Configuration
1. Copy `.env.example` to `.env`
2. Generate `INTERNAL_API_SECRET`:
   ```bash
   openssl rand -hex 32
   ```
3. Configure Ollama host if needed:
   ```bash
   OLLAMA_HOST=http://host.docker.internal:11434
   ```

---

## Integration Points

### Core Service (Go)
**Required Changes:**
- [ ] Implement plugin manager in `services/go-core/internal/plugins/`
- [ ] Add plugin discovery and health checks
- [ ] Create HTTP client for plugin communication
- [ ] Add authentication middleware (validate `INTERNAL_API_SECRET`)
- [ ] Expose capabilities API: `GET /api/v1/system/capabilities`

### Database (PostgreSQL)
**Required Changes:**
- [ ] Enable pgvector extension (already in `data/psql/Dockerfile`)
- [ ] Create `track_embeddings` table:
  ```sql
  CREATE TABLE track_embeddings (
    id SERIAL PRIMARY KEY,
    track_id UUID REFERENCES tracks(id),
    embedding vector(512),
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX ON track_embeddings USING ivfflat (embedding vector_cosine_ops);
  ```

### Frontend (React)
**Required Changes:**
- [ ] Add AI capabilities UI in Settings
- [ ] Implement job status polling or WebSocket
- [ ] Create stem player component
- [ ] Add "Play Similar" feature
- [ ] Display artist/album knowledge enrichment

---

## Testing Checklist

### Docker Compose Validation
- [x] `docker-compose.yml` syntax is valid
- [x] `docker-compose.prod.yml` syntax is valid
- [x] All environment variables have defaults
- [x] Volumes are properly defined
- [x] Networks are configured
- [ ] GPU passthrough works (requires NVIDIA runtime)

### Service Health
- [ ] `plugin-demucs` starts and responds to `/health`
- [ ] `plugin-brain` connects to PostgreSQL
- [ ] `plugin-knowledge` connects to Ollama
- [ ] All plugins register with Redis

### Integration
- [ ] Core can discover plugins via `/manifest`
- [ ] Jobs can be submitted via `POST /jobs`
- [ ] Job status can be queried via `GET /jobs/{id}`
- [ ] Traefik routes work in production

### Performance
- [ ] Model caching prevents re-downloads
- [ ] GPU is utilized (check with `nvidia-smi`)
- [ ] Concurrent job limits are respected
- [ ] Logs are written correctly

---

## Next Steps

### Immediate (Phase 1)
1. Create plugin service directories:
   ```
   services/ai-plugins/
   ├── demucs/
   ├── brain/
   └── knowledge/
   ```
2. Implement Dockerfiles for each plugin
3. Create plugin HTTP APIs (FastAPI or Go)
4. Implement job queue workers

### Short-term (Phase 2)
1. Implement Core plugin manager
2. Add database migrations for `track_embeddings`
3. Create frontend UI components
4. Write integration tests

### Long-term (Phase 3)
1. Add metrics and monitoring (Prometheus)
2. Implement priority queues
3. Add model versioning and migration
4. Create plugin marketplace/registry

---

## Known Limitations

1. **GPU Requirement:** Demucs and Brain plugins require NVIDIA GPU for acceptable performance. CPU fallback is 10-20x slower.
2. **Ollama External:** Knowledge plugin requires Ollama to be running separately (not included in Docker Compose).
3. **Model Size:** Initial download of AI models requires ~4-5 GB of bandwidth and disk space.
4. **Processing Time:** Stem separation takes 2-5 minutes per song on mid-range GPUs.
5. **Windows/Mac Docker Desktop:** GPU passthrough may require additional configuration.

---

## Resources

### Documentation
- [AI Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [AI Docker Setup Guide](./AI_DOCKER_SETUP.md)
- [Docker Commands Reference](./DOCKER_COMMANDS.md)

### External Dependencies
- [Demucs](https://github.com/facebookresearch/demucs)
- [CLAP](https://github.com/LAION-AI/CLAP)
- [Ollama](https://ollama.ai)
- [pgvector](https://github.com/pgvector/pgvector)

### NVIDIA Docker
- [Installation Guide](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)
- [GPU Support](https://docs.docker.com/compose/gpu-support/)

---

## Changelog

### 2026-01-09 - Initial Implementation
- Added AI plugin services to `docker-compose.yml`
- Added AI plugin services to `docker-compose.prod.yml`
- Updated `.env.example` with AI configuration
- Created `AI_DOCKER_SETUP.md` user guide
- Created `DOCKER_COMMANDS.md` quick reference
- Created this summary document

---

## Philosophy Alignment

This implementation adheres to Sonántica's core values:

1. **User Autonomy:** AI features are opt-in via `--profile ai`
2. **Intentional Minimalism:** Plugins are separate, not bloating the core
3. **Technical Transparency:** Full documentation of requirements and limitations
4. **Respect for Sound:** AI enhances understanding, doesn't replace judgment
5. **Open Source:** All components use open models and standards

*"Sound deserves respect. Technology should serve listening, not distract from it."*

---

**Status:** Docker Compose integration complete. Plugin implementation pending.

**Next Milestone:** Implement plugin HTTP APIs and Core integration.
