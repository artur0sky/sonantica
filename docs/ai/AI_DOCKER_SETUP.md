# AI Capabilities in Sonántica

Sonántica offers optional AI-powered features to help you explore and understand your music library. These are **opt-in** and require additional hardware resources.

> **Philosophy:** These AI features are tools, not magic. They help you **interpret** your music, not replace your judgment. As always, *you decide* what to enable and how to use it.

---

## What Are AI Capabilities?

### 🎵 Stem Separation (Demucs)
**What it does:** Isolates vocals, drums, bass, and other instruments from a mixed track.

**Why it's useful:**
- Practice along with isolated instrument tracks
- Create karaoke versions by removing vocals
- Analyze production techniques by listening to individual stems
- Study mixing and mastering decisions

**Requirements:**
- NVIDIA GPU with 6GB+ VRAM (GTX 1060 or better recommended)
- ~2.5 GB disk space for AI models
- Processing time: 2-5 minutes per song (GPU) / 15-30 minutes (CPU)

**Technical Details:**
- Model: Hybrid Transformer Demucs (htdemucs)
- Output: 4 stems (vocals, drums, bass, other)
- Format: Same as source (FLAC/WAV/MP3)

---

### 🧠 Audio Similarity (Brain)
**What it does:** Analyzes the sonic characteristics of your tracks to find similar-sounding music.

**Why it's useful:**
- Discover hidden gems in your library
- Create cohesive playlists based on sound, not just genre tags
- Understand relationships between different artists
- Find tracks with similar mood, tempo, or instrumentation

**Requirements:**
- NVIDIA GPU with 4GB+ VRAM
- ~1.8 GB disk space for AI models
- Initial analysis: 5-10 seconds per track
- PostgreSQL with pgvector extension (included)

**Technical Details:**
- Model: CLAP (Contrastive Language-Audio Pretraining)
- Embedding dimension: 512
- Similarity metric: Cosine distance
- Database: Vector search via pgvector

---

### 📚 Knowledge Enrichment (Ollama)
**What it does:** Fetches artist biographies, album reviews, and contextual information using local AI.

**Why it's useful:**
- Learn about the artists you listen to
- Discover the story behind albums
- Enrich your listening experience with context
- No external API dependencies or tracking

**Requirements:**
- Ollama running locally or on your network
- ~4-7 GB disk space (per model, e.g., llama3)
- Internet connection (for initial model download only)

**Technical Details:**
- Client-only service (Ollama runs separately)
- Cached responses (7 days default)
- Supports any Ollama-compatible model

---

## Installation & Setup

### Prerequisites

1. **Docker with GPU Support (for Demucs & Brain)**
   ```bash
   # Install NVIDIA Container Toolkit
   # Ubuntu/Debian:
   distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
   curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
   curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
   sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
   sudo systemctl restart docker
   
   # Verify GPU is accessible:
   docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
   ```

2. **Ollama (for Knowledge Plugin)**
   ```bash
   # Install Ollama:
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Pull a model (e.g., llama3):
   ollama pull llama3
   
   # Verify it's running:
   curl http://localhost:11434/api/tags
   ```

### Configuration

1. **Copy and edit environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Generate secure API secret:**
   ```bash
   # Linux/macOS:
   openssl rand -hex 32
   
   # Windows (PowerShell):
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
   ```

3. **Update `.env` with your settings:**
   ```bash
   # Security (REQUIRED for production)
   INTERNAL_API_SECRET=your-generated-secret-here
   
   # Resource limits (adjust based on your hardware)
   AI_MAX_CONCURRENT_JOBS=2
   AI_JOB_TIMEOUT=600
   
   # Ollama connection (if using Knowledge plugin)
   OLLAMA_HOST=http://host.docker.internal:11434
   ```

### Starting AI Services

**Development:**
```bash
# Start all services including AI plugins:
docker compose --profile ai up

# Or start specific plugins:
docker compose up plugin-demucs  # Stem separation only
docker compose up plugin-brain   # Audio similarity only
```

**Production:**
```bash
# Start with AI capabilities:
docker compose -f docker-compose.prod.yml --profile ai up -d

# Verify plugins are running:
docker compose -f docker-compose.prod.yml ps
```

**Stopping AI Services:**
```bash
# Stop all AI plugins:
docker compose stop plugin-demucs plugin-brain plugin-knowledge

# Or stop everything:
docker compose down
```

---

## Usage

### Stem Separation

1. Navigate to a track in your library
2. Click **"Separate Stems"** (or right-click → AI → Separate)
3. Monitor progress in the UI (modal shows real-time status)
4. Once complete, play individual stems:
   - **Vocals**: Isolated voice/singing
   - **Drums**: Percussion and rhythm
   - **Bass**: Low-frequency instruments
   - **Other**: Everything else (guitars, synths, etc.)

**Note:** Stems are stored in `/stems/{track_id}/` and persist across restarts.

### Audio Similarity

1. **Initial Setup:**
   - Go to **Settings → AI Capabilities**
   - Click **"Analyze Library"** (runs in background)
   - Progress shown: *"Analyzing 1,234 / 5,000 tracks"*

2. **Find Similar Tracks:**
   - Right-click any track → **"Play Similar"**
   - Or click **"Similar"** button in track details
   - Sonántica generates a playlist of sonically similar tracks

**Note:** Analysis runs once per track. Re-run manually if you update your library.

### Knowledge Enrichment

1. Ensure Ollama is running and accessible
2. Right-click an artist → **"Learn More"**
3. View AI-generated biography and context
4. Cached for 7 days (configurable via `AI_KNOWLEDGE_CACHE_TTL`)

---

## Resource Management

### Disk Space

AI models are cached to prevent re-downloading:

| Component | Size | Location |
|-----------|------|----------|
| Demucs models | ~2.5 GB | `sonantica_ai_cache:/model_cache/torch` |
| CLAP embeddings | ~1.8 GB | `sonantica_ai_cache:/model_cache/huggingface` |
| Separated stems | Varies | `sonantica_stems:/stems` |
| Ollama models | 4-7 GB | External (Ollama directory) |

**Clear cache:**
```bash
# Remove AI model cache (will re-download on next use):
docker volume rm sonantica_ai_cache

# Remove separated stems:
docker volume rm sonantica_stems
```

### GPU Memory

| Plugin | VRAM Usage | Recommended GPU |
|--------|------------|-----------------|
| Demucs | 4-6 GB | GTX 1060 6GB+ |
| Brain | 2-4 GB | GTX 1050 Ti+ |
| Both | 6-8 GB | RTX 2060+ |

**CPU Fallback:**
Plugins will run on CPU if GPU is unavailable, but expect **10-20x slower** processing.

### Concurrency

Control how many jobs run simultaneously:
```bash
# In .env:
AI_MAX_CONCURRENT_JOBS=2  # Reduce to 1 on low-end hardware
```

---

## Monitoring & Logs

### Check Plugin Status

**Via Docker:**
```bash
# View running AI services:
docker compose ps | grep plugin

# Check logs:
docker compose logs -f plugin-demucs
docker compose logs -f plugin-brain
docker compose logs -f plugin-knowledge
```

**Via UI:**
- Go to **Settings → AI Capabilities**
- Status indicators:
  - **● Online (Green)**: Plugin is healthy and accepting jobs
  - **⚠ Degraded (Yellow)**: Running but slow (CPU fallback)
  - **○ Offline (Gray)**: Plugin is disabled or unreachable
  - **✕ Error (Red)**: Plugin crashed or misconfigured

### Log Files

Structured JSON logs are written to:
```
logs/
├── ai/
│   ├── demucs/
│   ├── brain/
│   └── knowledge/
```

**Example log entry:**
```json
{
  "timestamp": "2026-01-09T18:30:00Z",
  "level": "INFO",
  "service": "plugin-demucs",
  "job_id": "sep_abc123",
  "track_id": "track_456",
  "duration_ms": 180000,
  "gpu_utilization": 85,
  "status": "completed"
}
```

---

## Troubleshooting

### "Stem separation is very slow"
**Cause:** GPU not detected or CPU fallback active.

**Solution:**
```bash
# Verify GPU is accessible:
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# Check plugin logs:
docker compose logs plugin-demucs | grep -i gpu
```

### "Brain plugin shows 'Offline'"
**Cause:** Database connection issue or model download failure.

**Solution:**
```bash
# Check logs:
docker compose logs plugin-brain

# Verify PostgreSQL is healthy:
docker compose ps postgres

# Manually trigger model download:
docker compose exec plugin-brain python -c "from transformers import AutoModel; AutoModel.from_pretrained('laion/clap-htsat-unfused')"
```

### "Out of memory errors"
**Cause:** Insufficient GPU VRAM or too many concurrent jobs.

**Solution:**
```bash
# Reduce concurrency in .env:
AI_MAX_CONCURRENT_JOBS=1

# Restart plugins:
docker compose restart plugin-demucs plugin-brain
```

### "Knowledge plugin can't connect to Ollama"
**Cause:** Ollama not running or incorrect `OLLAMA_HOST`.

**Solution:**
```bash
# Verify Ollama is running:
curl http://localhost:11434/api/tags

# Update .env with correct host:
# For Docker Desktop on Windows/Mac:
OLLAMA_HOST=http://host.docker.internal:11434

# For Linux:
OLLAMA_HOST=http://172.17.0.1:11434

# Restart plugin:
docker compose restart plugin-knowledge
```

### "Models keep re-downloading"
**Cause:** `sonantica_ai_cache` volume not persisting.

**Solution:**
```bash
# Verify volume exists:
docker volume ls | grep sonantica_ai_cache

# If missing, recreate:
docker compose down
docker compose --profile ai up -d
```

---

## Privacy & Data

- **All processing happens locally.** Your audio never leaves your machine.
- **No telemetry.** We don't track what you analyze or listen to.
- **Model updates are optional.** You control when to download new AI models.
- **Ollama is self-hosted.** No external API calls (after initial model download).

---

## Performance Benchmarks

### Stem Separation (Demucs)

| Hardware | Processing Time (3-min song) |
|----------|------------------------------|
| RTX 4090 | ~30 seconds |
| RTX 3060 | ~90 seconds |
| GTX 1060 | ~180 seconds |
| CPU (Ryzen 9 5900X) | ~15 minutes |

### Audio Similarity (Brain)

| Hardware | Analysis Time (per track) |
|----------|---------------------------|
| RTX 4090 | ~2 seconds |
| RTX 3060 | ~5 seconds |
| GTX 1060 | ~8 seconds |
| CPU | ~30 seconds |

---

## Advanced Configuration

### Custom Embedding Models

To use a different CLAP model:
```bash
# In .env:
AI_EMBEDDING_MODEL=laion/larger-clap-general
AI_EMBEDDING_DIM=768  # Must match model output

# Restart plugin:
docker compose restart plugin-brain
```

**Note:** Changing models requires re-analyzing your entire library.

### Priority Queues

Plugins use Redis queues for job management:
- `ai:jobs:demucs:high` - User-initiated actions
- `ai:jobs:demucs:normal` - Background tasks
- `ai:jobs:brain:batch` - Library-wide analysis

### Network Isolation

In production, AI plugins are only accessible via Traefik:
- `https://yourdomain.com/api/v1/ai/demucs`
- `https://yourdomain.com/api/v1/ai/brain`
- `https://yourdomain.com/api/v1/ai/knowledge`

Internal API secret (`INTERNAL_API_SECRET`) is required for all requests.

---

## Uninstalling AI Plugins

```bash
# Stop and remove AI containers:
docker compose rm -s -f plugin-demucs plugin-brain plugin-knowledge

# Remove AI volumes (WARNING: Deletes models and stems):
docker volume rm sonantica_ai_cache sonantica_stems

# Remove AI logs:
rm -rf logs/ai/
```

---

## Philosophy

*"Sound deserves respect. Technology should serve listening, not distract from it."*

These AI features are designed to help you **understand** your music more deeply, not to automate your taste. They are tools for exploration, not replacements for your judgment.

Use them when they add value. Disable them when they don't.

**You decide.**

---

## Support & Feedback

- **Documentation:** [docs/ai/](./IMPLEMENTATION_PLAN.md)
- **Issues:** [GitHub Issues](https://github.com/artur0sky/sonantica/issues)
- **Community:** [Discussions](https://github.com/artur0sky/sonantica/discussions)

---

*Sonántica — Audio-first multimedia player. Open source, user autonomy, technical transparency.*
