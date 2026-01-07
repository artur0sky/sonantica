# Playlist UX Improvements - Implementation Plan

## Objetivo
Mejorar la experiencia de usuario del sistema de playlists siguiendo la filosofía de Sonántica:
- Eliminar elementos nativos del navegador (alert, confirm, prompt)
- Hacer el sistema completamente responsive
- Añadir long-press en expanded player para agregar a playlist
- Implementar estadísticas y gráficos para playlists
- Asegurar persistencia completa en PostgreSQL

---

## ✅ Fase 1: Componentes de Diálogo Personalizados (COMPLETADO)

### Componentes Creados:
1. **ConfirmDialog** (`packages/ui/src/components/molecules/ConfirmDialog.tsx`)
   - Reemplaza `window.confirm()`
   - Variantes: danger, warning, info
   - Animaciones con Framer Motion
   - Cierre con Escape
   - Diseño siguiendo la identidad de Sonántica

2. **PromptDialog** (`packages/ui/src/components/molecules/PromptDialog.tsx`)
   - Reemplaza `window.prompt()`
   - Validación de entrada
   - Límite de caracteres
   - Auto-focus y selección de texto
   - Enter para confirmar, Escape para cancelar

3. **useDialog Hook** (`apps/web/src/hooks/useDialog.ts`)
   - API limpia basada en Promises
   - `showConfirm(title, message, variant): Promise<boolean>`
   - `showPrompt(title, message, defaultValue, placeholder): Promise<string | null>`
   - Gestión de estado centralizada

### Exportaciones:
- Añadidos a `packages/ui/src/index.ts`
- Listos para usar en toda la aplicación

---

## 🚧 Fase 2: Integración de Diálogos en Componentes Existentes

### Componentes a Actualizar:

#### 1. PlaylistsPage (`apps/web/src/features/library/pages/PlaylistsPage.tsx`)
**Cambios necesarios:**
- [ ] Importar `useDialog` hook
- [ ] Reemplazar `prompt()` en "New Playlist" con `showPrompt()`
- [ ] Añadir renderizado de `PromptDialog` en el JSX

**Código actual:**
```typescript
const playlistName = prompt("Enter playlist name:");
```

**Código nuevo:**
```typescript
const { dialogState, showPrompt, handleConfirm, handleCancel } = useDialog();

const handleNewPlaylist = async () => {
  const name = await showPrompt(
    "Create Playlist",
    "Enter a name for your new playlist",
    "",
    "My Playlist"
  );
  if (name) {
    const newPlaylist = await createPlaylist(name, "MANUAL", []);
    trackAccess(newPlaylist.id);
    navigate(`/playlist/${newPlaylist.id}`);
  }
};

// En el JSX:
<PromptDialog
  isOpen={dialogState.isOpen && dialogState.type === 'prompt'}
  onClose={handleCancel}
  onConfirm={handleConfirm}
  title={dialogState.title}
  message={dialogState.message}
  defaultValue={dialogState.defaultValue}
  placeholder={dialogState.placeholder}
/>
```

#### 2. PlaylistDetailPage (`apps/web/src/features/library/pages/PlaylistDetailPage.tsx`)
**Cambios necesarios:**
- [ ] Importar `useDialog` hook
- [ ] Reemplazar `prompt()` en "Rename" con `showPrompt()`
- [ ] Reemplazar `confirm()` en "Delete" con `showConfirm()`
- [ ] Añadir renderizado de ambos diálogos

**Código actual:**
```typescript
const newName = prompt("Enter new name:", playlist.name);
if (confirm(`Delete playlist "${playlist.name}"?`)) {
  await deletePlaylist(playlist.id);
}
```

**Código nuevo:**
```typescript
const { dialogState, showPrompt, showConfirm, handleConfirm, handleCancel } = useDialog();

const handleRename = async () => {
  const newName = await showPrompt(
    "Rename Playlist",
    "Enter a new name for this playlist",
    playlist.name,
    "Playlist name"
  );
  if (newName && newName !== playlist.name) {
    await renamePlaylist(playlist.id, newName);
  }
};

const handleDelete = async () => {
  const confirmed = await showConfirm(
    "Delete Playlist",
    `Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`,
    "danger"
  );
  if (confirmed) {
    await deletePlaylist(playlist.id);
    navigate("/playlists");
  }
};
```

#### 3. RightSidebar (`apps/web/src/components/layout/RightSidebar.tsx`)
**Cambios necesarios:**
- [ ] Reemplazar `prompt()` y `alert()` en "Save Queue as Playlist"

#### 4. RecommendationsSidebar (`apps/web/src/components/layout/RecommendationsSidebar.tsx`)
**Cambios necesarios:**
- [ ] Reemplazar `prompt()` y `alert()` en "Save Recommendations"

#### 5. QueueHistory (`apps/web/src/components/layout/QueueHistory.tsx`)
**Cambios necesarios:**
- [ ] Reemplazar `prompt()` y `alert()` en "Convert to Playlist"

#### 6. SelectionActionBar (`apps/web/src/components/SelectionActionBar.tsx`)
**Cambios necesarios:**
- [ ] Reemplazar `confirm()` y `alert()` en batch delete

---

## 📱 Fase 3: Long Press en Expanded Player

### Objetivo:
Al mantener presionado el cover art en el Expanded Player, abrir el modal `AddToPlaylistModal`.

### Archivos a Modificar:

#### 1. ExpandedPlayer Component
**Ubicación:** Buscar en `apps/web/src/features/player/components/`

**Implementación:**
```typescript
import { useState, useRef } from 'react';
import { AddToPlaylistModal } from '../../../components/AddToPlaylistModal';

export function ExpandedPlayer() {
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const handleLongPressStart = () => {
    longPressTimer.current = window.setTimeout(() => {
      if (currentTrack) {
        setShowPlaylistModal(true);
      }
    }, 500); // 500ms para long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <>
      <div
        onPointerDown={handleLongPressStart}
        onPointerUp={handleLongPressEnd}
        onPointerLeave={handleLongPressEnd}
        className="cover-art-container"
      >
        <CoverArt {...props} />
      </div>

      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        trackIds={currentTrack ? [currentTrack.id] : []}
      />
    </>
  );
}
```

**Tareas:**
- [ ] Localizar el componente ExpandedPlayer
- [ ] Añadir estado para modal
- [ ] Implementar long-press handlers
- [ ] Integrar AddToPlaylistModal
- [ ] Añadir feedback visual durante long-press (opcional: vibración en móvil)

---

## 📊 Fase 4: Multi-Selector Responsive

### Objetivo:
Hacer que el `SelectionActionBar` sea completamente responsive y funcione en todas las vistas.

### Componente Principal:
**SelectionActionBar** (`apps/web/src/components/SelectionActionBar.tsx`)

### Mejoras Necesarias:

#### 1. Layout Responsive
```typescript
// Mobile: Stack vertical, botones más pequeños
// Tablet: Horizontal compacto
// Desktop: Horizontal completo con texto

const isMobile = useMediaQuery("(max-width: 640px)");
const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1023px)");

<motion.div
  className={cn(
    "fixed z-50 bg-surface-elevated border border-border shadow-2xl",
    isMobile 
      ? "bottom-0 left-0 right-0 rounded-t-2xl p-4"
      : "bottom-6 left-1/2 -translate-x-1/2 rounded-2xl px-6 py-4"
  )}
>
  <div className={cn(
    "flex items-center gap-3",
    isMobile ? "flex-col" : "flex-row"
  )}>
    {/* Botones */}
  </div>
</motion.div>
```

#### 2. Botones Adaptativos
```typescript
<Button
  size={isMobile ? "sm" : "md"}
  className={cn(
    isMobile && "w-full justify-start"
  )}
>
  <IconPlaylistAdd size={isMobile ? 16 : 18} />
  {!isMobile && <span className="ml-2">Add to Playlist</span>}
</Button>
```

#### 3. Contador de Selección
```typescript
<div className={cn(
  "flex items-center gap-2",
  isMobile ? "w-full justify-between" : ""
)}>
  <span className="text-sm font-medium">
    {selectedCount} {itemType}(s) selected
  </span>
  <Button
    variant="ghost"
    size="sm"
    onClick={exitSelectionMode}
  >
    <IconX size={16} />
    {!isMobile && <span className="ml-1">Cancel</span>}
  </Button>
</div>
```

**Tareas:**
- [ ] Añadir `useMediaQuery` hook
- [ ] Implementar layouts responsive
- [ ] Ajustar tamaños de botones e iconos
- [ ] Probar en mobile, tablet y desktop
- [ ] Asegurar que funciona en todas las vistas (Artists, Albums, Tracks, Playlists)

---

## 💾 Fase 5: Verificación de Persistencia

### Objetivo:
Asegurar que todas las operaciones de playlist se persisten correctamente en PostgreSQL.

### Verificaciones Necesarias:

#### 1. Backend Go - Endpoints
**Archivo:** `services/go-core/api/playlists.go`

**Verificar:**
- [ ] `POST /api/library/playlists` - Crea playlist y persiste en DB
- [ ] `PUT /api/library/playlists/:id` - Actualiza playlist en DB
- [ ] `DELETE /api/library/playlists/:id` - Elimina playlist de DB
- [ ] Transacciones correctas para trackIds
- [ ] Actualización de `trackCount` y `coverArts`

#### 2. Schema de Base de Datos
**Archivo:** `services/go-core/database/schema_playlists.sql`

**Verificar:**
- [ ] Tabla `playlists` con todos los campos
- [ ] Tabla `playlist_tracks` con relación many-to-many
- [ ] Índices correctos
- [ ] Foreign keys configuradas
- [ ] Triggers para actualizar `updated_at`

#### 3. Pruebas de Integración
**Crear pruebas para:**
- [ ] Crear playlist → Verificar en DB
- [ ] Añadir tracks → Verificar en `playlist_tracks`
- [ ] Renombrar playlist → Verificar actualización
- [ ] Eliminar playlist → Verificar cascade delete
- [ ] Reordenar tracks → Verificar `position` en DB

---

## 📈 Fase 6: Estadísticas y Gráficos para Playlists

### Objetivo:
Añadir sección de estadísticas similar a ArtistPage y AlbumPage.

### Componente a Crear:
**PlaylistStats** (`apps/web/src/features/library/components/PlaylistStats.tsx`)

### Estadísticas a Mostrar:

#### 1. Métricas Básicas
- Total de tracks
- Duración total
- Fecha de creación
- Última modificación
- Último acceso

#### 2. Distribución por Artista
```typescript
interface ArtistDistribution {
  artist: string;
  trackCount: number;
  percentage: number;
}

// Gráfico de barras horizontal
<BarChart
  data={artistDistribution}
  xKey="trackCount"
  yKey="artist"
  title="Top Artists"
/>
```

#### 3. Distribución por Género
```typescript
// Gráfico de dona/pie
<PieChart
  data={genreDistribution}
  title="Genres"
/>
```

#### 4. Distribución por Año
```typescript
// Gráfico de línea temporal
<LineChart
  data={yearDistribution}
  xKey="year"
  yKey="trackCount"
  title="Tracks by Year"
/>
```

#### 5. Calidad de Audio
```typescript
// Distribución de formatos (FLAC, MP3, AAC, etc.)
<BarChart
  data={formatDistribution}
  title="Audio Formats"
/>
```

### Integración en PlaylistDetailPage:
```typescript
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
  <div className="lg:col-span-2">
    {/* Track List */}
  </div>
  <div className="lg:col-span-1">
    <PlaylistStats playlistId={playlist.id} />
  </div>
</div>
```

**Tareas:**
- [ ] Crear componente PlaylistStats
- [ ] Implementar cálculo de estadísticas
- [ ] Crear gráficos con librería de charts (recharts o similar)
- [ ] Integrar en PlaylistDetailPage
- [ ] Hacer responsive

---

## 🎯 Prioridades de Implementación

### Alta Prioridad (Hacer Primero):
1. ✅ Crear componentes de diálogo (ConfirmDialog, PromptDialog)
2. 🚧 Integrar diálogos en componentes existentes
3. 🚧 Long-press en Expanded Player
4. 🚧 Multi-selector responsive

### Media Prioridad:
5. Verificación de persistencia en DB
6. Estadísticas y gráficos para playlists

---

## 📝 Notas de Implementación

### Principios de Sonántica a Seguir:
- **Respeto al usuario:** Confirmaciones claras, sin acciones destructivas sin aviso
- **Transparencia técnica:** Mostrar información relevante (formato, bitrate, etc.)
- **Elegancia minimalista:** Animaciones sutiles, diseño limpio
- **Control del usuario:** Permitir cancelar cualquier acción

### Consideraciones Técnicas:
- Usar Framer Motion para animaciones
- Mantener accesibilidad (keyboard navigation, ARIA labels)
- Probar en diferentes tamaños de pantalla
- Asegurar que funciona offline (PWA)
- Mantener consistencia con el resto de la UI

---

## ✅ Checklist Final

Antes de dar por completada cada fase:
- [ ] Código funciona sin errores
- [ ] Build pasa sin warnings
- [ ] Componentes son responsive
- [ ] Accesibilidad implementada
- [ ] Animaciones son sutiles y funcionales
- [ ] Probado en Chrome, Firefox, Safari
- [ ] Probado en Android (Capacitor)
- [ ] Documentación actualizada
- [ ] Commit con mensaje descriptivo

---

**Última actualización:** 2026-01-07
**Estado:** Fase 1 completada, iniciando Fase 2
