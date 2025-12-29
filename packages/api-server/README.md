# @sonantica/api-server

**Sonántica API Server** - Centralized music streaming backend

## Philosophy

> "User autonomy" - Self-hosted music streaming

The API server embodies Sonántica's core value of **user control**. Instead of relying on cloud services, users host their own music library and stream to any device.

## Architecture

```
┌─────────────┐
│   Clients   │ (Web, Mobile, Desktop)
└──────┬──────┘
       │ HTTP/SSE
┌──────▼──────┐
│ API Server  │ (This package)
├─────────────┤
│ - Library   │ Metadata API
│ - Stream    │ Audio delivery
│ - Scan      │ Indexing
└──────┬──────┘
       │ File System
┌──────▼──────┐
│ /media/     │ Your music files
└─────────────┘
```

## Features

- **RESTful API** for library metadata
- **HTTP Range Streaming** for audio files
- **Real-time updates** via Server-Sent Events
- **Automatic scanning** of media directories
- **Metadata extraction** from audio files

## API Endpoints

### Library
- `GET /api/library/tracks` - List all tracks
- `GET /api/library/tracks/:id` - Get track details
- `GET /api/library/artists` - List all artists
- `GET /api/library/artists/:id/tracks` - Get artist's tracks
- `GET /api/library/albums` - List all albums
- `GET /api/library/albums/:id/tracks` - Get album's tracks

### Streaming
- `GET /api/stream/:filePath` - Stream audio file (supports range requests)

### Scanning
- `POST /api/scan/start` - Trigger library scan
- `GET /api/scan/status` - Get scan status
- `GET /api/scan/events` - SSE endpoint for real-time updates

## Environment Variables

```env
API_PORT=8080
MEDIA_PATH=/media
CORS_ORIGIN=*
```

## Usage

### Development
```bash
pnpm dev
```

### Production
```bash
pnpm build
pnpm start
```

### Docker
The API server is automatically included in the Docker Compose setup:

```yaml
services:
  api:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./media:/media:ro
```

## Integration

Clients connect by configuring the server URL:

```typescript
// Web/Mobile client
const apiClient = new SonanticaClient('http://192.168.1.100:8080');
await apiClient.library.getTracks();
```

## Security

- **Directory traversal protection** on streaming endpoints
- **CORS configuration** for web clients
- **Read-only media access** (recommended)

## Future Enhancements

- [ ] Authentication (JWT/API keys)
- [ ] Multi-user support
- [ ] Playlist synchronization
- [ ] Transcoding on-the-fly
- [ ] Cover art caching
- [ ] WebSocket for bidirectional communication

---

**Part of the Sonántica ecosystem** - Audio-first, user-controlled multimedia player.
