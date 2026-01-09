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

```

### 3.7 Gestión de Memoria y Arquitectura P2P Híbrida

#### **Problema Crítico: Saturación de Memoria del Servidor**

Con múltiples Aulas Sonoras activas, el servidor podría saturar su memoria si:
- Cada oyente descarga el mismo track independientemente
- El servidor mantiene múltiples streams activos del mismo archivo
- No hay límites de memoria para caché y buffers

**Objetivo:** Distribuir la carga entre el servidor y los clientes, permitiendo que **los usuarios aporten sus recursos** (ancho de banda, almacenamiento) para sostener el sistema.

---

#### **Solución 1: WebRTC P2P Global - "Red de Colaboración Sonántica"** (Prioridad Alta)

**Filosofía:** Cada usuario de Sonántica ayuda al próximo, **independientemente de si están en la misma Aula o no**. Es una **red global de colaboración** donde todos contribuyen al bien común.

**Concepto:** Los usuarios se conectan **directamente entre sí** (peer-to-peer) para compartir audio, formando una **red distribuida global** similar a BitTorrent, pero con respeto por la calidad y la intención del sonido.

```
┌─────────────────────────────────────────────────────────────┐
│           RED GLOBAL DE COLABORACIÓN SONÁNTICA               │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  Aula A      │         │  Aula B      │                  │
│  │  ┌────────┐  │         │  ┌────────┐  │                  │
│  │  │Oyente 1│◄─┼─────────┼─►│Oyente 4│  │                  │
│  │  └────────┘  │         │  └────────┘  │                  │
│  └──────┬───────┘         └───────┬──────┘                  │
│         │                         │                          │
│         │    WebRTC P2P (Global)  │                          │
│         │                         │                          │
│  ┌──────▼───────┐         ┌───────▼──────┐                  │
│  │ Usuario Solo │◄────────┤ Usuario Solo │                  │
│  │  (Oyente 2)  │         │  (Oyente 3)  │                  │
│  └──────────────┘         └──────────────┘                  │
│                                                              │
│  📡 Todos comparten con todos, sin importar el Aula          │
│  🤝 "Cada usuario ayuda al próximo"                          │
└─────────────────────────────────────────────────────────────┘
```

**Principios de la Red Global:**

1. **Compartir es Universal**
   - Si tienes un track en caché, lo compartes con **cualquier usuario** que lo necesite
   - No importa si están en tu Aula, en otra Aula, o escuchando solos
   - La colaboración trasciende las fronteras de las Aulas

2. **Prioridad Inteligente**
   - Usuarios en la **misma Aula** tienen prioridad (menor latencia)
   - Pero si no hay peers en el Aula, se busca en la **red global**
   - El servidor es el **último recurso**, no el primero

3. **Calidad Preservada**
   - Los chunks son binarios idénticos (no hay re-encoding)
   - La calidad se mantiene independientemente de cuántos peers intermedios haya
   - Validación de checksums en cada transferencia

**Implementación:**

```typescript
// Frontend: Red Global P2P
class GlobalP2PNetwork {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private audioChunks: Map<string, ArrayBuffer[]> = new Map();
  
  /**
   * Buscar peers que tengan un track (GLOBAL, no solo en el Aula)
   */
  async findPeersWithTrack(trackId: string, currentAulaId?: string): Promise<PeerInfo[]> {
    // 1. Buscar primero en el Aula actual (menor latencia)
    const aulaPeers = currentAulaId 
      ? await this.findPeersInAula(trackId, currentAulaId)
      : [];
    
    if (aulaPeers.length >= 3) {
      console.log(`📡 Found ${aulaPeers.length} peers in current Aula`);
      return aulaPeers;
    }
    
    // 2. Buscar en TODA la red global de Sonántica
    const globalPeers = await this.findPeersGlobally(trackId);
    console.log(`🌍 Found ${globalPeers.length} peers globally`);
    
    // 3. Combinar y priorizar por latencia
    return [...aulaPeers, ...globalPeers].sort((a, b) => a.latency - b.latency);
  }
  
  /**
   * Anunciar disponibilidad GLOBAL (no solo en Aula)
   */
  async announceAvailability(trackId: string, aulaId?: string): Promise<void> {
    await fetch('/api/p2p/announce', {
      method: 'POST',
      body: JSON.stringify({
        trackId,
        aulaId,  // Opcional - para priorización
        peerId: this.myPeerId,
        chunkMap: this.getChunkMap(trackId),
        bandwidth: await this.estimateBandwidth()
      })
    });
    
    console.log(`🌍 Announced availability of ${trackId} to global network`);
  }
  
  /**
   * Descargar de peers globales (no solo del Aula)
   */
  async downloadFromGlobalNetwork(trackId: string, aulaId?: string): Promise<Blob> {
    const peers = await this.findPeersWithTrack(trackId, aulaId);
    
    if (peers.length === 0) {
      console.log('☁️ No peers available, downloading from server');
      return await this.downloadFromServer(trackId);
    }
    
    console.log(`📡 Downloading from ${peers.length} global peers`);
    const chunks = await this.downloadChunksFromPeers(trackId, peers);
    const audioBlob = new Blob(chunks, { type: 'audio/flac' });
    
    // Ahora nosotros también ayudamos a la red global
    await this.becomeGlobalSeeder(trackId, audioBlob, aulaId);
    
    return audioBlob;
  }
  
  /**
   * Convertirse en seeder GLOBAL (ayudar a todos)
   */
  private async becomeGlobalSeeder(
    trackId: string, 
    audioBlob: Blob, 
    aulaId?: string
  ): Promise<void> {
    const chunks = await this.splitIntoChunks(audioBlob, 256 * 1024);
    this.audioChunks.set(trackId, chunks);
    
    // Anunciar a la red GLOBAL
    await this.announceAvailability(trackId, aulaId);
    
    console.log(`🤝 Now seeding ${trackId} for the global Sonántica network`);
  }
}
```

**Backend: Registro Global de Peers**

```go
// Backend: Registro global de disponibilidad
type GlobalPeerRegistry struct {
    peers sync.Map  // trackId → []PeerAvailability
}

type PeerAvailability struct {
    PeerID    string
    TrackID   string
    AulaID    *string  // Opcional - para priorización
    ChunkMap  []bool
    Bandwidth int
    Latency   int      // ms estimado
    LastSeen  time.Time
}

func (r *GlobalPeerRegistry) FindPeersForTrack(trackId string, requesterAulaId *string) []PeerAvailability {
    allPeers, ok := r.peers.Load(trackId)
    if !ok {
        return []PeerAvailability{}
    }
    
    peers := allPeers.([]PeerAvailability)
    
    // Priorizar peers en la misma Aula
    if requesterAulaId != nil {
        sort.SliceStable(peers, func(i, j int) bool {
            iSameAula := peers[i].AulaID != nil && *peers[i].AulaID == *requesterAulaId
            jSameAula := peers[j].AulaID != nil && *peers[j].AulaID == *requesterAulaId
            
            if iSameAula && !jSameAula {
                return true  // i va primero
            }
            if !iSameAula && jSameAula {
                return false  // j va primero
            }
            
            // Mismo Aula o ambos diferentes, ordenar por latencia
            return peers[i].Latency < peers[j].Latency
        })
    }
    
    return peers
}

func (r *GlobalPeerRegistry) AnnouncePeer(peer PeerAvailability) {
    peer.LastSeen = time.Now()
    
    // Agregar a la lista global
    allPeers, _ := r.peers.LoadOrStore(peer.TrackID, []PeerAvailability{})
    peers := allPeers.([]PeerAvailability)
    
    // Actualizar o agregar
    found := false
    for i, p := range peers {
        if p.PeerID == peer.PeerID {
            peers[i] = peer
            found = true
            break
        }
    }
    
    if !found {
        peers = append(peers, peer)
    }
    
    r.peers.Store(peer.TrackID, peers)
    
    log.Printf("🌍 Peer %s announced availability of %s (Aula: %v)", 
        peer.PeerID, peer.TrackID, peer.AulaID)
}

// Limpiar peers inactivos (no vistos en 5 minutos)
func (r *GlobalPeerRegistry) CleanupInactivePeers() {
    threshold := time.Now().Add(-5 * time.Minute)
    
    r.peers.Range(func(key, value interface{}) bool {
        trackId := key.(string)
        peers := value.([]PeerAvailability)
        
        // Filtrar peers activos
        activePeers := []PeerAvailability{}
        for _, peer := range peers {
            if peer.LastSeen.After(threshold) {
                activePeers = append(activePeers, peer)
            }
        }
        
        if len(activePeers) == 0 {
            r.peers.Delete(trackId)
        } else {
            r.peers.Store(trackId, activePeers)
        }
        
        return true
    })
}
```

**Filosofía de Colaboración Universal:**

```typescript
/**
 * Configuración de Contribución Global
 * 
 * Por defecto, TODOS los usuarios contribuyen a la red global.
 * Esto refleja la filosofía de Sonántica: "Conocimiento compartido"
 * 
 * IMPORTANTE: El usuario SIEMPRE tiene la opción de opt-out completo.
 * Esto puede tener implicaciones futuras (ver sección 3.7.6)
 */
interface GlobalContributionConfig {
  // Participación P2P
  p2pEnabled: boolean;               // Default: true | Opt-out completo
  
  // Configuración de contribución (solo si p2pEnabled = true)
  maxBandwidthMBPerDay: number;      // Default: 500MB
  maxStorageGB: number;              // Default: 2GB
  shareWithAnyUser: boolean;         // Default: true (no solo Aula)
  prioritizeAulaMembers: boolean;    // Default: true (menor latencia)
  
  // Configuración de descarga (independiente de contribución)
  allowDownloadFromPeers: boolean;   // Default: true | Puede descargar de otros
  preferServerOverP2P: boolean;      // Default: false | Forzar servidor
}

const DEFAULT_CONFIG: GlobalContributionConfig = {
  // Por defecto, todos participan
  p2pEnabled: true,  // ✅ Contribuir a la red
  
  // Límites razonables
  maxBandwidthMBPerDay: 500,
  maxStorageGB: 2,
  
  // Compartir con todos
  shareWithAnyUser: true,
  prioritizeAulaMembers: true,
  
  // Permitir descargas P2P
  allowDownloadFromPeers: true,
  preferServerOverP2P: false
};

/**
 * Configuración de "Solo Servidor" (Opt-out completo del P2P)
 */
const SERVER_ONLY_CONFIG: GlobalContributionConfig = {
  p2pEnabled: false,  // ❌ No contribuir
  maxBandwidthMBPerDay: 0,
  maxStorageGB: 0,
  shareWithAnyUser: false,
  prioritizeAulaMembers: false,
  allowDownloadFromPeers: false,  // ❌ No descargar de peers
  preferServerOverP2P: true  // ✅ Solo servidor
};
```

**UI de Contribución Global (con Opt-out):**

```tsx
function GlobalContributionSettings() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const stats = useContributionStats();
  
  // Detectar si el usuario ha optado por no participar
  const isOptedOut = !config.p2pEnabled;
  
  return (
    <div className="contribution-settings">
      <h3>🤝 Contribución a la Red Global de Sonántica</h3>
      <p className="philosophy">
        "Cada usuario ayuda al próximo. Juntos, creamos una red de 
        colaboración donde el sonido fluye libremente sin sacrificar calidad."
      </p>
      
      {/* Opción principal: Participar o no */}
      <div className="primary-toggle">
        <label>
          <input 
            type="checkbox" 
            checked={config.p2pEnabled}
            onChange={(e) => {
              if (!e.target.checked) {
                // Mostrar advertencia antes de opt-out
                showOptOutWarning(() => {
                  setConfig(SERVER_ONLY_CONFIG);
                });
              } else {
                setConfig(DEFAULT_CONFIG);
              }
            }}
          />
          <strong>Participar en la red P2P global</strong>
        </label>
        <p className="help-text">
          Comparte tu caché con otros usuarios y descarga de ellos. 
          Esto reduce la carga del servidor y mejora la experiencia para todos.
        </p>
      </div>
      
      {/* Advertencia si está opted-out */}
      {isOptedOut && (
        <div className="opt-out-warning">
          <h4>⚠️ Modo Solo Servidor</h4>
          <p>
            Has optado por no participar en la red P2P. 
            Todas tus descargas provendrán directamente del servidor.
          </p>
          <details>
            <summary>Implicaciones actuales y futuras</summary>
            <ul>
              <li>✅ Mayor privacidad (no compartes tu IP con otros usuarios)</li>
              <li>⚠️ Descargas más lentas (depende solo del servidor)</li>
              <li>⚠️ Mayor latencia en Aulas Sonoras</li>
              <li>⚠️ No contribuyes a la comunidad</li>
              <li className="future">
                🔮 <strong>Futuro:</strong> Posibles limitaciones en features premium
              </li>
              <li className="future">
                🔮 <strong>Futuro:</strong> Prioridad baja en colas del servidor
              </li>
              <li className="future">
                🔮 <strong>Futuro:</strong> Posible costo por uso exclusivo del servidor
              </li>
            </ul>
          </details>
        </div>
      )}
      
      {/* Configuración detallada (solo si participa) */}
      {config.p2pEnabled && (
        <>
          <div className="slider">
            <label>
              Ancho de banda diario: {config.maxBandwidthMBPerDay} MB
              <input 
                type="range" 
                min="100" 
                max="2000" 
                value={config.maxBandwidthMBPerDay}
                onChange={(e) => setConfig({
                  ...config, 
                  maxBandwidthMBPerDay: Number(e.target.value)
                })}
              />
            </label>
            <p className="help-text">
              Cuánto estás dispuesto a compartir con otros usuarios por día
            </p>
          </div>
          
          <div className="slider">
            <label>
              Almacenamiento local: {config.maxStorageGB} GB
              <input 
                type="range" 
                min="0.5" 
                max="10" 
                step="0.5"
                value={config.maxStorageGB}
                onChange={(e) => setConfig({
                  ...config, 
                  maxStorageGB: Number(e.target.value)
                })}
              />
            </label>
            <p className="help-text">
              Espacio en disco para cachear tracks y compartir con la red
            </p>
          </div>
          
          {/* Opciones avanzadas */}
          <details className="advanced-options">
            <summary>Opciones avanzadas</summary>
            
            <label>
              <input 
                type="checkbox" 
                checked={config.shareWithAnyUser}
                onChange={(e) => setConfig({
                  ...config, 
                  shareWithAnyUser: e.target.checked
                })}
              />
              Compartir con cualquier usuario (no solo mi Aula)
            </label>
            
            <label>
              <input 
                type="checkbox" 
                checked={config.prioritizeAulaMembers}
                onChange={(e) => setConfig({
                  ...config, 
                  prioritizeAulaMembers: e.target.checked
                })}
              />
              Priorizar usuarios de mi Aula (menor latencia)
            </label>
            
            <label>
              <input 
                type="checkbox" 
                checked={config.allowDownloadFromPeers}
                onChange={(e) => setConfig({
                  ...config, 
                  allowDownloadFromPeers: e.target.checked
                })}
              />
              Permitir descargas desde otros usuarios
            </label>
          </details>
          
          {/* Estadísticas de contribución */}
          <div className="stats">
            <h4>📊 Tu Contribución</h4>
            <div className="stat-grid">
              <div className="stat">
                <span className="value">{stats.usersHelped}</span>
                <span className="label">Usuarios ayudados hoy</span>
              </div>
              <div className="stat">
                <span className="value">{stats.mbShared} MB</span>
                <span className="label">Compartidos hoy</span>
              </div>
              <div className="stat">
                <span className="value">{stats.tracksSeeded}</span>
                <span className="label">Tracks seedeados</span>
              </div>
              <div className="stat">
                <span className="value">{stats.contributionScore}</span>
                <span className="label">Puntuación de contribución</span>
              </div>
            </div>
            
            {/* Badge de contribución */}
            {stats.contributionScore > 100 && (
              <div className="contribution-badge">
                🏆 {getContributionBadge(stats.contributionScore)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Advertencia antes de opt-out
 */
function showOptOutWarning(onConfirm: () => void) {
  const confirmed = confirm(`
    ⚠️ Desactivar la red P2P

    Si desactivas la participación en la red P2P:
    
    ✅ Mayor privacidad (no compartes tu IP)
    ⚠️ Descargas más lentas (solo del servidor)
    ⚠️ No contribuyes a la comunidad
    
    🔮 En el futuro, esto podría implicar:
    - Limitaciones en features premium
    - Prioridad baja en el servidor
    - Posible costo por uso exclusivo del servidor
    
    ¿Estás seguro de que quieres continuar?
  `);
  
  if (confirmed) {
    onConfirm();
  }
}
```

---

#### **3.7.6 Implicaciones Futuras del Opt-out de P2P**

**Filosofía:** Respetamos la autonomía del usuario, pero la colaboración tiene valor.

**Implicaciones Actuales (Implementadas):**

| Aspecto | Con P2P | Sin P2P (Opt-out) |
|---------|---------|-------------------|
| **Velocidad de descarga** | Rápida (múltiples peers) | Lenta (solo servidor) |
| **Latencia** | Baja (peers cercanos) | Alta (servidor remoto) |
| **Privacidad** | IP visible a peers | IP solo visible al servidor |
| **Contribución** | Ayuda a la comunidad | No contribuye |
| **Costo para el proyecto** | Bajo (P2P distribuido) | Alto (servidor dedicado) |

**Implicaciones Futuras (Preparadas, no implementadas aún):**

```typescript
/**
 * Sistema de Incentivos y Limitaciones (Futuro)
 * 
 * Usuarios que NO participan en P2P podrían tener:
 */
interface FutureP2PImplications {
  // Limitaciones de features
  maxAulaSizeWithoutP2P: number;        // Ej: 10 oyentes vs 100 con P2P
  maxConcurrentStreamsWithoutP2P: number; // Ej: 1 stream vs 5 con P2P
  accessToPremiumFeatures: boolean;     // Ej: false sin P2P
  
  // Priorización del servidor
  serverPriority: 'low' | 'normal' | 'high';  // 'low' sin P2P
  maxQueuePosition: number;             // Posición en cola del servidor
  
  // Costos (opcional, a definir)
  requiresSubscription: boolean;        // Ej: true para uso exclusivo del servidor
  monthlyServerCost: number;            // Ej: $5/mes para no participar en P2P
  
  // Badges y reconocimiento
  contributionBadge: string | null;     // null sin P2P
  publicProfile: boolean;               // Ej: no aparece en "top contributors"
}

const WITH_P2P_BENEFITS: FutureP2PImplications = {
  maxAulaSizeWithoutP2P: 100,
  maxConcurrentStreamsWithoutP2P: 5,
  accessToPremiumFeatures: true,
  serverPriority: 'high',
  maxQueuePosition: 1,
  requiresSubscription: false,
  monthlyServerCost: 0,
  contributionBadge: 'Contributor',
  publicProfile: true
};

const WITHOUT_P2P_LIMITATIONS: FutureP2PImplications = {
  maxAulaSizeWithoutP2P: 10,  // ⚠️ Limitado
  maxConcurrentStreamsWithoutP2P: 1,  // ⚠️ Solo 1 stream
  accessToPremiumFeatures: false,  // ❌ Sin features premium
  serverPriority: 'low',  // ⚠️ Baja prioridad
  maxQueuePosition: 100,  // ⚠️ Al final de la cola
  requiresSubscription: true,  // 💰 Requiere pago
  monthlyServerCost: 5,  // 💰 $5/mes
  contributionBadge: null,  // Sin badge
  publicProfile: false  // No aparece en rankings
};
```

**Estrategia de Implementación Futura:**

```typescript
/**
 * Fase 1 (Actual): Opt-out sin penalizaciones
 * - El usuario puede optar por no participar
 * - Solo advertencias informativas
 * - Sin limitaciones técnicas
 */

/**
 * Fase 2 (6 meses): Incentivos suaves
 * - Badges de contribución
 * - Rankings públicos de contributors
 * - Features experimentales solo para contributors
 */

/**
 * Fase 3 (1 año): Limitaciones graduales
 * - Prioridad baja en servidor para non-contributors
 * - Límite de Aulas Sonoras (10 vs 100 oyentes)
 * - Límite de streams concurrentes
 */

/**
 * Fase 4 (2 años): Modelo sostenible
 * - Opción 1: Contribuir con P2P (gratis)
 * - Opción 2: Pagar por uso exclusivo del servidor ($5/mes)
 * - Opción 3: Modelo híbrido (contribuir menos + pagar menos)
 */
```

**Comunicación al Usuario:**

```tsx
function P2POptOutExplanation() {
  return (
    <div className="explanation">
      <h4>¿Por qué incentivamos la participación en P2P?</h4>
      
      <p>
        Sonántica es un proyecto open-source que depende de la colaboración 
        de la comunidad. El servidor tiene costos reales (hosting, ancho de banda).
      </p>
      
      <p>
        Cuando participas en la red P2P:
      </p>
      <ul>
        <li>✅ Reduces los costos del servidor</li>
        <li>✅ Mejoras la experiencia para todos</li>
        <li>✅ Haces el proyecto sostenible</li>
      </ul>
      
      <p>
        <strong>Siempre respetaremos tu autonomía.</strong> Puedes optar por 
        no participar, pero en el futuro esto podría implicar limitaciones o 
        costos para mantener el proyecto sostenible.
      </p>
      
      <p className="philosophy">
        "El conocimiento compartido no es solo código, es también infraestructura."
      </p>
    </div>
  );
}
```

**Configuración en Backend:**

```go
// Backend: Tracking de participación P2P
type UserP2PProfile struct {
    UserID              string
    P2PEnabled          bool
    ContributionScore   int64  // Calculado basado en MB compartidos
    LastContribution    time.Time
    TotalMBShared       int64
    TotalUsersHelped    int64
    
    // Futuro: Limitaciones aplicadas
    ServerPriority      string  // "low", "normal", "high"
    MaxAulaSize         int
    MaxConcurrentStreams int
    RequiresSubscription bool
}

func (p *UserP2PProfile) CalculateServerPriority() string {
    if !p.P2PEnabled {
        return "low"  // Baja prioridad si no participa
    }
    
    if p.ContributionScore > 1000 {
        return "high"  // Alta prioridad para contributors activos
    }
    
    return "normal"
}

func (p *UserP2PProfile) CanCreateAula(requestedSize int) bool {
    maxSize := 100  // Default
    
    if !p.P2PEnabled {
        maxSize = 10  // Limitado sin P2P
    }
    
    return requestedSize <= maxSize
}
```

---

**Resumen de Implicaciones:**

| Decisión del Usuario | Ahora | 6 meses | 1 año | 2 años |
|----------------------|-------|---------|-------|--------|
| **Participar en P2P** | ✅ Gratis, todas las features | ✅ Badges, rankings | ✅ Prioridad alta | ✅ Gratis siempre |
| **No participar** | ⚠️ Advertencia | ⚠️ Sin badges | ⚠️ Limitaciones | 💰 $5/mes o limitado |

**Nota:** Estas implicaciones futuras están **preparadas en el código** pero **no implementadas**. Permiten evolucionar el modelo de sostenibilidad sin romper la arquitectura.

```
┌─────────────────────────────────────────────────────────────┐
│                    AULA SONORA (P2P)                         │
│                                                              │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐    │
│  │ Oyente 1 │◄────────┤ Oyente 2 │────────►│ Oyente 3 │    │
│  │ (Seeder) │         │ (Peer)   │         │ (Peer)   │    │
│  └────┬─────┘         └────┬─────┘         └────┬─────┘    │
│       │                    │                    │           │
│       │    WebRTC Data Channels (Audio Chunks)  │           │
│       │                    │                    │           │
│       └────────────────────┴────────────────────┘           │
│                          ↓                                   │
│              ┌───────────────────────┐                       │
│              │  Signaling Server     │                       │
│              │  (Solo coordina)      │                       │
│              └───────────────────────┘                       │
│                                                              │
│  📊 Servidor: Solo coordina | Oyentes: Comparten audio      │
└─────────────────────────────────────────────────────────────┘
```

**Implementación:**

```typescript
// Frontend: P2P Audio Sharing Service
class P2PAudioService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private audioChunks: Map<string, ArrayBuffer[]> = new Map();
  
  /**
   * Configurar como "seeder" (primer oyente que descarga del servidor)
   */
  async becomeSeeder(trackId: string, audioBlob: Blob): Promise<void> {
    // Dividir el audio en chunks
    const chunks = await this.splitIntoChunks(audioBlob, 256 * 1024); // 256KB chunks
    this.audioChunks.set(trackId, chunks);
    
    // Anunciar al servidor que tenemos el track completo
    await this.announceAvailability(trackId);
  }
  
  /**
   * Descargar audio de otros peers (en vez del servidor)
   */
  async downloadFromPeers(trackId: string, aulaId: string): Promise<Blob> {
    // 1. Preguntar al servidor qué peers tienen este track
    const availablePeers = await this.findPeersWithTrack(trackId, aulaId);
    
    if (availablePeers.length === 0) {
      // No hay peers, descargar del servidor (fallback)
      return await this.downloadFromServer(trackId);
    }
    
    // 2. Conectar con múltiples peers vía WebRTC
    const chunks: ArrayBuffer[] = [];
    const chunkCount = await this.getChunkCount(trackId);
    
    for (let i = 0; i < chunkCount; i++) {
      // Descargar cada chunk del peer más rápido disponible
      const peer = this.selectFastestPeer(availablePeers);
      const chunk = await this.requestChunk(peer, trackId, i);
      chunks[i] = chunk;
    }
    
    // 3. Reconstruir el audio
    const audioBlob = new Blob(chunks, { type: 'audio/flac' });
    
    // 4. Ahora nosotros también somos seeder
    await this.becomeSeeder(trackId, audioBlob);
    
    return audioBlob;
  }
  
  /**
   * Compartir un chunk con otro peer
   */
  private async shareChunk(peerId: string, trackId: string, chunkIndex: number): Promise<void> {
    const connection = this.peerConnections.get(peerId);
    if (!connection) return;
    
    const dataChannel = connection.createDataChannel('audio-chunk');
    const chunks = this.audioChunks.get(trackId);
    
    if (chunks && chunks[chunkIndex]) {
      dataChannel.send(chunks[chunkIndex]);
    }
  }
}
```

**Backend: Signaling Server (Solo coordina, no transfiere audio)**

```go
// Backend: Solo coordina qué peers tienen qué tracks
type PeerAvailability struct {
    PeerID    string
    TrackID   string
    ChunkMap  []bool  // Qué chunks tiene disponibles
    Bandwidth int     // Estimación de velocidad
}

var peerRegistry = sync.Map{} // trackId → []PeerAvailability

func (s *SignalingService) FindPeersWithTrack(trackId string) []PeerAvailability {
    peers, ok := peerRegistry.Load(trackId)
    if !ok {
        return []PeerAvailability{}
    }
    return peers.([]PeerAvailability)
}

func (s *SignalingService) AnnouncePeerAvailability(peerId, trackId string, chunks []bool) {
    // Registrar que este peer tiene el track
    // El servidor NO almacena el audio, solo coordina
}
```

**Beneficios:**
- ✅ **70-90% reducción** en ancho de banda del servidor
- ✅ **Escalabilidad masiva** - Más oyentes = más seeders
- ✅ **Cero costo adicional** de infraestructura
- ✅ **Calidad preservada** - Los chunks son binarios idénticos

**Desventajas:**
- ⚠️ Complejidad de implementación (WebRTC)
- ⚠️ Requiere NAT traversal (STUN/TURN servers)
- ⚠️ Latencia inicial más alta (descubrir peers)

---

#### **Solución 2: Hybrid CDN + P2P** (Prioridad Media)

**Concepto:** Combinar servidor tradicional con P2P para mejor experiencia.

```typescript
class HybridAudioLoader {
  async loadTrack(trackId: string, aulaId: string): Promise<Blob> {
    // 1. Intentar cargar de peers primero (P2P)
    const peersAvailable = await this.checkPeerAvailability(trackId, aulaId);
    
    if (peersAvailable.length >= 3) {
      // Suficientes peers, usar P2P
      console.log('📡 Loading from P2P network');
      return await this.p2pService.downloadFromPeers(trackId, aulaId);
    }
    
    // 2. Fallback: Cargar del servidor
    console.log('☁️ Loading from server (no peers available)');
    const blob = await this.downloadFromServer(trackId);
    
    // 3. Convertirse en seeder para futuros oyentes
    await this.p2pService.becomeSeeder(trackId, blob);
    
    return blob;
  }
}
```

---

#### **Solución 3: Client-Side Caching con Service Workers** (Prioridad Alta)

**Concepto:** Los navegadores cachean tracks localmente y los comparten con otros tabs/ventanas del mismo usuario.

```typescript
// Service Worker: Caché compartido entre tabs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/stream/')) {
    event.respondWith(
      caches.open('audio-cache-v1').then(async (cache) => {
        // 1. Intentar servir desde caché
        const cached = await cache.match(event.request);
        if (cached) {
          console.log('💾 Serving from cache');
          return cached;
        }
        
        // 2. Descargar del servidor
        const response = await fetch(event.request);
        
        // 3. Cachear para futuras requests
        if (response.ok) {
          cache.put(event.request, response.clone());
        }
        
        return response;
      })
    );
  }
});
```

**Configuración de Caché:**

```typescript
interface CacheConfig {
  maxSize: number;          // MB máximos de caché
  maxAge: number;           // Tiempo de vida (ms)
  evictionPolicy: 'LRU' | 'LFU' | 'PRIORITY';
}

class AudioCacheManager {
  private config: CacheConfig = {
    maxSize: 500,  // 500MB por defecto
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 días
    evictionPolicy: 'PRIORITY'  // Basado en popularidad
  };
  
  async evictIfNeeded(): Promise<void> {
    const usage = await this.getCacheSize();
    
    if (usage > this.config.maxSize * 1024 * 1024) {
      // Evict least priority tracks
      await this.evictLowPriorityTracks();
    }
  }
}
```

---

#### **Solución 4: Gestión de Memoria del Servidor** (Prioridad Crítica)

**Backend: Memory Limits y Eviction Policy**

```go
// Backend: Gestión estricta de memoria
type MemoryManager struct {
    maxMemoryMB      int
    currentUsageMB   int64
    streamSessions   sync.Map
    evictionPolicy   string  // "LRU", "LFU", "PRIORITY"
}

func (m *MemoryManager) CanAllocateStream(trackId string, sizeMB int) bool {
    currentUsage := atomic.LoadInt64(&m.currentUsageMB)
    
    if currentUsage + int64(sizeMB) > int64(m.maxMemoryMB) {
        // Intentar liberar memoria
        m.evictLowPrioritySessions()
        
        // Verificar de nuevo
        currentUsage = atomic.LoadInt64(&m.currentUsageMB)
        if currentUsage + int64(sizeMB) > int64(m.maxMemoryMB) {
            return false  // No hay memoria disponible
        }
    }
    
    return true
}

func (m *MemoryManager) evictLowPrioritySessions() {
    // Evict streams con menor prioridad
    sessions := m.getSortedByPriority()
    
    for _, session := range sessions {
        if session.RefCount == 0 && session.Priority < 50 {
            m.closeStreamSession(session.TrackID)
            
            // Liberar memoria
            atomic.AddInt64(&m.currentUsageMB, -session.SizeMB)
        }
    }
}
```

**Configuración de Límites:**

```yaml
# config/streaming.yaml
memory:
  max_total_mb: 2048        # 2GB máximo para streams
  max_per_stream_mb: 100    # 100MB por stream individual
  eviction_threshold: 0.8   # Evict cuando se alcance 80%
  
streaming:
  max_concurrent_streams: 50
  max_listeners_per_stream: 100
  chunk_size_kb: 256
```

---

#### **Solución 5: Contribución de Recursos del Usuario** (Innovador)

**Concepto:** Los usuarios pueden **optar por contribuir** recursos (ancho de banda, almacenamiento) a cambio de beneficios.

```typescript
interface UserContribution {
  userId: string;
  contributedBandwidthMB: number;  // MB compartidos con otros
  contributedStorageGB: number;    // GB de caché local
  contributionScore: number;       // Puntuación
}

class ContributionRewards {
  calculateRewards(contribution: UserContribution): Rewards {
    return {
      priorityStreaming: contribution.contributionScore > 100,
      extraStorage: Math.floor(contribution.contributedStorageGB * 2),
      premiumFeatures: contribution.contributionScore > 500,
      badge: this.getBadge(contribution.contributionScore)
    };
  }
}
```

**UI de Contribución:**

```tsx
function ContributionSettings() {
  const [bandwidth, setBandwidth] = useState(100); // MB/day
  const [storage, setStorage] = useState(1); // GB
  
  return (
    <div>
      <h3>Contribuir a la Comunidad de Aulas Sonoras</h3>
      <p>Comparte tus recursos para ayudar a otros oyentes</p>
      
      <label>
        Ancho de banda diario: {bandwidth} MB/día
        <input type="range" min="0" max="1000" value={bandwidth} 
               onChange={(e) => setBandwidth(Number(e.target.value))} />
      </label>
      
      <label>
        Almacenamiento local: {storage} GB
        <input type="range" min="0" max="10" value={storage} 
               onChange={(e) => setStorage(Number(e.target.value))} />
      </label>
      
      <p>Beneficios: {calculateBenefits(bandwidth, storage)}</p>
    </div>
  );
}
```

---

#### **Comparación de Soluciones**

| Solución | Reducción Servidor | Complejidad | Prioridad | Notas |
|----------|-------------------|-------------|-----------|-------|
| **WebRTC P2P** | 70-90% | Alta | 🟠 Alta | Mejor escalabilidad |
| **Hybrid CDN + P2P** | 50-70% | Media | 🟡 Media | Balance óptimo |
| **Service Worker Cache** | 30-50% | Baja | 🔴 Crítica | Fácil de implementar |
| **Memory Limits** | N/A | Baja | 🔴 Crítica | Previene crashes |
| **User Contribution** | Variable | Media | 🟡 Media | Gamificación |

---

#### **Recomendación de Implementación**

**Fase 1 (Inmediata):**
1. ✅ **Service Worker Cache** - Fácil, alto impacto
2. ✅ **Memory Limits en Backend** - Previene saturación

**Fase 2 (Corto plazo):**
3. ✅ **Hybrid CDN + P2P** - Balance entre complejidad y beneficio

**Fase 3 (Largo plazo):**
4. ✅ **WebRTC P2P completo** - Escalabilidad masiva
5. ✅ **User Contribution System** - Gamificación y comunidad

---

#### **Métricas de Éxito (Gestión de Memoria)**

- ✅ Uso de memoria del servidor < 80% del límite
- ✅ 50%+ de requests servidas desde caché (Service Worker)
- ✅ 70%+ de audio distribuido vía P2P (cuando implementado)
- ✅ Cero crashes por OOM (Out of Memory)
- ✅ Latencia de carga < 2 segundos (incluso con P2P)

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
