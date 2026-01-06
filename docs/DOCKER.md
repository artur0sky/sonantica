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
# Run with hot-reload
docker-compose --profile dev up sonantica-dev

# Access the app
open http://localhost:5173
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

### Option 1: Docker Compose (Recommended)

```bash
# Production
docker-compose up -d sonantica-web

# Development
docker-compose --profile dev up sonantica-dev

# Stop
docker-compose down

# Rebuild
docker-compose build --no-cache
```

### Option 2: Docker CLI

```bash
# Build
docker build -t sonantica:latest .

# Run with volumes
docker run -d \
  --name sonantica \
  -p 3000:80 \
  -v $(pwd)/media:/media:ro \
  -v $(pwd)/buckets:/buckets:ro \
  -v $(pwd)/config:/config:rw \
  sonantica:latest

# Stop
docker stop sonantica
docker rm sonantica
```

### Option 3: Docker with Cloud Storage

#### AWS S3 Mount
```bash
# Install s3fs
apt-get install s3fs

# Mount S3 bucket
s3fs my-music-bucket ./buckets -o passwd_file=~/.passwd-s3fs

# Run Docker
docker-compose up -d
```

#### Google Cloud Storage
```bash
# Install gcsfuse
gcsfuse my-music-bucket ./buckets

# Run Docker
docker-compose up -d
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# Application
NODE_ENV=production
SONANTICA_VERSION=0.1.0

# Ports
WEB_PORT=3000
DEV_PORT=5173

# Volumes
MEDIA_PATH=./media
BUCKETS_PATH=./buckets
CONFIG_PATH=./config

# Optional: API Configuration
API_URL=http://localhost:8080
```

### Custom Nginx Configuration

Override the default nginx config:

```yaml
volumes:
  - ./docker/nginx.custom.conf:/etc/nginx/conf.d/default.conf:ro
```

## 📊 Volume Permissions

### Linux/macOS

```bash
# Create directories
mkdir -p media buckets config

# Set permissions
chmod 755 media buckets
chmod 775 config

# Set ownership (if needed)
sudo chown -R 101:101 config  # nginx user
```

### Windows

```powershell
# Create directories
New-Item -ItemType Directory -Path media, buckets, config

# Permissions are handled automatically
```

## 🔒 Security Best Practices

1. **Read-only media volumes**: Prevent accidental modifications
   ```yaml
   - ./media:/media:ro
   ```

2. **Restrict config access**: Only the app should write
   ```yaml
   - ./config:/config:rw
   ```

3. **Use secrets for API keys**: Never commit credentials
   ```yaml
   secrets:
     - s3_credentials
   ```

4. **Enable HTTPS**: Use a reverse proxy
   ```bash
   # Example with Traefik
   docker-compose -f docker-compose.yml -f docker-compose.traefik.yml up -d
   ```

## 🌐 Reverse Proxy Examples

### Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name sonantica.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Traefik

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.sonantica.rule=Host(`sonantica.example.com`)"
  - "traefik.http.routers.sonantica.tls=true"
  - "traefik.http.routers.sonantica.tls.certresolver=letsencrypt"
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
