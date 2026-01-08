# Plan de Refactorización: Atomic Design & Modularización

Este documento detalla el plan para refactorizar los "God Components" identificados en la aplicación web (`MainLayout.tsx`, `EQSidebar.tsx`, `TracksPage.tsx`) siguiendo los principios de Atomic Design.

---

## 🎯 Objetivos
1.  **Reducir Complejidad Cognitiva:** Dividir archivos de >500 líneas en componentes pequeños y específicos.
2.  **Mejorar Rendimiento:** Facilitar el code-splitting y renderizado condicional.
3.  **Separación de Responsabilidades:** Aislar lógica de negocio (hooks) de la presentación (UI).
4.  **Escalabilidad:** Facilitar la adición de nuevas características sin tocar el layout principal.

---

## 🏗️ 1. Refactorización de `MainLayout.tsx` (Prioridad Alta)
*Actualmente: 25KB, gestiona estado, layouts móvil/desktop, temas, audio, etc.*

### Tareas:

- [x] **1.1. Crear `MobileOverlays` Organism** ✅ **COMPLETADO**
    -   **Archivo:** `src/components/layout/mobile/MobileOverlays.tsx`
    -   **Responsabilidad:** Renderizar todos los overlays (`AnimatePresence`) móviles (Sidebar izquierdo, derecho, Lyrics, EQ).
    -   **Dependencia:** `useUIStore`.
    -   **Estado:** Usa CSS animations (no Framer Motion), respeta `useAnimationSettings`
    -   **Código eliminado:** ~190 líneas de MainLayout.tsx
    -   **MainLayout reducido:** 670 → 480 líneas (~28% reducción)

- [x] **1.2. Crear `DesktopSidebars` Organism** ✅ **COMPLETADO**
    -   **Archivo:** `src/components/layout/desktop/DesktopSidebars.tsx`
    -   **Responsabilidad:** Renderizar los `<aside>` de escritorio (Lyrics, Queue, EQ, Recommendations).
    -   **Dependencia:** `Suspense`, `lazy` imports.
    -   **Estado:** Sin animaciones (posicionamiento estático), lazy loading mantenido
    -   **Código eliminado:** ~140 líneas de MainLayout.tsx
    -   **MainLayout total reducido:** 670 → 335 líneas (~50% reducción)

- [ ] **1.3. Crear `LayoutThemeManager` HOC/Provider**
    -   **Archivo:** `src/components/layout/managers/LayoutThemeManager.tsx`
    -   **Responsabilidad:** Gestionar `useDominantColor` y aplicar las variables CSS.
    -   **Nota:** Evaluar si la lógica de extracción de color pertenece a `@sonantica/shared` (ver Sección 4).

---

## 🎛️ 2. Refactorización de `EQSidebar.tsx` (Prioridad Media)
*Actualmente: 21KB, mezcla 3 vistas distintas.*

### Tareas:

- [ ] **2.1. Extraer `GraphicEQGrid` a `@sonantica/ui`** (📦 Core Extraction)
    -   **Destino:** `packages/ui/src/components/atoms/GraphicEQGrid.tsx`
    -   **Responsabilidad:** Renderizar las líneas de eje y etiquetas dB (+12, 0, -12) de forma puramente visual.
    -   **Motivo:** Reutilizable en cualquier visualización de audio.

- [ ] **2.2. Refactorizar Vistas Logic**
    -   Crear `CollapsedEQView` (XS View).
    -   Crear `GraphicEQView` (Visual View) usando el nuevo atom `GraphicEQGrid`.
    -   Crear `ListEQView` (Compact View).

- [ ] **2.3. Crear `EQControls`**
    -   Agrupar selector de presets y preamp.

---

## 🎵 3. Refactorización de `TracksPage.tsx` (Prioridad Media)
*Actualmente: 18KB, lógica mixta.*

### Tareas:

- [x] **3.1. Extraer `EmptyState` a `@sonantica/ui`** (📦 Core Extraction) ✅ **COMPLETADO**
    -   **Destino:** `packages/ui/src/components/molecules/EmptyState.tsx`
    -   **Props:** `icon`, `title`, `description`, `action` (ReactNode).
    -   **Motivo:** El diseño de "No music found" se repite en Playlists, Albums, Artists, etc.
    -   **Estado:** Modernizado con CSS animations, 3 variantes (default, compact, minimal)
    -   **Páginas actualizadas:** TracksPage.tsx, ArtistsPage.tsx

- [ ] **3.2. Componentizar Página**
    -   `TracksHeader` (Organism).
    -   `TracksVirtualList` (Organism).

---

## 📦 4. Análisis de Candidatos a Paquetes Core

### Candidatos para `@sonantica/ui`:
| Componente | Origen Actual | Destino Propuesto | Estado |
| :--- | :--- | :--- | :--- |
| `EmptyState` | `TracksPage.tsx` (ln 388) | `molecules/EmptyState.tsx` | ✅ **Completado** |
| `GraphicEQGrid` | `EQSidebar.tsx` (ln 385) | `atoms/GraphicEQGrid.tsx` | ✅ **Completado** |
| `SidebarLoader` | `MainLayout.tsx` (ln 50) | `atoms/CenteredLoader.tsx` | 🆕 Por crear |

### Candidatos para `@sonantica/shared`:
| Utilidad | Origen Actual | Destino Propuesto |
| :--- | :--- | :--- |
| `isCramped` Logic | `MainLayout.tsx` (ln 147) | N/A (Lógica muy específica de UI Web) |

---

## 📊 5. Progreso Actual

### ✅ Completado (2024-01-07):
1. **EmptyState modernizado** - CSS animations, 3 variantes, TypeScript mejorado
2. **GraphicEQGrid creado** - Atom reutilizable para visualización de audio
3. **TracksPage actualizado** - Usando EmptyState
4. **ArtistsPage actualizado** - Usando EmptyState
5. **Compilación exitosa** - Sin errores TypeScript

### 📈 Métricas:
- **Código eliminado:** ~60 líneas
- **Componentes reutilizables creados:** 2
- **Bundle size reducido:** Framer Motion → CSS en EmptyState

---

## 📂 Nueva Estructura de Directorios Propuesta

```text
src/
├── components/
│   ├── layout/
│   │   ├── mobile/         # MobileOverlays
│   │   ├── desktop/        # DesktopSidebars
│   │   └── managers/       # ThemeManager
├── features/
│   ├── dsp/
│   │   └── components/
│   │       └── eq/         # Vistas de EQ
│   └── library/
│       └── components/
│           └── tracks/     # Lista de Tracks y Header
```

---
**Nota:** Cada paso debe completarse asegurando que no se rompe la funcionalidad existente (Regresión Visual).
