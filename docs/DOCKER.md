# Docker Deployment Guide for Sonántica

> "Respect the intention of the sound and the freedom of the listener."

This guide explains how to run Sonántica in Docker with volume mounting for media files and buckets.

## 🐳 Quick Start

### Production Mode

```bash
# Build and run
docker-compose up -d

# Access the app
open http://localhost:3000
```

### Development Mode

```bash
# Start the full stack (Core, Worker, Web, DB, Redis)
docker compose up -d

# Access the app
open http://localhost:3000
```

## 📁 Volume Structure

Sonántica supports three types of volumes:

### 1. Media Volume (`/media`)
Mount your local music library here.

```yaml
volumes:
  - ./media:/media:ro  # Read-only
```

**Supported structure:**
```
media/
├── Artist Name/
│   ├── Album Name/
│   │   ├── 01 - Track.flac
│   │   ├── 02 - Track.mp3
│   │   └── cover.jpg
│   └── Another Album/
└── Various Artists/
```

### 2. Buckets Volume (`/buckets`)
For cloud storage integration or additional media sources.

```yaml
volumes:
  - ./buckets:/buckets:ro  # Read-only
```

**Use cases:**
- S3 bucket mounts
- Network storage
- Shared libraries
- Backup locations

### 3. Config Volume (`/config`)
For user preferences, playlists, and application settings.

```yaml
volumes:
  - ./config:/config:rw  # Read-write
```

**Stored data:**
- User preferences
- Custom playlists
- EQ settings
- Theme customizations

## 🚀 Deployment Options

### Option 1: Development Environment
Optimized for debugging, hot-reloading, and ease of use.

```bash
# Start development environment
docker compose up -d

# Stop environment
docker compose down
```

### Option 2: Production Environment (`docker-compose.prod.yml`)
Optimized for security, performance, and stability.

**Key Features:**
- **Traefik Reverse Proxy:** Auto HTTPS, Rate Limiting, Security Headers.
- **Hardened Containers:** Services run as non-root `appuser`.
- **Resource Limits:** CPU/RAM quotas to prevent DoS.
- **Service Isolation:** Frontend, Backend, and Worker separation.

```bash
# 1. Create your production .env
cp .env.example .env

# 2. Configure critical variables in .env (see below)

# 3. Start production services
docker compose -f docker-compose.prod.yml up -d
```

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Configuration (.env)](#environment-configuration)
3. [Production Architecture](#production-architecture)
4. [Logging & Observability](#logging--observability)
5. [Traefik Labels & Routing](#traefik-labels--routing)
6. [Security & Customization](#security--customization)

---

## <a name="production-architecture"></a> 🏗️ Production Architecture

This diagram reflects the services defined in `docker-compose.prod.yml`:

```mermaid
graph TD
    User((User)) -->|HTTPS/443| Traefik[Traefik Proxy]
    Traefik -->|/api/stream| StreamCore[Go Stream Core]
    Traefik -->|/api/v1/analytics| StreamCore
    Traefik -->|/dashboard| Flower[Flower Monitor]
    Traefik -->|/*| Web[Web App (Nginx)]
    
    StreamCore -->|Read/Write| Postgres[(PostgreSQL)]
    StreamCore -->|Cache/Broker| Redis[(Redis)]
    
    AudioWorker[Python Worker] -->|Tasks| Redis
    AudioWorker -->|Metadata| Postgres
    
    Beat[Celery Beat] -->|Schedule| Redis
```

### Core Services
1.  **Traefik:** The single entry point. Handles SSL termination (Let's Encrypt), rate limiting, and routing.
2.  **Stream Core (Go):** High-performance streaming engine and analytics API.
3.  **Web (React/Nginx):** Serves the generic PWA frontend.
4.  **Worker (Python):** Background processing for audio analysis (FFmpeg) and metadata extraction.
5.  **Persistence:**
    *   **PostgreSQL:** Relational data (Users, Library Index).
    *   **Redis:** Caching and Message Broker for Celery.

---

## <a name="environment-configuration"></a> ⚙️ Environment Configuration

Sonántica is highly configurable via the `.env` file. Below is the complete reference of all available parameters.
*Use `.env.example` as your template.*

### 🌍 Application & Network
| User Variable | Description | Default | Context |
| :--- | :--- | :--- | :--- |
| `DOMAIN_NAME` | Public domain for remote access (HTTPS). | `sonantica.local` | **Prod** |
| `ACME_EMAIL` | Email for Let's Encrypt SSL certificates. | `admin@localhost` | **Prod** |
| `TZ` | Container TimeZone. | `America/Chihuahua` | All |
| `ALLOWED_ORIGINS`| CORS whitelist (comma separated). | `http://localhost...` | Security |

### 💾 Persistence & Paths
| User Variable | Description | Default | Context |
| :--- | :--- | :--- | :--- |
| `MEDIA_PATH` | **Critical.** Host path to your music library. | `./media` | Storage |
| `BUCKETS_PATH`| Path for additional storage buckets (S3/NAS).| `./buckets` | Storage |
| `CONFIG_PATH` | Path for app config/playlists persistence. | `./config` | Storage |

### 🔍 Logging & Observability
| User Variable | Description | Default | Values |
| :--- | :--- | :--- | :--- |
| `LOG_LEVEL` | Verbosity of logs. | `INFO` | `DEBUG`, `INFO`, `WARN`, `ERROR` |
| `LOG_FORMAT` | Log output format. | `json` | `json` (Prod), `text` (Dev) |
| `LOG_ENABLED` | Master switch for logging. | `true` | `true`, `false` |

### 🔐 Security & Internal Services
| User Variable | Description | Default | Critical? |
| :--- | :--- | :--- | :--- |
| `PSQL_PASSWORD` | PostgreSQL Database password. | `sonantica` | ⚠️ **CHANGE IN PROD** |
| `REDIS_PASSWORD`| Redis Cache password. | `sonantica` | ⚠️ **CHANGE IN PROD** |
| `ANALYTICS_ENABLED` | Enable internal analytics engine. | `true` | Feature |

---

## <a name="logging--observability"></a> 📝 Logging & Observability

Sonántica uses a structured logging system compatible with **Loki, ELK, and Splunk**.

### 1. Configuration (Production)
In production, modify `.env` to output structured JSON logs:
```bash
LOG_LEVEL=INFO
LOG_FORMAT=json
```
**Why JSON?** It allows log aggregators to parse fields like `track_id`, `user_id`, or `duration` automatically.

### 2. Configuration (Development)
For readable logs in your terminal, use:
```bash
LOG_LEVEL=DEBUG
LOG_FORMAT=text
```

### 3. Viewing Logs
You can inspect logs per service:
```bash
# View Core Streamer logs
docker compose -f docker-compose.prod.yml logs -f stream-core

# View Worker/Analysis logs
docker compose -f docker-compose.prod.yml logs -f audio-worker

# View Access Logs (Traefik)
docker compose -f docker-compose.prod.yml logs -f traefik
```

---

## <a name="traefik-labels--routing"></a> 🏷️ Production Labels & Routing

Sonántica uses **Traefik Labels** to configure routing without touching config files. These are defined in `docker-compose.prod.yml`.

### How Routing Works
Traefik reads `labels` from running containers to auto-configure routes.

| Label Category | Function | Example |
| :--- | :--- | :--- |
| `router.rule` | When to route traffic? | `Host('music.com') && PathPrefix('/api')` |
| `middleware` | Modifications before reach app. | `strip-prefix`, `rate-limit`, `basic-auth` |
| `service.port` | Where to send traffic? | `8080` (Internal container port) |

### Key Middlewares Used
1.  **`security-headers`**: Proactively adds HSTS, XSS-Protection, and Frame-Deny headers.
2.  **`rate-limit`**: Protects APIs from abuse (configured to ~100 req/s typically).
3.  **`flower-auth`**: Adds password protection to the Flower Admin Dashboard.
4.  **`strip-stream`**: Removes `/api/stream` prefix so the backend receives clean paths.

### Customizing Routing
If you need to run Sonántica under a subpath (e.g., `example.com/music`), you would edit `docker-compose.prod.yml`:

### Customizing Routing
If you need to run Sonántica under a subpath (e.g., `example.com/music`), you would edit `docker-compose.prod.yml`:

```yaml
labels:
  - "traefik.http.routers.web.rule=Host(`example.com`) && PathPrefix(`/music`)"
  - "traefik.http.middlewares.web-strip.stripprefix.prefixes=/music"
  - "traefik.http.routers.web.middlewares=web-strip,rate-limit,security-headers"
```

---

## <a name="security--customization"></a> 🔒 Security & Customization

Sonántica is secure by default, but production often requires specific tuning.

### 1. Hardening Checklist
- [ ] **Change Passwords:** Set `PSQL_PASSWORD` and `REDIS_PASSWORD` in `.env`.
- [ ] **Secure Admin:** Change ` फ्लावर` (Flower) password (see above).
- [ ] **HTTPS:** Ensure `ACME_EMAIL` is valid for certificate renewal.
- [ ] **Firewall:** Only ports `80` and `443` should be exposed to the internet.

### 2. Volume Permissions
If you encounter permission errors with mounted volumes:

**Linux/macOS:**
```bash
# Fix ownership for user 1000 (standard appuser)
sudo chown -R 1000:1000 ./media ./config ./buckets
```

**Windows:**
Usually not required, but ensure Docker Desktop has file sharing enabled for the drive.

### 3. Resource Limits
If your server is crashing, you might need to adjust the limits in `docker-compose.prod.yml`.
*Lower for Raspberry Pi, Higher for Dedicated Servers.*

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'    # Limit to half a core
      memory: 256M   # Strict RAM limit
```

## 📈 Monitoring

### Health Checks

```bash
# Check container health
docker ps

# View logs
docker-compose logs -f sonantica-web

# Check health endpoint
curl http://localhost:3000/health
```

### Resource Usage

```bash
# Monitor resources
docker stats sonantica-web

# Inspect container
docker inspect sonantica-web
```

## 🐛 Troubleshooting

### Issue: Media files not accessible

```bash
# Check volume mounts
docker inspect sonantica-web | grep -A 10 Mounts

# Verify permissions
ls -la media/

# Check nginx logs
docker-compose logs sonantica-web | grep media
```

### Issue: Build fails

```bash
# Clear cache and rebuild
docker-compose build --no-cache

# Check build logs
docker-compose build 2>&1 | tee build.log
```

### Issue: Port already in use

```bash
# Change port in docker-compose.yml
ports:
  - "8080:80"  # Use different port

# Or stop conflicting service
lsof -ti:3000 | xargs kill
```

## 🔄 Updates

### Update to latest version

```bash
# Pull latest code
git pull origin main

# Rebuild
docker-compose build --no-cache

# Restart
docker-compose down
docker-compose up -d
```

### Backup config

```bash
# Backup config volume
tar -czf config-backup-$(date +%Y%m%d).tar.gz config/

# Restore
tar -xzf config-backup-20231222.tar.gz
```

## 📚 Advanced Scenarios

### Multi-node Setup

```yaml
# docker-compose.cluster.yml
services:
  sonantica-web-1:
    extends:
      file: docker-compose.yml
      service: sonantica-web
    ports:
      - "3001:80"
  
  sonantica-web-2:
    extends:
      file: docker-compose.yml
      service: sonantica-web
    ports:
      - "3002:80"
  
  nginx-lb:
    image: nginx:alpine
    volumes:
      - ./docker/nginx-lb.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
    depends_on:
      - sonantica-web-1
      - sonantica-web-2
```

### Kubernetes Deployment

See `k8s/` directory for Kubernetes manifests (coming soon).

## 🎯 Performance Tips

1. **Use named volumes for node_modules**
   ```yaml
   volumes:
     - node_modules:/app/node_modules
   ```

2. **Enable gzip compression** (already configured in nginx)

3. **Use multi-stage builds** (already implemented)

4. **Optimize image size**
   ```bash
   # Check image size
   docker images sonantica
   
   # Use alpine base images (already using)
   ```

## 📄 License

Apache-2.0 - See [LICENSE](../LICENSE)

---

**"Every file has an intention."**
