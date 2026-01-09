# Análisis de Patrones Comunes - Sonántica

Este documento detalla los patrones comunes identificados en páginas y sidebars para guiar la refactorización.

---

## 📄 1. Patrones en Páginas de Library

### **Patrón: Header de Página**

**Páginas que lo usan:**
- `ArtistsPage.tsx`
- `AlbumsPage.tsx`
- `PlaylistsPage.tsx`
- `TracksPage.tsx`

**Estructura común:**
```tsx
<PageHeader
  title="[Entity Type]"
  subtitle="{count} {entity}(s) in library"
  actions={
    <>
      <SortControl {...sortProps} />
      <Button onClick={toggleSelectionMode}>Multi-Select</Button>
      {selectionMode && <Button onClick={selectAll}>Select All</Button>}
    </>
  }
/>
```

**Variaciones:**
- TracksPage: No usa PageHeader (inline)
- Opciones de sort diferentes por tipo
- Botones de acción adicionales (refresh, etc.)

**Propuesta de unificación:**
```tsx
<LibraryPageHeader
  entityType="artists" // 'artists' | 'albums' | 'playlists' | 'tracks'
  count={stats.totalArtists}
  sortOptions={[
    { value: 'name', label: 'Name' },
    { value: 'trackCount', label: 'Track Count' }
  ]}
  onSortChange={(field, order) => { ... }}
  enableMultiSelect
  selectionType="artist"
  customActions={<RefreshButton />}
/>
```

---

### **Patrón: Grid Virtualizado con Alphabet Navigation**

**Páginas que lo usan:**
- `ArtistsPage.tsx` (grid de artistas)
- `AlbumsPage.tsx` (grid de álbumes)

**Estructura común:**
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
  {sortedItems.map((item, index) => (
    <div id={`item-${index}`} key={item.id}>
      <ItemCard item={item} onClick={() => navigate(...)} />
    </div>
  ))}
</div>

<AlphabetNavigator
  items={sortedItems}
  onLetterClick={(index, letter) => scrollToIndex(index)}
/>
```

**Lógica compartida:**
- Sorting por nombre
- Scroll suave a índice
- Navegación alfabética
- Selección múltiple

**Propuesta de unificación:**
```tsx
<VirtualizedGrid
  items={sortedArtists}
  renderItem={(artist, index) => (
    <ArtistCard artist={artist} onClick={() => navigate(`/artists/${artist.id}`)} />
  )}
  columns={{ sm: 2, md: 3, lg: 4, xl: 5 }}
  enableAlphabet
  getItemId={(item) => `artist-${item.id}`}
  getItemName={(item) => item.name}
  onItemClick={(artist) => navigate(`/artists/${artist.id}`)}
  enableSelection={isSelectionMode}
  selectedIds={selectedIds}
  onToggleSelection={toggleSelection}
/>
```

---

### **Patrón: Lista Virtualizada**

**Páginas que lo usan:**
- `TracksPage.tsx` (lista de tracks)

**Características:**
- Virtualización para listas grandes (>100 items)
- Selección múltiple
- Acciones contextuales (play, add to queue, etc.)
- Sticky headers opcionales

**Propuesta:**
```tsx
<VirtualizedList
  items={sortedTracks}
  renderItem={(track) => (
    <TrackItem
      track={track}
      onClick={() => playTrack(track)}
      onContextMenu={(e) => showContextMenu(e, track)}
    />
  )}
  threshold={100} // Activar virtualización si >100 items
  enableSelection={isSelectionMode}
  selectedIds={selectedIds}
  onToggleSelection={toggleSelection}
  estimatedItemHeight={64}
/>
```

---

## 🎛️ 2. Patrones en Sidebars

### **Patrón: Sidebar Container**

**Sidebars que lo usan:**
- `RightSidebar.tsx` (Queue)
- `LyricsSidebar.tsx`
- `EQSidebar.tsx`
- `RecommendationsSidebar.tsx`

**Estructura común:**
```tsx
<SidebarContainer
  title="[Sidebar Name]"
  onClose={toggleSidebar}
  headerActions={<Actions />}
  isCollapsed={isCollapsed}
>
  {/* Content */}
</SidebarContainer>
```

**✅ Ya existe en `@sonantica/ui`**

---

### **Patrón: Sección de Sidebar con Header**

**Sidebars que lo usan:**
- `RecommendationsSidebar.tsx` (3 secciones: Tracks, Albums, Artists)
- Potencialmente otros sidebars futuros

**Estructura común:**
```tsx
<div className="mb-8">
  <h3 className="text-[10px] text-text-muted/70 font-bold mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
    <Icon size={12} /> Section Title
  </h3>
  <div className="space-y-1">
    {/* Section content */}
  </div>
</div>
```

**Propuesta de unificación:**
```tsx
<SidebarSection
  title="Suggested Tracks"
  icon={<IconMusic size={12} />}
  spacing="compact" // 'compact' | 'normal' | 'relaxed'
>
  {trackRecommendations.map(rec => (
    <TrackItem track={rec.item} />
  ))}
</SidebarSection>
```

---

### **Patrón: Cards de Recomendación**

**Usado en:**
- `RecommendationsSidebar.tsx`

**Tipos de cards:**

1. **Track Card:**
```tsx
<TrackItem track={rec.item} onClick={playNext}>
  <ReasonBadge>{rec.reasons[0].description}</ReasonBadge>
</TrackItem>
```

2. **Album Card:**
```tsx
<div className="grid grid-cols-2 gap-3">
  <AlbumCard
    album={rec.item}
    showPlayButton
    showMatchScore={rec.score}
  />
</div>
```

3. **Artist Card:**
```tsx
<ArtistCard
  artist={rec.item}
  showAlbumCount
  showMatchScore={rec.score}
  variant="compact"
/>
```

**Propuesta:**
```tsx
<RecommendationCard
  type="track" // 'track' | 'album' | 'artist'
  item={rec.item}
  score={rec.score}
  reason={rec.reasons[0]?.description}
  onClick={handleClick}
/>
```

---

### **Patrón: Vista Colapsada vs Expandida**

**Usado en:**
- `EQSidebar.tsx`
- Potencialmente `RightSidebar.tsx` (Queue)

**Características:**
- Vista colapsada (~80px): Controles verticales compactos
- Vista expandida (>200px): Controles horizontales completos
- Transición suave entre vistas

**Propuesta:**
```tsx
// EQSidebar.tsx
{isCollapsed ? (
  <CollapsedEQView
    enabled={config.enabled}
    preamp={config.preamp}
    currentPreset={config.currentPreset}
    onEnabledChange={setEnabled}
    onPreampChange={handlePreampChange}
    onPresetChange={handlePresetChange}
    onReset={reset}
  />
) : (
  <ExpandedEQView
    config={config}
    presets={presets}
    onConfigChange={handleConfigChange}
  />
)}
```

---

## 🔧 3. Hooks Compartidos Identificados

### **useSortable**
```tsx
const {
  sortedItems,
  sortField,
  sortOrder,
  setSortField,
  setSortOrder,
  toggleSortOrder
} = useSortable(items, {
  defaultField: 'name',
  defaultOrder: 'asc',
  fields: {
    name: (item) => item.name.toLowerCase(),
    trackCount: (item) => item.trackCount || 0
  }
});
```

**Usado en:**
- ArtistsPage
- AlbumsPage
- PlaylistsPage
- TracksPage

---

### **useVirtualScroll**
```tsx
const {
  visibleItems,
  containerRef,
  scrollToIndex
} = useVirtualScroll(items, {
  itemHeight: 64,
  threshold: 100,
  overscan: 5
});
```

**Usado en:**
- TracksPage (lista de tracks)
- Potencialmente otras listas grandes

---

### **useAlphabetNavigation**
```tsx
const {
  alphabetIndex,
  handleLetterClick
} = useAlphabetNavigation(items, {
  getItemName: (item) => item.name,
  scrollBehavior: 'smooth',
  headerOffset: 120
});
```

**Usado en:**
- ArtistsPage
- AlbumsPage

---

## 📊 4. Resumen de Impacto

### **Componentes a Crear:**

| Componente | Tipo | Páginas/Componentes Afectados | Líneas Eliminadas |
|------------|------|-------------------------------|-------------------|
| LibraryPageHeader | Organism | 4 páginas | ~320 |
| VirtualizedGrid | Organism | 2 páginas | ~150 |
| VirtualizedList | Organism | 1 página | ~200 |
| SidebarSection | Molecule | 1+ sidebars | ~30/sidebar |
| RecommendationCard | Molecule | 1 sidebar | ~100 |
| CollapsedEQView | Organism | 1 sidebar | ~80 |
| ExpandedEQView | Organism | 1 sidebar | ~330 |
| EQControls | Molecule | 1 sidebar | ~50 |

**Total proyectado:** ~1,260 líneas eliminadas/reorganizadas

### **Hooks a Crear:**

| Hook | Páginas Afectadas | Beneficio |
|------|-------------------|-----------|
| useSortable | 4 páginas | Lógica centralizada |
| useVirtualScroll | 1-2 páginas | Performance mejorado |
| useAlphabetNavigation | 2 páginas | Navegación consistente |

---

## 🎯 5. Priorización Recomendada

### **Fase 1 - Máximo Impacto (Prioridad Alta):**
1. ✅ LibraryPageHeader → 4 páginas, 320 líneas
2. ✅ VirtualizedGrid → 2 páginas, 150 líneas
3. ✅ VirtualizedList → 1 página, 200 líneas

**Total Fase 1:** ~670 líneas eliminadas

### **Fase 2 - Consistencia (Prioridad Media):**
1. SidebarSection → Múltiples sidebars
2. RecommendationCard → 1 sidebar, 100 líneas
3. useSortable hook → 4 páginas

**Total Fase 2:** ~200 líneas + lógica centralizada

### **Fase 3 - Refinamiento (Prioridad Baja):**
1. CollapsedEQView + ExpandedEQView + EQControls → 460 líneas
2. useVirtualScroll hook
3. useAlphabetNavigation hook

**Total Fase 3:** ~460 líneas + hooks optimizados

---

**Total General Proyectado:** ~1,330 líneas eliminadas/reorganizadas + 3 hooks reutilizables
