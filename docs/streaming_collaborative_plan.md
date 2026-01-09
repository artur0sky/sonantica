# Plan de Optimización del Pipeline de Streaming y Sistema Colaborativo
## Sonántica - "Aula Sonora" Architecture
### *"Ubi Sonus Vivit, Anima Audit"* (Donde el sonido vive, el alma escucha)

**Fecha:** 2026-01-08  
**Versión:** 2.0  
**Objetivo:** Revisar y optimizar el pipeline completo de reproducción, garantizando **fidelidad de audio absoluta** (lossless por defecto), y crear un sistema de **"Aulas Sonoras"** (espacios sagrados de escucha compartida) donde múltiples oyentes experimentan la interpretación del artista en sincronía perfecta.

**Filosofía:** Un *Aula Sonora* es un **espacio sagrado dedicado al sonido** donde el artista es libre de expresarse sin restricciones y los oyentes se conectan a través del respeto mutuo y la intención del audio. No sacrificamos calidad, no imponemos ruido, solo facilitamos la experiencia compartida de escuchar como fue concebida.

**Prioridades (en orden):**
1. 🎵 **Calidad de Audio Absoluta** - El audio nunca se sacrifica (lossless por defecto)
2. 💰 **Optimización de Recursos** - Ahorrar dinero y recursos sin perder performance
3. 🤝 **Conexión Respetuosa** - La gente se siente identificada, conectada y con respeto

---

## 1. Análisis del Pipeline Actual de Reproducción

### 1.1 Flujo Actual de Audio
```
[Archivo en Disco] 
    ↓
[Go Core - Stream Endpoint] (/api/stream/:trackId)
    ↓
[HTTP Range Requests] (Partial Content 206)
    ↓
[BufferManager] (Frontend - Blob URLs)
    ↓
[PlayerEngine] (Web Audio API)
    ↓
[HTMLAudioElement] (Decodificación nativa del navegador)
    ↓
[DSP Chain] (Opcional - EQ, Filters)
    ↓
[Audio Output]
```

### 1.2 Puntos Críticos de Calidad de Audio

#### ✅ **Puntos Fuertes Actuales:**
1. **Stream directo desde archivo** - No hay re-encoding en el backend
2. **Range Requests** - Soporte para seeking sin descargar todo el archivo
3. **Content-Type correcto** - Preserva el formato original (FLAC, MP3, etc.)
4. **Web Audio API** - Decodificación nativa sin pérdidas
5. **DSP opcional** - Procesamiento solo si el usuario lo activa

#### ⚠️ **Puntos de Riesgo Identificados:**

**A. Backend (Stream Core - `stream.js`)**
- ✅ **Sin re-encoding** - El archivo se sirve tal cual
- ⚠️ **Posible buffering excesivo** - `createReadStream` sin control de chunk size
- ⚠️ **Sin caché de metadatos** - Cada request lee el archivo completo

**B. Frontend (BufferManager)**
- ⚠️ **Conversión a Blob URL** - Posible overhead de memoria
- ⚠️ **Sin validación de integridad** - No hay checksum de audio
- ✅ **Estrategias de buffering** - Configurables (AGGRESSIVE, BALANCED, MINIMAL)

**C. PlayerEngine**
- ✅ **HTMLAudioElement nativo** - Decodificación sin pérdidas
- ✅ **crossOrigin='anonymous'** - Permite Web Audio API
- ⚠️ **Sin monitoreo de calidad** - No detecta degradación de bitrate

**D. DSP Chain**
- ✅ **Opcional** - Solo se activa si el usuario lo configura
- ⚠️ **Sin validación de bit-depth** - Podría degradar audio HQ

---

## 2. Optimizaciones Propuestas para Calidad de Audio

### 2.1 Backend (Stream Core - Go Service)

#### **Prioridad Alta:**
1. **Implementar streaming chunked optimizado**
   - Chunk size dinámico basado en bitrate
   - Para FLAC 24-bit/96kHz: chunks de 256KB
   - Para MP3 320kbps: chunks de 128KB

2. **Caché de metadatos de audio**
   - Redis: `audio:metadata:{trackId}` → {bitrate, sampleRate, codec, duration}
   - Evitar lecturas repetidas del archivo

3. **Validación de integridad**
   - Calcular SHA256 del archivo en primer acceso
   - Cachear en Redis: `audio:checksum:{trackId}`

#### **Prioridad Media:**
4. **Soporte para formatos HQ sin conversión**
   - FLAC (hasta 24-bit/192kHz)
   - ALAC (Apple Lossless)
   - DSD (Direct Stream Digital) - futuro

5. **Header optimization**
   - `Accept-Ranges: bytes` ✅ (ya implementado)
   - `Cache-Control: public, max-age=31536000` (archivos inmutables)
   - `X-Audio-Quality: {bitrate}kbps, {sampleRate}Hz` (custom header)

### 2.2 Frontend (BufferManager)

#### **Prioridad Alta:**
1. **Eliminar conversión a Blob innecesaria**
   - Para archivos < 50MB: usar Blob URL (actual)
   - Para archivos > 50MB: **streaming directo** sin Blob
   - Configuración: `DIRECT_STREAM_THRESHOLD = 50MB`

2. **Validación de integridad**
   - Verificar checksum SHA256 del backend
   - Alertar al usuario si hay corrupción

3. **Monitoreo de calidad en tiempo real**
   ```typescript
   interface AudioQualityMetrics {
     bitrate: number;        // kbps actual
     sampleRate: number;     // Hz
     bitsPerSample: number;  // 16, 24, 32
     codec: string;          // 'flac', 'mp3', 'aac'
     lossless: boolean;      // true para FLAC, ALAC
     bufferHealth: number;   // 0-100%
   }
   ```

#### **Prioridad Media:**
4. **Pre-buffering inteligente**
   - Pre-cargar siguiente track en cola (ya implementado)
   - **Nuevo:** Pre-cargar tracks "populares" en sesión colaborativa

### 2.3 PlayerEngine

#### **Prioridad Alta:**
1. **Monitoreo de degradación de audio**
   ```typescript
   // Detectar si el navegador está degradando calidad
   private monitorAudioQuality(): void {
     const audioContext = new AudioContext();
     const analyser = audioContext.createAnalyser();
     // Detectar si sampleRate < esperado
     if (audioContext.sampleRate < expectedSampleRate) {
       console.warn('⚠️ Audio degradation detected');
     }
   }
   ```

2. **Gapless playback mejorado**
   - Usar `AudioBufferSourceNode` para transiciones sin gaps
   - Pre-decodificar siguiente track

#### **Prioridad Media:**
3. **Soporte para bit-perfect output**
   - Detectar si el sistema soporta exclusive mode
   - Windows: WASAPI Exclusive
   - macOS: Core Audio Exclusive
   - Linux: ALSA Direct

---

## 3. Sistema de Aulas Sonoras (Espacios Sagrados de Escucha)

### 3.1 Concepto: "Aula Sonora"

**Etimología:** 
- **Aula** (latín) = Sala, espacio de experiencia y aprendizaje
- **Sonora** (latín *sonorus*) = Que suena, que resuena, lleno de sonido

**Filosofía:** Un *Aula Sonora* es un **espacio sagrado dedicado exclusivamente al sonido**. No es una sala de conciertos ordinaria ni una "radio social" ruidosa, es un **templo acústico** donde:
- El artista es libre de expresarse sin restricciones ni degradación
- Los oyentes se reúnen para experimentar la interpretación en sincronía perfecta
- El respeto mutuo y la intención del sonido son la base de la conexión
- La música es la protagonista, el silencio tiene valor, la fidelidad es absoluta

**Características de un Aula Sonora:**
- Un usuario crea un "Aula Sonora" (espacio sagrado de escucha)
- Otros oyentes pueden unirse (pública o por invitación)
- Todos escuchan la misma música en **sincronía perfecta** (< 500ms drift)
- **Calidad lossless garantizada** - El audio NUNCA se degrada
- **Modo silencioso por defecto** - El chat es opcional, no obligatorio
- **Respeto absoluto al artista** - La interpretación se preserva tal como fue creada
- Control compartido o solo curator (configurable - **autonomía del usuario**)
- **Transparencia total:** Los oyentes ven la calidad de audio (bitrate, codec, sample rate) y el estado de sincronización en tiempo real

### 3.2 Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────┐
│                    AULA SONORA                               │
│            (Espacio Sagrado de Escucha)                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Curator  │  │ Oyente   │  │ Oyente   │  │ Oyente   │   │
│  │ (Host)   │  │    1     │  │    2     │  │    3     │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │              │              │          │
│       │    🎵 Sincronización Perfecta (< 500ms) 🎵          │
│       │             │              │              │          │
│       └─────────────┴──────────────┴──────────────┘          │
│                          ↓                                   │
│              ┌───────────────────────┐                       │
│              │  WebSocket Server     │                       │
│              │  (Stream Core)        │                       │
│              └───────────────────────┘                       │
│                          ↓                                   │
│              ┌───────────────────────┐                       │
│              │  Redis Pub/Sub        │                       │
│              │  (Aula State)         │                       │
│              └───────────────────────┘                       │
│                                                              │
│  📊 Calidad: FLAC 24-bit/96kHz | Latencia: 120ms            │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Componentes Nuevos

#### **A. Backend (Stream Core - Go Service)**

**Responsabilidad:** Gestionar el estado de las salas y la sincronización de playback. **No** procesa audio directamente (eso es responsabilidad del `player-core` package).

**1. Aula Sonora Manager**
```go
type AulaSonora struct {
    ID              string
    Name            string
    HostUserID      string
    Listeners       []string // UserIDs
    CurrentTrack    *Track
    PlaybackState   PlaybackState
    CurrentTime     float64
    Queue           []Track
    IsPublic        bool
    MaxListeners    int
    CreatedAt       time.Time
}

type PlaybackState struct {
    State       string // "playing", "paused", "stopped"
    TrackID     string
    Position    float64 // seconds
    Timestamp   int64   // Unix timestamp
}
```

**2. WebSocket Endpoints**
```
WS /api/rooms/join/:roomId
WS /api/rooms/create
WS /api/rooms/sync
```

**3. Redis Schema**
```
# Room metadata
room:{roomId} → JSON(ListeningRoom)

# Room members (Set)
room:{roomId}:members → Set[userId1, userId2, ...]

# Room playback state
room:{roomId}:state → JSON(PlaybackState)

# Room queue
room:{roomId}:queue → List[trackId1, trackId2, ...]

# Active rooms index
rooms:active → Set[roomId1, roomId2, ...]

# User → Room mapping
user:{userId}:room → roomId
```

**4. Pub/Sub Channels**
```
room:{roomId}:playback  → Playback events (play, pause, seek)
room:{roomId}:queue     → Queue changes
room:{roomId}:chat      → Chat messages (opcional)
```

#### **B. Frontend (Packages - TypeScript)**

**Principio Arquitectónico:** Los packages no conocen las apps. `aula-sonora` debe ser un package reutilizable que cualquier app (Web, Mobile, Desktop) pueda consumir.

**1. Nuevo Package: `@sonantica/aula-sonora`**
```
packages/aula-sonora/
├── src/
│   ├── stores/
│   │   └── useListeningRoomStore.ts
│   ├── services/
│   │   ├── ListeningRoomService.ts
│   │   └── WebSocketManager.ts
│   ├── hooks/
│   │   ├── useListeningRoom.ts
│   │   └── useRoomSync.ts
│   └── types/
│       └── room.types.ts
```

**2. Aula Sonora Store (Zustand)**
```typescript
interface AulaSonoraState {
  currentAula: AulaSonora | null;
  isHost: boolean;
  listeners: User[];
  syncState: SyncState;
  audioQuality: AudioQualityMetrics; // NUEVO: Monitoreo de calidad en tiempo real
  
  // Actions
  createAula: (name: string, isPublic: boolean) => Promise<void>;
  joinAula: (aulaId: string) => Promise<void>;
  leaveAula: () => Promise<void>;
  syncPlayback: (state: PlaybackState) => void;
  reportQuality: (metrics: AudioQualityMetrics) => void; // NUEVO
}
```

**3. Sincronización de Playback**
```typescript
class PlaybackSynchronizer {
  private maxDrift = 0.5; // 500ms tolerance
  
  sync(localTime: number, remoteTime: number, remoteTimestamp: number): void {
    const now = Date.now();
    const latency = (now - remoteTimestamp) / 1000;
    const expectedTime = remoteTime + latency;
    const drift = Math.abs(localTime - expectedTime);
    
    if (drift > this.maxDrift) {
      // Resync
      this.playerEngine.seek(expectedTime);
    }
  }
}
```

### 3.4 Optimización de Recursos Compartidos

#### **Problema:** Múltiples usuarios reproduciendo la misma canción = múltiples streams

#### **Solución 1: Shared Buffer Pool (Frontend)**

```typescript
class SharedBufferPool {
  private buffers: Map<string, {
    blob: Blob;
    refCount: number;
    lastAccess: number;
    priority: number; // Based on popularity
  }> = new Map();
  
  async getBuffer(trackId: string, roomId?: string): Promise<Blob> {
    if (this.buffers.has(trackId)) {
      const entry = this.buffers.get(trackId)!;
      entry.refCount++;
      entry.lastAccess = Date.now();
      return entry.blob;
    }
    
    // Fetch and cache
    const blob = await this.fetchTrack(trackId);
    this.buffers.set(trackId, {
      blob,
      refCount: 1,
      lastAccess: Date.now(),
      priority: roomId ? this.getRoomPriority(roomId) : 0
    });
    
    return blob;
  }
  
  releaseBuffer(trackId: string): void {
    const entry = this.buffers.get(trackId);
    if (entry) {
      entry.refCount--;
      if (entry.refCount === 0) {
        // Don't delete immediately, keep for potential reuse
        setTimeout(() => this.evictIfUnused(trackId), 60000); // 1 min
      }
    }
  }
  
  private evictIfUnused(trackId: string): void {
    const entry = this.buffers.get(trackId);
    if (entry && entry.refCount === 0) {
      // Evict based on priority
      if (entry.priority < this.minPriority) {
        URL.revokeObjectURL(entry.blob);
        this.buffers.delete(trackId);
      }
    }
  }
}
```

#### **Solución 2: Backend Stream Deduplication (Stream Core)**

```go
type StreamSession struct {
    TrackID     string
    Readers     []*http.ResponseWriter
    FileStream  *os.File
    RefCount    int32
    Priority    int
    LastAccess  time.Time
}

var streamSessions = sync.Map{} // trackId → *StreamSession

func (s *StreamService) ServeStream(w http.ResponseWriter, trackId string) {
    session, exists := streamSessions.Load(trackId)
    
    if exists {
        // Reuse existing stream session
        s := session.(*StreamSession)
        atomic.AddInt32(&s.RefCount, 1)
        s.Readers = append(s.Readers, &w)
        s.LastAccess = time.Now()
        
        // Broadcast chunks to all readers
        s.BroadcastToReaders()
    } else {
        // Create new stream session
        s := &StreamSession{
            TrackID:    trackId,
            Readers:    []*http.ResponseWriter{&w},
            RefCount:   1,
            Priority:   s.calculatePriority(trackId),
            LastAccess: time.Now(),
        }
        streamSessions.Store(trackId, s)
        
        go s.StreamFile()
    }
}
```

### 3.5 Priorización de Streams Populares

#### **Sistema de Prioridad Dinámica**

```typescript
interface StreamPriority {
  trackId: string;
  activeListeners: number;
  roomCount: number;
  lastPlayed: number;
  priority: number; // Calculated score
}

class PriorityManager {
  calculatePriority(track: StreamPriority): number {
    const now = Date.now();
    const timeSincePlay = (now - track.lastPlayed) / 1000; // seconds
    
    // Score formula
    const listenerScore = track.activeListeners * 10;
    const roomScore = track.roomCount * 5;
    const recencyScore = Math.max(0, 100 - (timeSincePlay / 60)); // Decay over 100 min
    
    return listenerScore + roomScore + recencyScore;
  }
  
  shouldKeepInCache(track: StreamPriority, threshold: number): boolean {
    return this.calculatePriority(track) > threshold;
  }
}
```

#### **Configuración de Usuario (Settings)**

```typescript
interface StreamingSettings {
  // Cache settings
  maxCacheSize: number; // MB
  popularTrackThreshold: number; // Min listeners to consider "popular"
  popularTrackCacheDuration: number; // Minutes
  
  // Room settings
  autoJoinPublicRooms: boolean;
  showHiddenMode: boolean; // "Lurker mode"
  syncTolerance: number; // ms
}
```

### 3.6 Modo "Oculto" (Lurker Mode)

```typescript
interface RoomParticipant {
  userId: string;
  username: string;
  isVisible: boolean; // false = lurker mode
  joinedAt: number;
}

// En el backend, solo mostrar usuarios visibles
function getVisibleListeners(roomId: string): RoomParticipant[] {
  return room.listeners.filter(l => l.isVisible);
}

// Pero contar todos para priorización
function getTotalListeners(roomId: string): number {
  return room.listeners.length; // Incluye lurkers
}
```

---

## 4. Plan de Implementación

### **Fase 1: Auditoría y Optimización de Calidad (Semana 1)**

#### Día 1-2: Auditoría del Pipeline
- [ ] Instrumentar todo el pipeline con logging detallado
- [ ] Medir latencias en cada etapa
- [ ] Verificar que no hay re-encoding
- [ ] Probar con FLAC 24-bit/96kHz

#### Día 3-4: Optimizaciones Backend
- [ ] Implementar chunk size dinámico
- [ ] Caché de metadatos en Redis
- [ ] Calcular checksums de archivos
- [ ] Headers de calidad de audio

#### Día 5-7: Optimizaciones Frontend
- [ ] Shared Buffer Pool
- [ ] Monitoreo de calidad en tiempo real
- [ ] Validación de integridad
- [ ] UI para mostrar calidad de audio

### **Fase 2: Infraestructura de Rooms (Semana 2-3)**

#### Semana 2: Backend
- [ ] Crear `ListeningRoomService` en Go Core
- [ ] Implementar WebSocket endpoints
- [ ] Redis schema para rooms
- [ ] Pub/Sub para sincronización
- [ ] Stream deduplication

#### Semana 3: Frontend
- [ ] Package `@sonantica/listening-rooms`
- [ ] `useListeningRoomStore` (Zustand)
- [ ] `PlaybackSynchronizer`
- [ ] WebSocket client
- [ ] UI básica de rooms

### **Fase 3: Features Colaborativas (Semana 4)**

- [ ] Sistema de priorización
- [ ] Modo oculto (lurker)
- [ ] Settings de streaming
- [ ] Chat en tiempo real (opcional)
- [ ] Discover public rooms

### **Fase 4: Testing y Optimización (Semana 5)**

- [ ] Load testing (100+ usuarios en una room)
- [ ] Latency testing (sincronización)
- [ ] Memory profiling (shared buffers)
- [ ] Audio quality validation
- [ ] UX testing

---

## 5. Métricas de Éxito

### **Calidad de Audio:**
- ✅ 0% de re-encoding en el pipeline
- ✅ Soporte para FLAC 24-bit/192kHz sin degradación
- ✅ Latencia de buffering < 500ms
- ✅ Gapless playback < 50ms de gap

### **Streaming Colaborativo:**
- ✅ Sincronización entre usuarios < 500ms drift
- ✅ Soporte para 100+ usuarios por room
- ✅ Reducción de 70% en requests duplicados (mismo track)
- ✅ Caché de tracks populares con hit rate > 80%

### **UX:**
- ✅ Tiempo de join a room < 2 segundos
- ✅ UI muestra calidad de audio en tiempo real
- ✅ Modo oculto funcional
- ✅ Settings personalizables

---

## 6. Consideraciones de Arquitectura

### **6.1 Escalabilidad**
- Redis Cluster para múltiples rooms
- Go Core horizontal scaling (stateless)
- WebSocket load balancing (sticky sessions)

### **6.2 Seguridad**
- Autenticación JWT para WebSockets
- Rate limiting por usuario
- Validación de permisos (host vs listener)

### **6.3 Observabilidad**
- Métricas de Prometheus:
  - `sonantica_room_active_count`
  - `sonantica_room_listeners_total`
  - `sonantica_stream_cache_hit_ratio`
  - `sonantica_audio_quality_degradation_count`

---

## 7. Preguntas Abiertas

1. **¿Permitir control compartido de la cola?**
   - Opción A: Solo host controla
   - Opción B: Votación democrática
   - Opción C: Configurable por room

2. **¿Monetización de rooms públicas?**
   - Rooms premium con más listeners
   - Rooms privadas ilimitadas

3. **¿Integración con analytics?**
   - Tracking de "listening together" sessions
   - Recomendaciones basadas en rooms

4. **¿Soporte para video en el futuro?**
   - Arquitectura debe ser extensible

---

## 8. Referencias Técnicas

### **Estándares de Audio:**
- [Web Audio API Specification](https://www.w3.org/TR/webaudio/)
- [FLAC Format Specification](https://xiph.org/flac/format.html)
- [HTTP Range Requests (RFC 7233)](https://tools.ietf.org/html/rfc7233)

### **Sincronización de Media:**
- [WebRTC Media Sync](https://www.w3.org/TR/webrtc/)
- [MPEG-DASH Low Latency](https://dashif.org/docs/)

### **Arquitecturas de Referencia:**
- Spotify Connect Protocol
- Discord Voice Channels
- Twitch Low Latency Streaming

---

## Conclusión

Este plan establece una ruta clara para:
1. **Garantizar calidad de audio sin pérdidas** en todo el pipeline
2. **Optimizar el streaming** con caché inteligente y deduplicación
3. **Crear un sistema colaborativo** tipo "radio social" escalable

La filosofía de Sonántica se mantiene: **"Respeto por el sonido y autonomía del usuario"**.

El usuario decide si quiere escuchar solo o en comunidad, pero la calidad nunca se compromete.

---

**Próximos pasos:** Revisar este plan, ajustar prioridades y comenzar Fase 1.
