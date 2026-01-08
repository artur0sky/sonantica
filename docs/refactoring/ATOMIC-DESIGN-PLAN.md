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
    -   **Beneficio:** Limpia ~200 líneas de `MainLayout`.

- [ ] **1.2. Crear `DesktopSidebars` Organism**
    -   **Archivo:** `src/components/layout/desktop/DesktopSidebars.tsx`
    -   **Responsabilidad:** Renderizar los `<aside>` de escritorio (Lyrics, Queue, EQ, Recommendations).
    -   **Dependencia:** `Suspense`, `lazy` imports.
    -   **Beneficio:** Centraliza la lógica de carga perezosa de módulos pesados.

- [ ] **1.3. Crear `LayoutThemeManager` HOC/Provider**
    -   **Archivo:** `src/components/layout/LayoutThemeManager.tsx`
    -   **Responsabilidad:** Gestionar `useDominantColor` y aplicar las variables CSS (`--dominant-color`, etc.).
    -   **Beneficio:** Saca la lógica de estilos inline del componente layout.

- [ ] **1.4. Simplificar `MainLayout`**
    -   Componer el layout final usando solo estos nuevos organismos.
    -   Debería quedar en <200 líneas.

---

## 🎛️ 2. Refactorización de `EQSidebar.tsx` (Prioridad Media)
*Actualmente: 21KB, mezcla 3 vistas distintas y lógica compleja de sliders.*

### Tareas:

- [ ] **2.1. Crear `CollapsedEQView` Molecule**
    -   **Archivo:** `src/features/dsp/components/eq/CollapsedEQView.tsx`
    -   **Responsabilidad:** Vista ultracompacta (XS) del sidebar.
    -   **Props:** `config`, `handlers`.

- [ ] **2.2. Crear `GraphicEQView` Organism**
    -   **Archivo:** `src/features/dsp/components/eq/GraphicEQView.tsx`
    -   **Responsabilidad:** Vista visual con sliders verticales y grid (la lógica más pesada de renderizado).

- [ ] **2.3. Crear `ListEQView` Molecule**
    -   **Archivo:** `src/features/dsp/components/eq/ListEQView.tsx`
    -   **Responsabilidad:** Vista de lista simple con sliders horizontales.

- [ ] **2.4. Crear `EQControls` Molecule**
    -   **Archivo:** `src/features/dsp/components/eq/EQControls.tsx`
    -   **Responsabilidad:** Sección superior común (Presets, Preamp, Toggle).

---

## 🎵 3. Refactorización de `TracksPage.tsx` (Prioridad Media)
*Actualmente: 18KB, mezcla virtualización con UI.*

### Tareas:

- [ ] **3.1. Crear `TracksHeader` Organism**
    -   **Archivo:** `src/features/library/components/tracks/TracksHeader.tsx`
    -   **Responsabilidad:** Título, contador, dropdown de ordenamiento y botones de acción (Play, Shuffle).

- [ ] **3.2. Crear `TracksVirtualList` Organism**
    -   **Archivo:** `src/features/library/components/tracks/TracksVirtualList.tsx`
    -   **Responsabilidad:** Encapsular toda la lógica de `@tanstack/react-virtual`.

- [ ] **3.3. Crear `EmptyLibraryState` Atom/Molecule**
    -   **Archivo:** `src/features/library/components/states/EmptyLibraryState.tsx`
    -   **Responsabilidad:** UI de estado vacío reutilizable.

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
