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

### 📄 3. Componentes Compartidos de Páginas

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

**Última actualización:** 2026-01-07
**Estado:** Prioridad Alta completada, nuevas tareas identificadas
**Próximo paso:** Fase 1 - LibraryPageHeader
