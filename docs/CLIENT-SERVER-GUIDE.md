# Guía de Implementación: Sonántica Cliente-Servidor

## 🎯 Objetivo

Convertir Sonántica en un sistema **cliente-servidor** similar a Spotify/Jellyfin, donde:

- **Servidor Docker** aloja la música y expone una API REST
- **Clientes** (web/mobile) consumen la API y reproducen desde el servidor
- **Usuario** configura el host para conectarse a su servidor personal

---

## 📐 Arquitectura

```
┌─────────────────────────────────────────────────┐
│                   CLIENTES                       │
├─────────────────────────────────────────────────┤
│  Web (PWA)  │  Mobile (iOS/Android)  │  Desktop │
└────────┬────────────────┬────────────────┬──────┘
         │                │                │
         └────────────────┼────────────────┘
                          │ HTTP/REST
                ┌─────────▼─────────┐
                │   API SERVER      │
                │  (Docker/Node.js) │
                ├───────────────────┤
                │ - /api/library    │ Metadatos
                │ - /api/stream     │ Audio
                │ - /api/scan       │ Indexación
                └─────────┬─────────┘
                          │ File System
                ┌─────────▼─────────┐
                │   /media/         │
                │  (Tu música)      │
                └───────────────────┘
```

---

## 📦 Componentes Creados

### 1. **Backend: `packages/api-server`**

Servidor Node.js + Express que:
- ✅ Escanea `/media/` y extrae metadatos
- ✅ Expone API REST para tracks/artists/albums
- ✅ Sirve audio con soporte de HTTP Range (seeking)
- ✅ Emite eventos en tiempo real (SSE) durante escaneo

**Endpoints principales:**
```
GET  /health                      # Health check
GET  /api/library/tracks          # Lista de tracks
GET  /api/library/artists         # Lista de artistas
GET  /api/library/albums          # Lista de álbumes
GET  /api/stream/:filePath        # Stream de audio
POST /api/scan/start              # Iniciar escaneo
GET  /api/scan/events             # SSE para updates
```

### 2. **Cliente: `RemoteLibraryAdapter`**

Adaptador en `packages/media-library` que:
- ✅ Consume la API del servidor
- ✅ Genera URLs de streaming
- ✅ Suscribe a eventos en tiempo real
- ✅ Prueba conexión al servidor

### 3. **UI: Configuración en Settings**

En `apps/web/src/features/library/pages/SettingsPage.tsx`:
- ✅ Campo para ingresar URL del servidor
- ✅ Botón "Test Connection"
- ✅ Guarda en `localStorage`

### 4. **Docker: `Dockerfile.api` + `docker-compose.yml`**

- ✅ Servicio `api` en puerto 8080
- ✅ Monta `/media/` (tu música)
- ✅ Health checks
- ✅ CORS configurado

---

## 🚀 Pasos de Implementación

### **Fase 1: Instalar Dependencias** ✅ (Completado)

```bash
cd packages/api-server
pnpm install
```

### **Fase 2: Integrar el Adaptador en el Cliente**

Necesitas modificar `apps/web` y `apps/mobile` para:

1. **Detectar si hay un servidor configurado**
2. **Usar `RemoteLibraryAdapter` en lugar del adaptador local**
3. **Cambiar el player para usar URLs remotas**

#### Ejemplo de integración en `apps/web`:

```typescript
// apps/web/src/services/LibraryService.ts
import { RemoteLibraryAdapter } from '@sonantica/media-library';

export function createLibraryAdapter() {
  const serverUrl = localStorage.getItem('sonantica:server-url');
  
  if (serverUrl) {
    // Modo remoto
    return new RemoteLibraryAdapter({ serverUrl });
  } else {
    // Modo local (actual)
    return new LocalLibraryAdapter();
  }
}
```

#### Modificar el Player para usar URLs remotas:

```typescript
// En el componente de reproducción
const adapter = createLibraryAdapter();

if (adapter instanceof RemoteLibraryAdapter) {
  const streamUrl = adapter.getStreamUrl(track);
  audioElement.src = streamUrl; // URL del servidor
} else {
  // Usar File System API (modo local actual)
}
```

### **Fase 3: Construir y Ejecutar el Servidor**

#### Opción A: Desarrollo local

```bash
cd packages/api-server
pnpm dev
```

El servidor estará en `http://localhost:8080`

#### Opción B: Docker (Producción)

```bash
# Construir imagen
docker compose build api

# Ejecutar
docker compose up api

# O todo junto
docker compose up
```

El servidor estará en `http://localhost:8080` (o el puerto configurado en `.env`)

### **Fase 4: Configurar el Cliente**

1. Abre la app web: `http://localhost:3000`
2. Ve a **Settings → General**
3. Ingresa la URL del servidor: `http://localhost:8080` (o tu IP local)
4. Click en **Save**
5. Debería mostrar "✓ Connected successfully"

### **Fase 5: Escanear la Biblioteca**

Desde el cliente:
1. Ve a **Settings → Library**
2. Click en **Scan All**

O desde la API directamente:
```bash
curl -X POST http://localhost:8080/api/scan/start
```

### **Fase 6: Reproducir Música**

Ahora cuando selecciones una canción:
- El cliente pedirá metadatos a `/api/library/tracks`
- El audio se reproducirá desde `/api/stream/:filePath`

---

## 🔧 Configuración Avanzada

### **Acceso desde otros dispositivos (LAN)**

1. Encuentra tu IP local:
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   ```

2. Configura en el cliente:
   ```
   http://192.168.1.100:8080
   ```

3. Asegúrate de que el firewall permita el puerto 8080

### **Acceso desde Internet (WAN)**

1. **Port Forwarding** en tu router:
   - Puerto externo: 8080
   - Puerto interno: 8080
   - IP: Tu servidor

2. **DNS Dinámico** (opcional):
   - Usa servicios como DuckDNS, No-IP
   - Configura: `http://tu-dominio.duckdns.org:8080`

3. **HTTPS** (recomendado):
   - Usa Nginx como reverse proxy
   - Certificado SSL con Let's Encrypt

### **Múltiples Usuarios**

Para implementar autenticación:

1. Agrega JWT en el servidor:
   ```typescript
   // packages/api-server/src/middleware/auth.ts
   import jwt from 'jsonwebtoken';
   
   export function authMiddleware(req, res, next) {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'Unauthorized' });
     
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = decoded;
       next();
     } catch {
       res.status(401).json({ error: 'Invalid token' });
     }
   }
   ```

2. Protege las rutas:
   ```typescript
   app.use('/api/library', authMiddleware, createLibraryRouter(libraryService));
   ```

3. En el cliente, guarda el token:
   ```typescript
   const adapter = new RemoteLibraryAdapter({
     serverUrl: 'http://...',
     apiKey: localStorage.getItem('auth-token')
   });
   ```

---

## 📱 Integración Mobile

En `apps/mobile`, el proceso es idéntico:

```typescript
// apps/mobile/src/services/LibraryService.ts
import { RemoteLibraryAdapter } from '@sonantica/media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function createLibraryAdapter() {
  const serverUrl = await AsyncStorage.getItem('sonantica:server-url');
  
  if (serverUrl) {
    return new RemoteLibraryAdapter({ serverUrl });
  } else {
    return new CapacitorLibraryAdapter(); // Modo local
  }
}
```

---

## 🧪 Testing

### Verificar el servidor

```bash
# Health check
curl http://localhost:8080/health

# Listar tracks
curl http://localhost:8080/api/library/tracks

# Stream de audio
curl http://localhost:8080/api/stream/path/to/song.mp3 --output test.mp3
```

### Verificar eventos en tiempo real

```bash
curl -N http://localhost:8080/api/scan/events
```

---

## 🐛 Troubleshooting

### "Connection failed" en el cliente

1. Verifica que el servidor esté corriendo:
   ```bash
   curl http://localhost:8080/health
   ```

2. Revisa CORS en `.env`:
   ```env
   CORS_ORIGIN=*
   ```

3. Verifica la URL (sin `/` al final):
   ```
   ✅ http://localhost:8080
   ❌ http://localhost:8080/
   ```

### "File not found" al reproducir

1. Verifica que `/media/` esté montado:
   ```bash
   docker exec sonantica-api ls /media
   ```

2. Verifica permisos de lectura

### Audio no se reproduce

1. Verifica que el navegador soporte el codec
2. Abre DevTools → Network → Busca la petición a `/api/stream`
3. Verifica que retorne `206 Partial Content` (no `200 OK`)

---

## 📚 Próximos Pasos

1. ✅ **Implementar integración en `apps/web`**
2. ✅ **Implementar integración en `apps/mobile`**
3. ⏳ **Agregar autenticación (JWT)**
4. ⏳ **Sincronización de playlists**
5. ⏳ **Caché de metadatos en cliente**
6. ⏳ **Transcoding on-the-fly** (para móviles con datos limitados)
7. ⏳ **WebSocket** para control remoto (play/pause desde otro dispositivo)

---

## 🎉 Resultado Final

Con esta implementación, Sonántica funcionará como:

- **Jellyfin**: Servidor auto-hospedado con clientes multiplataforma
- **Spotify**: Experiencia fluida en web/mobile
- **Plex**: Biblioteca centralizada con acceso remoto

**Pero con la filosofía de Sonántica:**
> "User autonomy" - Tu música, tu servidor, tu control.

---

¿Necesitas ayuda con algún paso específico?
