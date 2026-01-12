# Plan de Refactorización Fullstack - Sonántica
## Arquitectura Completa para Streaming Lossless Multiservidor

**Fecha:** 2025-12-30  
**Objetivo:** Crear una aplicación fullstack completa (Web + Mobile + Desktop) con streaming lossless, análisis de audio, y experiencia premium tipo Spotify.

---

## 🎯 Requisitos del Usuario

1. ✅ **Multiplataforma:** React+Vite (Web) + Capacitor (Mobile) + Desktop (TBD)
2. ✅ **Streaming Lossless:** Reproducción desde múltiples servidores activos
3. ✅ **Performance:** Análisis de directorios/metadata/audio sin afectar streaming
4. ✅ **Experiencia Premium:** Descargas offline, playlists, recomendaciones
5. ✅ **Analytics:** Registro de reproducción, análisis de usuario, generación de playlists
6. ✅ **Sin duplicación:** Código compartido entre plataformas

---

## 📐 Arquitectura Propuesta

### **Modelo de Capas (Clean Architecture + Hexagonal)**

```text
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS (Apps)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web (PWA)  │  │ Mobile (Cap) │  │Desktop (TBD) │          │
│  │ React + Vite │  │   iOS/And    │  │ Tauri/Elect  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
│                   ┌────────▼────────┐                            │
│                   │  @sonantica/ui  │  (Shared Components)       │
│                   └────────┬────────┘                            │
└────────────────────────────┼─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                    FRONTEND PACKAGES (Browser)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  player-core    │  │      dsp        │  │ offline-manager │  │
│  │ (Audio Engine)  │  │  (EQ, Filters)  │  │  (Downloads)    │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                     │            │
│  ┌────────▼────────────────────▼─────────────────────▼────────┐  │
│  │              @sonantica/shared (Types, Utils)              │  │
│  └────────────────────────────┬───────────────────────────────┘  │
└───────────────────────────────┼──────────────────────────────────┘
                                │ HTTP/WebSocket
┌───────────────────────────────▼──────────────────────────────────┐
│                      BACKEND SERVICES                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              API Gateway (Node.js + Express)                 │ │
│  │  - Authentication (JWT)                                      │ │
│  │  - Rate Limiting                                             │ │
│  │  - Request Routing                                           │ │
│  └────┬──────────────┬──────────────┬──────────────┬───────────┘ │
│       │              │              │              │              │
│  ┌────▼────┐  ┌──────▼──────┐  ┌───▼──────┐  ┌───▼──────────┐  │
│  │ Stream  │  │   Library   │  │ Analytics│  │  Metadata    │  │
│  │  Core   │  │   Service   │  │ Service  │  │   Fetcher    │  │
│  │  (Go)   │  │  (Node.js)  │  │(Node.js) │  │  (Node.js)   │  │
│  └────┬────┘  └──────┬──────┘  └───┬──────┘  └───┬──────────┘  │
│       │              │              │              │              │
│  ┌────▼──────────────▼──────────────▼──────────────▼──────────┐  │
│  │              Audio Worker (Python + Celery)                 │  │
│  │  - Waveform Generation                                      │  │
│  │  - BPM/Key Detection                                        │  │
│  │  - Audio Fingerprinting                                     │  │
│  └────────────────────────────┬───────────────────────────────┘  │
└───────────────────────────────┼──────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│                      DATA LAYER                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  PostgreSQL  │  │    Redis     │  │ Object Store │           │
│  │  (Metadata)  │  │   (Cache)    │  │  (S3/Minio)  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Nueva Estructura de Proyecto

```text
sonantica/
├─ apps/
│  ├─ web/                      # PWA (React + Vite)
│  │  ├─ src/
│  │  │  ├─ pages/
│  │  │  ├─ hooks/
│  │  │  └─ main.tsx
│  │  ├─ vite.config.ts
│  │  └─ package.json
│  │
│  ├─ mobile/                   # Capacitor (iOS + Android)
│  │  ├─ ios/
│  │  ├─ android/
│  │  ├─ capacitor.config.ts
│  │  └─ package.json
│  │
│  └─ desktop/                  # Desktop (Tauri/Electron - FUTURO)
│
├─ packages/                    # Frontend Packages (Browser)
│  ├─ player-core/              # ✅ MANTENER - Audio Engine
│  │  ├─ src/
│  │  │  ├─ domain/             # Lógica de negocio
│  │  │  │  ├─ Player.ts
│  │  │  │  ├─ Queue.ts
│  │  │  │  └─ PlaybackState.ts
│  │  │  ├─ ports/              # Interfaces
│  │  │  │  ├─ IStreamingPort.ts
│  │  │  │  └─ IStoragePort.ts
│  │  │  └─ adapters/           # Implementaciones
│  │  │     ├─ WebAudioAdapter.ts
│  │  │     └─ HLSAdapter.ts
│  │  └─ package.json
│  │
│  ├─ dsp/                      # ✅ MANTENER - Audio Processing
│  │  ├─ src/
│  │  │  ├─ processors/
│  │  │  │  ├─ EQProcessor.ts
│  │  │  │  ├─ VocalProcessor.ts
│  │  │  │  └─ ReverbProcessor.ts
│  │  │  └─ presets/
│  │  └─ package.json
│  │
│  ├─ offline-manager/          # ✅ MANTENER - Download Management
│  │  ├─ src/
│  │  │  ├─ DownloadQueue.ts
│  │  │  ├─ CacheStrategy.ts
│  │  │  └─ SyncEngine.ts
│  │  └─ package.json
│  │
│  ├─ ui/                       # ✅ MANTENER - Shared Components
│  │  ├─ src/
│  │  │  ├─ components/
│  │  │  ├─ themes/
│  │  │  └─ hooks/
│  │  └─ package.json
│  │
│  ├─ shared/                   # ✅ REFACTORIZAR - Types & Utils
│  │  ├─ src/
│  │  │  ├─ types/              # Tipos compartidos
│  │  │  │  ├─ track.ts
│  │  │  │  ├─ album.ts
│  │  │  │  ├─ artist.ts
│  │  │  │  └─ playlist.ts
│  │  │  ├─ contracts/          # Interfaces de servicios
│  │  │  │  ├─ IStreamingService.ts
│  │  │  │  ├─ ILibraryService.ts
│  │  │  │  ├─ IAnalyticsService.ts
│  │  │  │  └─ IMetadataService.ts
│  │  │  ├─ utils/
│  │  │  └─ constants/
│  │  └─ package.json
│  │
│  ├─ api-client/               # ✅ NUEVO - SDK para consumir backend
│  │  ├─ src/
│  │  │  ├─ SonanticaClient.ts
│  │  │  ├─ services/
│  │  │  │  ├─ StreamingService.ts
│  │  │  │  ├─ LibraryService.ts
│  │  │  │  ├─ AnalyticsService.ts
│  │  │  │  └─ MetadataService.ts
│  │  │  └─ websocket/
│  │  │     └─ RealtimeClient.ts
│  │  └─ package.json
│  │
│  └─ plugin-sdk/               # 🟡 FUTURO - Plugin System (Fase 4)
│
├─ services/                    # Backend Services (Microservicios)
│  ├─ api-gateway/              # ✅ NUEVO - API Gateway (Node.js)
│  │  ├─ src/
│  │  │  ├─ middleware/
│  │  │  │  ├─ auth.ts
│  │  │  │  ├─ rateLimit.ts
│  │  │  │  └─ cors.ts
│  │  │  ├─ routes/
│  │  │  │  ├─ streaming.ts
│  │  │  │  ├─ library.ts
│  │  │  │  ├─ analytics.ts
│  │  │  │  └─ user.ts
│  │  │  └─ index.ts
│  │  ├─ Dockerfile
│  │  └─ package.json
│  │
│  ├─ stream-core/              # ✅ MANTENER - High-Performance Streaming (Go)
│  │  ├─ cmd/
│  │  ├─ internal/
│  │  │  ├─ transcoding/        # FLAC → Opus/AAC on-the-fly
│  │  │  ├─ buffering/
│  │  │  └─ multiserver/        # Load balancing entre servidores
│  │  ├─ Dockerfile
│  │  └─ go.mod
│  │
│  ├─ library-service/          # ✅ NUEVO - Library Management (Node.js)
│  │  ├─ src/
│  │  │  ├─ scanner/            # Directory scanning
│  │  │  ├─ indexer/            # Database indexing
│  │  │  ├─ search/             # Full-text search
│  │  │  └─ playlists/          # Playlist management
│  │  ├─ Dockerfile
│  │  └─ package.json
│  │
│  ├─ analytics-service/        # ✅ NUEVO - Analytics & Recommendations (Node.js)
│  │  ├─ src/
│  │  │  ├─ tracking/           # Playback tracking
│  │  │  ├─ recommendations/    # Recommendation engine
│  │  │  ├─ insights/           # User insights
│  │  │  └─ reports/            # Analytics reports
│  │  ├─ Dockerfile
│  │  └─ package.json
│  │
│  ├─ metadata-fetcher/         # ✅ NUEVO - External Metadata (Node.js)
│  │  ├─ src/
│  │  │  ├─ providers/
│  │  │  │  ├─ musicbrainz.ts
│  │  │  │  ├─ discogs.ts
│  │  │  │  ├─ genius.ts         # Lyrics
│  │  │  │  └─ lastfm.ts
│  │  │  └─ cache/
│  │  ├─ Dockerfile
│  │  └─ package.json
│  │
│  └─ audio-worker/             # ✅ MANTENER - Audio Analysis (Python + Celery)
│     ├─ workers/
│     │  ├─ waveform.py
│     │  ├─ bpm_detection.py
│     │  ├─ key_detection.py
│     │  └─ fingerprint.py
│     ├─ Dockerfile
│     └─ requirements.txt
│
├─ data/                        # Database Configurations
│  ├─ psql/
│  │  ├─ init.d/
│  │  │  ├─ 01_schema.sql       # Tables: tracks, albums, artists, playlists
│  │  │  ├─ 02_analytics.sql    # Tables: playback_history, user_stats
│  │  │  └─ 03_indexes.sql
│  │  └─ Dockerfile
│  └─ redis/
│     └─ Dockerfile
│
├─ docker/
│  ├─ nginx-proxy.conf
│  └─ ssl/
│
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ IDENTITY.md
│  ├─ ROADMAP.md
│  ├─ REFACTORING_PLAN.md       # Este documento
│  └─ API.md                    # API Documentation
│
├─ docker-compose.yml           # Base
├─ docker-compose.dev.yml       # Development
├─ docker-compose.prod.yml      # Production
└─ pnpm-workspace.yaml
```

---

## 🔄 Packages a Eliminar/Refactorizar

### ❌ **ELIMINAR**

| Package | Razón | Acción |
|---------|-------|--------|
| `packages/api-server` | Es un servicio, no una librería | Mover a `services/api-gateway` |
| `packages/audio-analyzer` | Duplica funcionalidad de `audio-worker` | Eliminar, usar `api-client` para comunicarse con `audio-worker` |
| `packages/media-library` | Lógica de backend, no frontend | Mover a `services/library-service` |
| `packages/metadata` | Mezclado con implementaciones | Separar: contratos a `shared/contracts`, implementaciones a `services/metadata-fetcher` |
| `packages/lyrics` | Parte de metadata | Integrar en `services/metadata-fetcher` |
| `packages/recommendations` | Lógica de backend | Mover a `services/analytics-service` |

### ✅ **MANTENER**

| Package | Razón | Refactorización |
|---------|-------|-----------------|
| `packages/player-core` | Core del reproductor (browser) | Aplicar Hexagonal Architecture |
| `packages/dsp` | Procesamiento de audio (Web Audio API) | Modularizar procesadores |
| `packages/offline-manager` | Gestión de descargas (IndexedDB) | Integrar con `api-client` |
| `packages/ui` | Componentes visuales compartidos | Mejorar theming system |
| `packages/shared` | Types y utils compartidos | Agregar `contracts/` |

### ✅ **CREAR**

| Package | Propósito |
|---------|-----------|
| `packages/api-client` | SDK para consumir backend desde apps |
| `services/api-gateway` | Gateway unificado (auth, routing) |
| `services/library-service` | Gestión de biblioteca musical |
| `services/analytics-service` | Analytics y recomendaciones |
| `services/metadata-fetcher` | Fetching de metadata externa |

---

## 🏗️ Flujo de Datos Completo

### **1. Streaming de Audio Lossless**

```text
┌─────────────┐
│  User Click │
│   "Play"    │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ apps/web (React)                                          │
│  ├─ usePlayer() hook                                      │
│  │   └─ player-core.play(trackId)                        │
│  │                                                         │
│  └─ api-client.streaming.getStreamUrl(trackId, quality)  │
└──────┬───────────────────────────────────────────────────┘
       │ HTTP Request
       ▼
┌──────────────────────────────────────────────────────────┐
│ services/api-gateway (Node.js)                            │
│  ├─ Auth Middleware (JWT)                                │
│  ├─ Rate Limiting                                         │
│  └─ Route to stream-core                                 │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ services/stream-core (Go)                                 │
│  ├─ Multi-server load balancing                          │
│  ├─ Transcoding (FLAC → Opus/AAC)                        │
│  ├─ Adaptive bitrate (HLS/DASH)                          │
│  └─ Return stream URL                                    │
└──────┬───────────────────────────────────────────────────┘
       │ Stream URL
       ▼
┌──────────────────────────────────────────────────────────┐
│ packages/player-core (Browser)                            │
│  ├─ WebAudioAdapter.load(streamUrl)                      │
│  ├─ DSP Chain (EQ, Filters)                              │
│  └─ Audio Output                                         │
└───────────────────────────────────────────────────────────┘
```

### **2. Análisis de Audio (Background)**

```text
┌──────────────────────────────────────────────────────────┐
│ services/library-service (Node.js)                        │
│  ├─ Directory Scanner (Chokidar)                         │
│  ├─ Detect new files                                     │
│  └─ Enqueue analysis job                                 │
└──────┬───────────────────────────────────────────────────┘
       │ Redis Queue
       ▼
┌──────────────────────────────────────────────────────────┐
│ services/audio-worker (Python + Celery)                   │
│  ├─ Task: analyze_track(file_path)                       │
│  ├─ Generate waveform                                    │
│  ├─ Detect BPM, Key, Loudness                            │
│  ├─ Audio fingerprinting                                 │
│  └─ Save to PostgreSQL                                   │
└──────┬───────────────────────────────────────────────────┘
       │ WebSocket Notification
       ▼
┌──────────────────────────────────────────────────────────┐
│ apps/web (React)                                          │
│  └─ Update UI: "Analysis complete"                       │
└───────────────────────────────────────────────────────────┘
```

### **3. Descargas Offline (Premium)**

```text
┌──────────────────────────────────────────────────────────┐
│ apps/web (React)                                          │
│  ├─ User clicks "Download"                               │
│  └─ offline-manager.download(trackId, quality)           │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ packages/offline-manager (Browser)                        │
│  ├─ Check storage quota                                  │
│  ├─ Request stream URL from api-client                   │
│  ├─ Download with progress tracking                      │
│  ├─ Encrypt and store in IndexedDB                       │
│  └─ Update download status                               │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ services/analytics-service (Node.js)                      │
│  └─ Track download event                                 │
└───────────────────────────────────────────────────────────┘
```

### **4. Analytics y Recomendaciones**

```text
┌──────────────────────────────────────────────────────────┐
│ packages/player-core (Browser)                            │
│  ├─ Event: track_played                                  │
│  └─ api-client.analytics.trackPlayback(trackId, duration)│
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ services/analytics-service (Node.js)                      │
│  ├─ Save to playback_history table                       │
│  ├─ Update user stats (top artists, genres)              │
│  ├─ Trigger recommendation engine                        │
│  └─ Generate personalized playlists                      │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ PostgreSQL                                                │
│  ├─ playback_history                                     │
│  ├─ user_stats                                           │
│  └─ recommended_tracks                                   │
└───────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementación por Fases

### **Fase 1: Refactorización de Estructura (Semanas 1-2)**

#### **Sprint 1.1: Reorganizar Packages**
- [ ] Mover `packages/api-server` → `services/api-gateway`
- [ ] Eliminar `packages/audio-analyzer`
- [ ] Mover `packages/media-library` → `services/library-service`
- [ ] Separar `packages/metadata`:
  - Contratos → `packages/shared/src/contracts/`
  - Implementaciones → `services/metadata-fetcher`
- [ ] Mover `packages/recommendations` → `services/analytics-service`

#### **Sprint 1.2: Crear Nuevos Packages**
- [ ] Crear `packages/api-client` (SDK)
- [ ] Refactorizar `packages/shared` (agregar `contracts/`)
- [ ] Actualizar imports en `apps/web`

### **Fase 2: Backend Services (Semanas 3-5)**

#### **Sprint 2.1: API Gateway**
- [ ] Implementar `services/api-gateway`
  - [ ] Auth middleware (JWT)
  - [ ] Rate limiting
  - [ ] CORS configuration
  - [ ] Request routing

#### **Sprint 2.2: Library Service**
- [ ] Implementar `services/library-service`
  - [ ] Directory scanner (Chokidar)
  - [ ] Metadata indexer
  - [ ] Full-text search (PostgreSQL)
  - [ ] Playlist CRUD

#### **Sprint 2.3: Analytics Service**
- [ ] Implementar `services/analytics-service`
  - [ ] Playback tracking
  - [ ] User stats aggregation
  - [ ] Recommendation engine (collaborative filtering)
  - [ ] Playlist generation

#### **Sprint 2.4: Metadata Fetcher**
- [ ] Implementar `services/metadata-fetcher`
  - [ ] MusicBrainz integration
  - [ ] Discogs integration
  - [ ] Genius (lyrics) integration
  - [ ] Caching strategy (Redis)

### **Fase 3: Frontend Integration (Semanas 6-7)**

#### **Sprint 3.1: API Client SDK**
- [ ] Implementar `packages/api-client`
  - [ ] `StreamingService`
  - [ ] `LibraryService`
  - [ ] `AnalyticsService`
  - [ ] `MetadataService`
  - [ ] WebSocket client (real-time updates)

#### **Sprint 3.2: Player Core Refactoring**
- [ ] Aplicar Hexagonal Architecture a `player-core`
  - [ ] Domain layer (Player, Queue, State)
  - [ ] Ports (interfaces)
  - [ ] Adapters (WebAudio, HLS)

#### **Sprint 3.3: Offline Manager**
- [ ] Mejorar `packages/offline-manager`
  - [ ] Download queue management
  - [ ] IndexedDB encryption
  - [ ] Sync strategy
  - [ ] Storage quota management

### **Fase 4: Mobile & Desktop (Semanas 8-10)**

#### **Sprint 4.1: Capacitor Setup**
- [ ] Crear `apps/mobile`
  - [ ] iOS configuration
  - [ ] Android configuration
  - [ ] Native plugins (background audio, notifications)

#### **Sprint 4.2: Desktop App**
- [ ] Evaluar framework (Tauri vs Electron)
- [ ] Crear `apps/desktop`
- [ ] Implementar platform-specific features

### **Fase 5: Premium Features (Semanas 11-12)**

#### **Sprint 5.1: Download System**
- [ ] Implementar download management UI
- [ ] Offline playback
- [ ] Sync across devices

#### **Sprint 5.2: Analytics Dashboard**
- [ ] User insights page
- [ ] Listening history
- [ ] Top artists/albums/genres
- [ ] Personalized recommendations

---

## 📊 Database Schema

### **PostgreSQL Tables**

```sql
-- Core Music Data
CREATE TABLE artists (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE albums (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist_id UUID REFERENCES artists(id),
  release_date DATE,
  cover_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tracks (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  album_id UUID REFERENCES albums(id),
  artist_id UUID REFERENCES artists(id),
  duration INTEGER, -- seconds
  file_path VARCHAR(1000),
  file_size BIGINT,
  codec VARCHAR(50),
  bitrate INTEGER,
  sample_rate INTEGER,
  bpm FLOAT,
  key VARCHAR(10),
  waveform_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Data
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics
CREATE TABLE playback_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  track_id UUID REFERENCES tracks(id),
  played_at TIMESTAMP DEFAULT NOW(),
  duration_played INTEGER, -- seconds
  completed BOOLEAN DEFAULT FALSE,
  device_type VARCHAR(50)
);

CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  total_plays INTEGER DEFAULT 0,
  total_time_listened INTEGER DEFAULT 0, -- seconds
  top_artist_id UUID REFERENCES artists(id),
  top_genre VARCHAR(100),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Playlists
CREATE TABLE playlists (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE playlist_tracks (
  playlist_id UUID REFERENCES playlists(id),
  track_id UUID REFERENCES tracks(id),
  position INTEGER NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (playlist_id, track_id)
);

-- Downloads (Premium)
CREATE TABLE downloads (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  track_id UUID REFERENCES tracks(id),
  quality VARCHAR(50),
  downloaded_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

---

## 🐳 Docker Compose Refactorizado

### **docker-compose.yml (Base)**

```yaml
version: '3.8'

services:
  # ============================================
  # DATA LAYER
  # ============================================
  postgres:
    build:
      context: ./data/psql
      dockerfile: Dockerfile
    container_name: sonantica-postgres
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      PSQL_PASSWORD: ${PSQL_PASSWORD}
      PGDATA: /var/lib/postgresql/data
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./data/psql/init.d:/docker-entrypoint-initdb.d
    networks:
      - sonantica-net
    ports:
      - "${PSQL_PORT}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    build:
      context: ./data/redis
      dockerfile: Dockerfile
    container_name: sonantica-redis
    restart: always
    volumes:
      - redis_data:/data
    networks:
      - sonantica-net
    ports:
      - "${REDIS_PORT}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # BACKEND SERVICES
  # ============================================
  api-gateway:
    build:
      context: ./services/api-gateway
      dockerfile: Dockerfile
    container_name: sonantica-api-gateway
    restart: always
    environment:
      - NODE_ENV=production
      - POSTGRES_URL=postgres://${POSTGRES_USER}:${PSQL_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - STREAM_CORE_URL=http://stream-core:8080
      - LIBRARY_SERVICE_URL=http://library-service:8081
      - ANALYTICS_SERVICE_URL=http://analytics-service:8082
      - METADATA_SERVICE_URL=http://metadata-fetcher:8083
    ports:
      - "${API_PORT:-8080}:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - sonantica-net

  stream-core:
    build:
      context: ./services/stream-core
      dockerfile: Dockerfile
    container_name: sonantica-stream-core
    restart: always
    environment:
      - MEDIA_PATH=/media
      - REDIS_URL=redis://redis:6379
    volumes:
      - ${MEDIA_PATH:-./media}:/media:ro
    ports:
      - "8090:8080"
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - sonantica-net

  library-service:
    build:
      context: ./services/library-service
      dockerfile: Dockerfile
    container_name: sonantica-library-service
    restart: always
    environment:
      - NODE_ENV=production
      - POSTGRES_URL=postgres://${POSTGRES_USER}:${PSQL_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379
      - MEDIA_PATH=/media
    volumes:
      - ${MEDIA_PATH:-./media}:/media:ro
    ports:
      - "8081:8081"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - sonantica-net

  analytics-service:
    build:
      context: ./services/analytics-service
      dockerfile: Dockerfile
    container_name: sonantica-analytics-service
    restart: always
    environment:
      - NODE_ENV=production
      - POSTGRES_URL=postgres://${POSTGRES_USER}:${PSQL_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379
    ports:
      - "8082:8082"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - sonantica-net

  metadata-fetcher:
    build:
      context: ./services/metadata-fetcher
      dockerfile: Dockerfile
    container_name: sonantica-metadata-fetcher
    restart: always
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - MUSICBRAINZ_API_KEY=${MUSICBRAINZ_API_KEY}
      - DISCOGS_API_KEY=${DISCOGS_API_KEY}
      - GENIUS_API_KEY=${GENIUS_API_KEY}
    ports:
      - "8083:8083"
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - sonantica-net

  audio-worker:
    build:
      context: ./services/audio-worker
      dockerfile: Dockerfile
    container_name: sonantica-audio-worker
    restart: always
    environment:
      - POSTGRES_URL=postgres://${POSTGRES_USER}:${PSQL_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379
      - MEDIA_PATH=/media
    volumes:
      - ${MEDIA_PATH:-./media}:/media:ro
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - sonantica-net

  # ============================================
  # FRONTEND
  # ============================================
  web:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: sonantica-web
    restart: always
    environment:
      - NODE_ENV=production
      - VITE_API_URL=http://api-gateway:8080
    ports:
      - "${WEB_PORT:-3000}:80"
    depends_on:
      - api-gateway
    networks:
      - sonantica-net

networks:
  sonantica-net:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

---

## 🎯 Ventajas de Esta Arquitectura

### ✅ **Sin Duplicación de Código**
- Packages compartidos entre Web, Mobile, Desktop
- Servicios backend reutilizables
- Contratos claros en `shared/contracts/`

### ✅ **Performance Aislado**
- Análisis de audio en worker separado (Python)
- Streaming en servicio dedicado (Go)
- Cache inteligente (Redis)
- No bloquea reproducción

### ✅ **Experiencia Premium**
- Descargas offline (`offline-manager`)
- Recomendaciones personalizadas (`analytics-service`)
- Playlists inteligentes
- Sincronización multi-dispositivo

### ✅ **Escalabilidad**
- Microservicios independientes
- Fácil escalar servicios individuales
- Load balancing en `stream-core`
- Multi-servidor lossless

### ✅ **Mantenibilidad**
- Separación clara de responsabilidades
- Hexagonal Architecture en core
- Contratos explícitos
- Fácil testing

---

## 📝 Próximos Pasos Inmediatos

¿Quieres que empiece con alguna de estas acciones?

1. **Crear estructura de `services/api-gateway`** y comenzar migración
2. **Implementar `packages/api-client`** (SDK)
3. **Refactorizar `docker-compose.yml`** con nuevos servicios
4. **Crear schema de PostgreSQL** completo
5. **Generar documentación de API** (OpenAPI/Swagger)

Dime por dónde empezamos y procedo con la implementación. 🎵
