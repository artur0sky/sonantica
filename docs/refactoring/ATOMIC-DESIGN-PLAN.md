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

- [ ] **1.1. Crear `MobileOverlays` Organism**
    -   **Archivo:** `src/components/layout/mobile/MobileOverlays.tsx`
    -   **Responsabilidad:** Renderizar todos los overlays (`AnimatePresence`) móviles (Sidebar izquierdo, derecho, Lyrics, EQ).
    -   **Dependencia:** `useUIStore`.

- [ ] **1.2. Crear `DesktopSidebars` Organism**
    -   **Archivo:** `src/components/layout/desktop/DesktopSidebars.tsx`
    -   **Responsabilidad:** Renderizar los `<aside>` de escritorio (Lyrics, Queue, EQ, Recommendations).
    -   **Dependencia:** `Suspense`, `lazy` imports.

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

- [ ] **3.1. Extraer `EmptyState` a `@sonantica/ui`** (📦 Core Extraction)
    -   **Destino:** `packages/ui/src/components/molecules/EmptyState.tsx`
    -   **Props:** `icon`, `title`, `description`, `action` (ReactNode).
    -   **Motivo:** El diseño de "No music found" se repite en Playlists, Albums, Artists, etc.

- [ ] **3.2. Componentizar Página**
    -   `TracksHeader` (Organism).
    -   `TracksVirtualList` (Organism).

---

## 📦 4. Análisis de Candidatos a Paquetes Core

### Candidatos para `@sonantica/ui`:
| Componente | Origen Actual | Destino Propuesto | Estado |
| :--- | :--- | :--- | :--- |
| `EmptyState` | `TracksPage.tsx` (ln 388) | `molecules/EmptyState.tsx` | 🆕 Por crear |
| `GraphicEQGrid` | `EQSidebar.tsx` (ln 385) | `atoms/GraphicEQGrid.tsx` | 🆕 Por crear |
| `SidebarLoader` | `MainLayout.tsx` (ln 50) | `atoms/CenteredLoader.tsx` | 🆕 Renombrar |

### Candidatos para `@sonantica/shared`:
| Utilidad | Origen Actual | Destino Propuesto |
| :--- | :--- | :--- |
| `isCramped` Logic | `MainLayout.tsx` (ln 147) | N/A (Lógica muy específica de UI Web) |

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
