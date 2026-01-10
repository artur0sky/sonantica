# AI Plugins - Docker Quick Reference

## Starting Services

### Development
```bash
# All services + AI plugins:
docker compose --profile ai up

# Specific plugin only:
docker compose up plugin-demucs
docker compose up plugin-brain
docker compose up plugin-knowledge

# Detached mode (background):
docker compose --profile ai up -d
```

### Production
```bash
# All services + AI plugins:
docker compose -f docker-compose.prod.yml --profile ai up -d

# Without AI plugins:
docker compose -f docker-compose.prod.yml up -d
```

---

## Stopping Services

```bash
# Stop AI plugins only:
docker compose stop plugin-demucs plugin-brain plugin-knowledge

# Stop all services:
docker compose down

# Stop and remove volumes (WARNING: Deletes data):
docker compose down -v
```

---

## Monitoring

### Check Status
```bash
# List running containers:
docker compose ps

# Check AI plugin health:
docker compose ps | grep plugin
```

### View Logs
```bash
# Real-time logs (all services):
docker compose logs -f

# Specific plugin:
docker compose logs -f plugin-demucs
docker compose logs -f plugin-brain
docker compose logs -f plugin-knowledge

# Last 100 lines:
docker compose logs --tail=100 plugin-demucs
```

### Resource Usage
```bash
# CPU/Memory usage:
docker stats

# Specific containers:
docker stats sonantica-plugin-demucs sonantica-plugin-brain
```

---

## Maintenance

### Rebuild Containers
```bash
# Rebuild AI plugins after code changes:
docker compose build plugin-demucs plugin-brain plugin-knowledge

# Rebuild and restart:
docker compose up -d --build plugin-demucs
```

### Clear Cache
```bash
# Remove AI model cache (will re-download):
docker volume rm sonantica_ai_cache

# Remove separated stems:
docker volume rm sonantica_stems

# List all volumes:
docker volume ls | grep sonantica
```

### Update Images
```bash
# Pull latest base images:
docker compose pull

# Rebuild with latest dependencies:
docker compose build --no-cache plugin-demucs
```

---

## Troubleshooting

### GPU Not Detected
```bash
# Verify NVIDIA runtime:
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# Check plugin GPU access:
docker compose exec plugin-demucs nvidia-smi
```

### Plugin Won't Start
```bash
# View startup errors:
docker compose logs plugin-demucs

# Check dependencies:
docker compose ps postgres redis

# Restart with fresh state:
docker compose restart plugin-demucs
```

### Out of Memory
```bash
# Check current limits:
docker compose config | grep -A 5 "plugin-demucs"

# Reduce concurrent jobs in .env:
AI_MAX_CONCURRENT_JOBS=1

# Restart:
docker compose restart plugin-demucs
```

### Network Issues
```bash
# Verify network exists:
docker network ls | grep sonantica

# Inspect network:
docker network inspect sonantica-network

# Recreate network:
docker compose down
docker compose --profile ai up -d
```

---

## Advanced

### Execute Commands Inside Container
```bash
# Open shell in plugin:
docker compose exec plugin-demucs /bin/bash

# Run Python command:
docker compose exec plugin-brain python -c "import torch; print(torch.cuda.is_available())"

# Check environment variables:
docker compose exec plugin-knowledge env | grep OLLAMA
```

### Inspect Volumes
```bash
# List volume contents:
docker run --rm -v sonantica_ai_cache:/cache alpine ls -lh /cache

# Copy files from volume:
docker run --rm -v sonantica_ai_cache:/cache -v $(pwd):/backup alpine cp -r /cache /backup/ai_cache_backup
```

### Database Access
```bash
# Connect to PostgreSQL:
docker compose exec postgres psql -U sonantica -d sonantica

# Check pgvector extension:
docker compose exec postgres psql -U sonantica -d sonantica -c "SELECT * FROM pg_extension WHERE extname='vector';"

# View embeddings:
docker compose exec postgres psql -U sonantica -d sonantica -c "SELECT track_id, model_version FROM track_embeddings LIMIT 10;"
```

---

## Environment Variables

### Required for AI
```bash
INTERNAL_API_SECRET=<generate-with-openssl-rand-hex-32>
```

### Optional Tuning
```bash
AI_MAX_CONCURRENT_JOBS=2
AI_JOB_TIMEOUT=600
AI_EMBEDDING_MODEL=laion/clap-htsat-unfused
AI_EMBEDDING_DIM=512
OLLAMA_HOST=http://host.docker.internal:11434
AI_KNOWLEDGE_CACHE_TTL=168
```

---

## Production Checklist

- [ ] Generate secure `INTERNAL_API_SECRET`
- [ ] Configure `DOMAIN_NAME` and `ACME_EMAIL`
- [ ] Verify GPU runtime is installed
- [ ] Set appropriate `AI_MAX_CONCURRENT_JOBS` for your hardware
- [ ] Configure Ollama host if using Knowledge plugin
- [ ] Test with `--profile ai` before deploying
- [ ] Monitor logs for first 24 hours
- [ ] Set up log rotation for `logs/ai/`
- [ ] Configure backup for `sonantica_ai_cache` volume

---

## Useful Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
# Sonántica shortcuts
alias sona-up='docker compose --profile ai up -d'
alias sona-down='docker compose down'
alias sona-logs='docker compose logs -f'
alias sona-ps='docker compose ps'
alias sona-restart='docker compose restart'

# AI-specific
alias sona-ai-logs='docker compose logs -f plugin-demucs plugin-brain plugin-knowledge'
alias sona-ai-restart='docker compose restart plugin-demucs plugin-brain plugin-knowledge'
alias sona-ai-stats='docker stats sonantica-plugin-demucs sonantica-plugin-brain sonantica-plugin-knowledge'
```

---

*For detailed setup instructions, see [AI_DOCKER_SETUP.md](./AI_DOCKER_SETUP.md)*
