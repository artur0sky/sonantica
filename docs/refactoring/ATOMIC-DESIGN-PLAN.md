# Plan de Refactorización: Atomic Design & Modularización - ACTUALIZADO

Este documento detalla el plan completo para refactorizar los componentes de la aplicación web siguiendo los principios de Atomic Design.

---

## 🎯 Objetivos

1. **Reducir Complejidad Cognitiva:** Dividir archivos de >500 líneas en componentes pequeños y específicos.
2. **Mejorar Rendimiento:** Facilitar el code-splitting y renderizado condicional.
3. **Separación de Responsabilidades:** Aislar lógica de negocio (hooks) de la presentación (UI).
4. **Escalabilidad:** Facilitar la adición de nuevas características sin tocar el layout principal.
5. **Reutilización:** Crear componentes que puedan usarse en múltiples contextos.

---

## ✅ COMPLETADO - Prioridad Alta (100%)

### 🏗️ 1. Refactorización de `MainLayout.tsx`

- [x] **1.1. MobileOverlays Organism** ✅
- [x] **1.2. DesktopSidebars Organism** ✅
- [x] **1.3. LayoutThemeManager** ✅
- **Resultado:** 670 → 307 líneas (54% reducción)

### 📦 2. Core Package Extractions

- [x] **EmptyState** (Molecule) ✅
- [x] **GraphicEQGrid** (Atom) ✅

---

## 🔄 PENDIENTE - Prioridad Alta (Nuevo)

### 🎵 3. Atomización del MiniPlayer

**Problema Identificado:**
- MiniPlayer.tsx tiene 314 líneas con múltiples responsabilidades
- Mezcla lógica de UI, estado, animaciones y gestos
- Usa Framer Motion (debe migrar a CSS animations)
- Componentes internos no reutilizables

**Componentes a Extraer:**

#### **3.1. Crear `TrackInfo` Molecule** ✅ **COMPLETADO**
- **Archivo:** `packages/ui/src/components/molecules/TrackInfo.tsx`
- **Responsabilidad:** Cover art + título + artista
- **Implementación:** 170 líneas
- **Características:**
  - Gestos nativos de swipe (touch + mouse)
  - Sin Framer Motion - solo CSS + eventos nativos
  - Tamaños configurables (sm/md/lg)
  - Indicador de drag opcional
  - Threshold: 80px para detección de swipe
- **Beneficio:** Reutilizable en ExpandedPlayer, NowPlaying

#### **3.2. Crear `PlaybackControls` Molecule** ✅ **COMPLETADO**
- **Archivo:** `packages/ui/src/components/molecules/PlaybackControls.tsx`
- **Responsabilidad:** Botones de reproducción (shuffle, prev, play, next, repeat)
- **Implementación:** 120 líneas
- **Características:**
  - Variantes de tamaño (sm/md/lg)
  - Orientación horizontal/vertical
  - Controles secundarios opcionales
  - Completamente tipado
- **Beneficio:** Reutilizable en ExpandedPlayer, todos los contextos de player

#### **3.3. Crear `SidebarButtonCarousel` Molecule** ✅ **COMPLETADO**
- **Archivo:** `packages/ui/src/components/molecules/SidebarButtonCarousel.tsx`
- **Responsabilidad:** Botones de sidebar con swipe/long-press
- **Implementación:** 228 líneas
- **Características:**
  - Swipe nativo para navegar botones
  - Long-press (600ms) para expandir todos
  - Context menu support
  - Backdrop para cerrar
  - Sin Framer Motion - eventos nativos + CSS
- **Beneficio:** Lógica compleja aislada, reutilizable

#### **3.4. Refactorizar MiniPlayer** 📋 **PENDIENTE**
- Usar los 3 componentes nuevos
- Migrar de Framer Motion a CSS animations
- **Resultado proyectado:** 314 → ~140 líneas (55% reducción)

**Estado:** 3/4 tareas completadas (75%)
**Líneas creadas:** ~518 líneas en componentes reutilizables
**Bundle impact:** +3.3KB (types), -50KB cuando se elimine Framer Motion

---

### 📄 4. Componentes Compartidos de Páginas

#### **3.1. Crear `LibraryPageHeader` Organism** 🆕
**Problema Identificado:**
- ArtistsPage, AlbumsPage, PlaylistsPage, TracksPage tienen headers similares
- Código duplicado: título, subtítulo, acciones (sort, multi-select)
- ~80 líneas duplicadas por página

**Solución:**
- **Archivo:** `src/features/library/components/LibraryPageHeader.tsx`
- **Props:**
  ```ts
  {
    title: string;
    subtitle?: string;
    sortOptions?: SortOption[];
    onSortChange?: (field: string, order: 'asc' | 'desc') => void;
    enableMultiSelect?: boolean;
    selectionType?: 'track' | 'artist' | 'album' | 'playlist';
    customActions?: ReactNode;
  }
  ```
- **Beneficio:** ~320 líneas eliminadas (4 páginas × 80 líneas)

#### **3.2. Crear `VirtualizedGrid` Organism** 🆕
**Problema Identificado:**
- ArtistsPage, AlbumsPage usan grids similares
- Lógica de virtualización repetida
- Alphabet navigation duplicada

**Solución:**
- **Archivo:** `src/features/library/components/VirtualizedGrid.tsx`
- **Props:**
  ```ts
  {
    items: any[];
    renderItem: (item: any, index: number) => ReactNode;
    columns: { sm: number; md: number; lg: number };
    enableAlphabet?: boolean;
    onItemClick?: (item: any) => void;
  }
  ```
- **Beneficio:** ~150 líneas eliminadas

#### **3.3. Crear `VirtualizedList` Organism** 🆕
**Problema Identificado:**
- TracksPage tiene lista virtualizada compleja
- Lógica de selección múltiple mezclada

**Solución:**
- **Archivo:** `src/features/library/components/VirtualizedList.tsx`
- **Separar:** Lógica de virtualización + UI
- **Beneficio:** ~200 líneas más mantenibles

---

## 🎛️ PENDIENTE - Prioridad Media

### 4. Componentes Compartidos de Sidebars

#### **4.1. Crear `SidebarSection` Molecule** 🆕
**Problema Identificado:**
- RecommendationsSidebar tiene 3 secciones (Tracks, Albums, Artists)
- Cada sección tiene header similar con icono + título
- Patrón repetido en otros sidebars

**Solución:**
- **Archivo:** `packages/ui/src/components/molecules/SidebarSection.tsx`
- **Props:**
  ```ts
  {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
  }
  ```
- **Uso:**
  ```tsx
  <SidebarSection title="Suggested Tracks" icon={<IconMusic />}>
    {/* content */}
  </SidebarSection>
  ```
- **Beneficio:** Consistencia visual, ~30 líneas por sidebar

#### **4.2. Crear `RecommendationCard` Molecule** 🆕
**Problema Identificado:**
- RecommendationsSidebar tiene 3 tipos de cards (track, album, artist)
- Código duplicado para hover states, play buttons

**Solución:**
- **Archivo:** `src/features/recommendations/components/RecommendationCard.tsx`
- **Variantes:** `track`, `album`, `artist`
- **Beneficio:** ~100 líneas eliminadas

#### **4.3. Refactorizar `EQSidebar` Views** 
**Problema Identificado:**
- Vista Colapsada (80 líneas)
- Vista Expandida (330 líneas)
- Lógica mezclada con presentación

**Solución:**
- Crear `CollapsedEQView.tsx`
- Crear `ExpandedEQView.tsx`
- Crear `EQControls.tsx` (preset + preamp)
- **Beneficio:** ~400 líneas más organizadas

---

## 📦 5. Nuevos Candidatos a Core Packages

### Para `@sonantica/ui`:

| Componente | Origen | Destino | Prioridad | Estado |
|------------|--------|---------|-----------|--------|
| `LibraryPageHeader` | Páginas de library | `organisms/LibraryPageHeader.tsx` | 🔴 Alta | 🆕 |
| `VirtualizedGrid` | ArtistsPage, AlbumsPage | `organisms/VirtualizedGrid.tsx` | 🔴 Alta | 🆕 |
| `VirtualizedList` | TracksPage | `organisms/VirtualizedList.tsx` | 🔴 Alta | 🆕 |
| `SidebarSection` | Sidebars | `molecules/SidebarSection.tsx` | 🟠 Media | 🆕 |
| `RecommendationCard` | RecommendationsSidebar | `molecules/RecommendationCard.tsx` | 🟡 Baja | 🆕 |
| `CollapsedEQView` | EQSidebar | `organisms/eq/CollapsedEQView.tsx` | 🟠 Media | 📋 |
| `ExpandedEQView` | EQSidebar | `organisms/eq/ExpandedEQView.tsx` | 🟠 Media | 📋 |
| `EQControls` | EQSidebar | `molecules/EQControls.tsx` | 🟠 Media | 📋 |

### Para `@sonantica/shared`:

| Utilidad | Descripción | Prioridad |
|----------|-------------|-----------|
| `useSortable` | Hook para sorting genérico | 🟠 Media |
| `useVirtualScroll` | Hook para virtualización | 🟠 Media |
| `useAlphabetNav` | Hook para navegación alfabética | 🟡 Baja |

---

## 📊 6. Progreso Actualizado

### ✅ Completado (2026-01-07):

#### **Prioridad Alta - MainLayout (100% ✅):**
1. MobileOverlays organism (~190 líneas eliminadas)
2. DesktopSidebars organism (~140 líneas eliminadas)
3. LayoutThemeManager (~30 líneas eliminadas)

#### **Core Packages:**
4. EmptyState modernizado (~80 líneas eliminadas)
5. GraphicEQGrid creado (13 líneas eliminadas)

#### **Integraciones:**
6. TracksPage, ArtistsPage, EQSidebar, MainLayout actualizados

### 📈 Métricas Actuales:

| Métrica | Valor |
|---------|-------|
| **Componentes creados** | 5 |
| **Código eliminado** | ~453 líneas |
| **MainLayout reducido** | 54% |
| **Tareas completadas** | 6 de 17 (35%) |
| **Prioridad Alta completada** | 100% (MainLayout) |

### 🎯 Métricas Proyectadas (Al completar todo):

| Métrica | Valor Proyectado |
|---------|------------------|
| **Componentes totales** | ~13 |
| **Código total eliminado** | ~1,500 líneas |
| **Páginas optimizadas** | 7 |
| **Sidebars optimizados** | 5 |

---

## 📂 7. Nueva Estructura Propuesta

```text
apps/web/src/
├── components/
│   ├── layout/
│   │   ├── mobile/
│   │   │   └── MobileOverlays.tsx              ✅
│   │   ├── desktop/
│   │   │   └── DesktopSidebars.tsx             ✅
│   │   ├── managers/
│   │   │   └── LayoutThemeManager.tsx          ✅
│   │   ├── MainLayout.tsx                      ✅
│   │   ├── EQSidebar.tsx                       🔄 (Pendiente refactor)
│   │   └── ...
│   └── ...
├── features/
│   ├── library/
│   │   ├── components/
│   │   │   ├── LibraryPageHeader.tsx           🆕 Crear
│   │   │   ├── VirtualizedGrid.tsx             🆕 Crear
│   │   │   ├── VirtualizedList.tsx             🆕 Crear
│   │   │   ├── ArtistCard.tsx
│   │   │   └── TrackItem.tsx
│   │   └── pages/
│   │       ├── ArtistsPage.tsx                 🔄 Actualizar
│   │       ├── AlbumsPage.tsx                  🔄 Actualizar
│   │       ├── PlaylistsPage.tsx               🔄 Actualizar
│   │       └── TracksPage.tsx                  🔄 Actualizar
│   ├── recommendations/
│   │   └── components/
│   │       └── RecommendationCard.tsx          🆕 Crear
│   └── dsp/
│       └── components/
│           └── eq/
│               ├── CollapsedEQView.tsx         🆕 Crear
│               ├── ExpandedEQView.tsx          🆕 Crear
│               └── EQControls.tsx              🆕 Crear

packages/ui/src/components/
├── atoms/
│   ├── GraphicEQGrid.tsx                       ✅
│   └── ...
├── molecules/
│   ├── EmptyState.tsx                          ✅
│   ├── SidebarSection.tsx                      🆕 Crear
│   └── ...
└── organisms/
    ├── LibraryPageHeader.tsx                   🆕 Crear
    ├── VirtualizedGrid.tsx                     🆕 Crear
    └── VirtualizedList.tsx                     🆕 Crear
```

---

## � 8. Plan de Ejecución Recomendado

### **Fase 1 - Componentes Compartidos de Páginas** (Prioridad Alta)
1. Crear `LibraryPageHeader` organism
2. Actualizar ArtistsPage, AlbumsPage, PlaylistsPage, TracksPage
3. **Impacto:** ~320 líneas eliminadas, 4 páginas consistentes

### **Fase 2 - Virtualización** (Prioridad Alta)
1. Crear `VirtualizedGrid` organism
2. Crear `VirtualizedList` organism
3. Actualizar páginas correspondientes
4. **Impacto:** ~350 líneas más mantenibles

### **Fase 3 - Componentes de Sidebars** (Prioridad Media)
1. Crear `SidebarSection` molecule
2. Crear `RecommendationCard` molecule
3. Actualizar RecommendationsSidebar
4. **Impacto:** ~130 líneas eliminadas, mejor consistencia

### **Fase 4 - EQSidebar Refactor** (Prioridad Media)
1. Crear `CollapsedEQView`, `ExpandedEQView`, `EQControls`
2. Refactorizar EQSidebar
3. **Impacto:** ~400 líneas más organizadas

---

## 🏆 9. Logros y Beneficios

### **Arquitectura:**
- ✅ Atomic Design aplicado consistentemente
- ✅ Clean Architecture respetada
- ✅ Preparado para multi-repo migration
- 🆕 Componentes compartidos entre páginas
- 🆕 Patrones de diseño reutilizables

### **Performance:**
- ✅ CSS animations (no Framer Motion en nuevos componentes)
- ✅ Lazy loading mantenido
- 🆕 Virtualización optimizada y reutilizable

### **Mantenibilidad:**
- ✅ MainLayout 54% más pequeño
- 🆕 Headers de páginas unificados
- 🆕 Lógica de virtualización centralizada
- 🆕 Sidebars con estructura consistente

### **Reutilización:**
- ✅ 5 componentes creados
- 🆕 13 componentes proyectados
- 🆕 Hooks compartidos para lógica común

---

## 🎨 9. Migración de Framer Motion a CSS Animations 🆕

**Filosofía de Sonántica:**
> "El sistema de animaciones debe ser consistente, performante y respetar la intención del usuario."

### **Objetivo:**
Migrar TODOS los componentes que usan Framer Motion a CSS animations usando el sistema de Sonántica (`useAnimationSettings`).

### **Beneficios:**
- ✅ Mejor performance (INP, FPS)
- ✅ Menor bundle size (~50KB menos)
- ✅ Animaciones más predecibles
- ✅ Respeto a preferencias de usuario (prefers-reduced-motion)
- ✅ Consistencia visual en toda la app

### **Archivos Identificados con Framer Motion:**

#### **Prioridad Crítica (Core UI):**
1. ✅ `MobileOverlays.tsx` - Ya migrado a CSS
2. ❌ `MiniPlayer.tsx` - 314 líneas, usa motion.div, drag gestures
3. ❌ `ExpandedPlayerDesktop.tsx` - Animaciones de expansión
4. ❌ `ExpandedPlayerMobile.tsx` - Animaciones de expansión

#### **Prioridad Alta (Páginas):**
5. ❌ `TracksPage.tsx` - AnimatePresence para listas
6. ❌ `ArtistsPage.tsx` - AnimatePresence para grids
7. ❌ `AlbumsPage.tsx` - AnimatePresence para grids
8. ❌ `PlaylistsPage.tsx` - AnimatePresence para listas
9. ❌ `PlaylistDetailPage.tsx` - Animaciones de entrada
10. ❌ `ArtistDetailPage.tsx` - Animaciones de entrada
11. ❌ `AlbumDetailPage.tsx` - Animaciones de entrada

#### **Prioridad Media (Sidebars):**
12. ❌ `RightSidebar.tsx` - AnimatePresence para queue items
13. ❌ `LyricsSidebar.tsx` - Animaciones de scroll/sync
14. ❌ `EQSidebar.tsx` - AnimatePresence para controles
15. ❌ `RecommendationsSidebar.tsx` - AnimatePresence para cards

#### **Prioridad Media (Componentes):**
16. ❌ `SelectionActionBar.tsx` - Animaciones de entrada
17. ❌ `AddToPlaylistModal.tsx` - Modal animations
18. ❌ `DownloadButton.tsx` - Button animations
19. ❌ `PlaylistStats.tsx` - Stats animations
20. ❌ `NowPlaying.tsx` - Animaciones de track info
21. ❌ `LyricsDisplay.tsx` - Animaciones de scroll

#### **Prioridad Baja (Layout):**
22. ❌ `MainLayout.tsx` - AnimatePresence para player
23. ❌ `LeftSidebar.tsx` - Animaciones de navegación
24. ❌ `Header.tsx` - Animaciones de header
25. ❌ `QueueHistory.tsx` - Animaciones de historial

**Total:** 25 archivos (1 migrado, 24 pendientes)

### **Estrategia de Migración:**

#### **Paso 1: Reemplazos Directos**
```tsx
// ❌ Framer Motion
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>

// ✅ CSS Animations (Sonántica)
<div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
```

#### **Paso 2: AnimatePresence → CSS Transitions**
```tsx
// ❌ Framer Motion
<AnimatePresence mode="popLayout">
  {items.map(item => (
    <motion.div key={item.id} layout exit={{ opacity: 0 }}>
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>

// ✅ CSS Transitions
{items.map(item => (
  <div
    key={item.id}
    className="transition-all duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out"
  >
    {item.content}
  </div>
))}
```

#### **Paso 3: Drag Gestures → Touch/Mouse Events**
```tsx
// ❌ Framer Motion
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(_, info) => {
    if (info.offset.x > 80) handleSwipeRight();
  }}
>

// ✅ Touch Events + CSS
const handleTouchStart = (e) => { /* ... */ };
const handleTouchMove = (e) => { /* ... */ };
const handleTouchEnd = (e) => { /* ... */ };

<div
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  className="touch-pan-x"
  style={{ transform: `translateX(${offset}px)` }}
>
```

#### **Paso 4: Layout Animations → CSS Grid/Flexbox Transitions**
```tsx
// ❌ Framer Motion
<motion.div layout>

// ✅ CSS
<div className="transition-all duration-300">
```

### **Orden de Migración Recomendado:**

**Fase 1 - Core Player (Crítico):**
1. MiniPlayer (con atomización)
2. ExpandedPlayerDesktop
3. ExpandedPlayerMobile

**Fase 2 - Páginas (Alto impacto):**
4. TracksPage, ArtistsPage, AlbumsPage, PlaylistsPage
5. Detail pages (Artist, Album, Playlist)

**Fase 3 - Sidebars (Consistencia):**
6. RightSidebar, LyricsSidebar, EQSidebar
7. RecommendationsSidebar

**Fase 4 - Componentes (Refinamiento):**
8. SelectionActionBar, Modals, Buttons
9. Layout components

### **Métricas Proyectadas:**

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Bundle size** | ~50KB (Framer Motion) | 0KB | -50KB |
| **Archivos migrados** | 1/25 (4%) | 25/25 (100%) | +96% |
| **Performance (INP)** | Variable | Consistente | +30% |
| **Animaciones CSS** | ~10% | 100% | +90% |

---

## 🏆 10. Logros y Beneficios
