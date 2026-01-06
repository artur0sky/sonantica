# Component Reorganization Plan for Multiplatform Support

## Objective: Maximize code reuse across Web, Mobile (Capacitor), and Desktop (Tauri/PWA)

---

## Current Structure Analysis

### `packages/shared` (Core Package)

**Current:** Only basic utilities, types, and constants
**Should contain:** Platform-agnostic business logic and UI primitives

### `apps/web/src/shared` (Web-specific)

**Current:** All UI components, hooks, stores, utils
**Issue:** Not reusable for mobile/desktop apps

---

## Proposed Reorganization Strategy

### 1. **`packages/shared` - Core Shared Package**

**Purpose:** Platform-agnostic code that works everywhere

**Should move here:**

- ✅ **Types & Interfaces** (already there)
- ✅ **Constants** (already there)
- ✅ **Core Utils** (already there)
- ➕ **Business Logic Hooks** (platform-agnostic)
  - `useAudioAnalyzer` (if pure logic)
  - `useMediaSession` (with platform adapters)
- ➕ **State Management** (Zustand stores)
  - `playerStore.ts`
  - `queueStore.ts`
  - `libraryStore.ts`
  - `uiStore.ts`
  - `waveformStore.ts`
- ➕ **Core Utilities**
  - `formatTime`
  - `formatArtists`
  - `playContext` utils
  - Metadata parsers

**Should NOT move here:**

- ❌ UI Components (React-specific, need styling)
- ❌ DOM-specific hooks
- ❌ CSS/Styling

---

### 2. **`packages/ui` - NEW Shared UI Package**

**Purpose:** Reusable UI components for all React-based apps (Web + Mobile with Capacitor)

**Should create and move here:**

- ✅ **Atoms** (basic UI primitives)
  - `Button.tsx`
  - `Badge.tsx`
  - `Input.tsx`
  - `RepeatButton.tsx`
  - `ShuffleButton.tsx`
  - `VolumeSlider.tsx`
- ✅ **Molecules** (composite components)
  - `TrackCard.tsx`
  - `TrackRating.tsx`
  - `WaveformScrubber.tsx`
  - `EnhancedVolumeControl.tsx`
  - `BackgroundSpectrum.tsx`
  - `GlobalSearchBar.tsx`
- ✅ **Player Components** (core player UI)
  - `MiniPlayer.tsx`
  - `ExpandedPlayer.tsx`
- ✅ **Shared Hooks** (UI-related)
  - `useClickOutside.ts`
  - `useKeyPress.ts`

**Dependencies:**

- `framer-motion` (animations)
- `@tabler/icons-react` (icons)
- Tailwind CSS (styling)
- `zustand` (for accessing stores)

---

### 3. **`apps/web/src/shared` - Web-Specific**

**Purpose:** Web-only components and utilities

**Should keep here:**

- ✅ **Layouts** (web-specific navigation)
  - `MainLayout.tsx`
  - `LeftSidebar.tsx`
  - `RightSidebar.tsx`
  - `Header.tsx`
- ✅ **Organisms** (web-specific complex components)
  - Components that use web-specific layouts
- ✅ **Web-specific hooks**
  - DOM manipulation hooks
  - Browser API hooks
- ✅ **Web-specific utils**
  - `cn` (className utility)
  - Web routing helpers

---

### 4. **`apps/mobile` - Future Mobile App**

**Structure:**

```
apps/mobile/
├── src/
│   ├── features/        # Mobile-specific features
│   ├── navigation/      # React Navigation
│   ├── screens/         # Mobile screens
│   └── components/      # Mobile-only components
└── capacitor.config.ts
```

**Will use:**

- `packages/shared` (stores, logic, types)
- `packages/ui` (reusable components)
- Mobile-specific navigation and layouts

---

### 5. **`apps/desktop` - Future Desktop App**

**Structure:**

```
apps/desktop/
├── src/
│   ├── features/        # Desktop-specific features
│   ├── layouts/         # Desktop window layouts
│   └── components/      # Desktop-only components
└── tauri.conf.json
```

**Will use:**

- `packages/shared` (stores, logic, types)
- `packages/ui` (reusable components)
- Desktop-specific window management

---

## Migration Steps

### Phase 1: Create `packages/ui`

1. Create new package structure
2. Set up build configuration (tsup)
3. Configure Tailwind CSS
4. Set up exports

### Phase 2: Move Stores to `packages/shared`

1. Move all Zustand stores
2. Update imports in web app
3. Test functionality

### Phase 3: Move UI Components to `packages/ui`

1. Move atoms (Button, Badge, etc.)
2. Move molecules (TrackCard, WaveformScrubber, etc.)
3. Move player components (MiniPlayer, ExpandedPlayer)
4. Update imports in web app
5. Test all components

### Phase 4: Move Shared Hooks

1. Move platform-agnostic hooks to `packages/shared`
2. Move UI hooks to `packages/ui`
3. Keep web-specific hooks in `apps/web`

### Phase 5: Clean Up `apps/web/src/shared`

1. Remove moved components
2. Keep only web-specific code
3. Update all imports

---

## Benefits

### ✅ Code Reuse

- ~80% of UI components reusable across platforms
- 100% of business logic reusable
- Consistent UX across all platforms

### ✅ Maintainability

- Single source of truth for components
- Fix bugs once, apply everywhere
- Easier to add features

### ✅ Performance

- Shared packages can be optimized once
- Tree-shaking works better
- Smaller bundle sizes

### ✅ Developer Experience

- Clear separation of concerns
- Easy to understand what goes where
- Better TypeScript support

---

## Decision Rules

### Move to `packages/shared` if:

- ✅ No UI rendering
- ✅ Pure business logic
- ✅ Platform-agnostic
- ✅ No DOM dependencies

### Move to `packages/ui` if:

- ✅ React component
- ✅ Reusable across web/mobile
- ✅ Not platform-specific layout
- ✅ Uses Tailwind/Framer Motion

### Keep in `apps/web/src/shared` if:

- ✅ Web-specific layout
- ✅ Uses browser-only APIs
- ✅ Routing-dependent
- ✅ Desktop-specific navigation

---

## Next Steps

1. **Review this plan** with the team
2. **Create `packages/ui`** package
3. **Start migration** with Phase 1
4. **Test thoroughly** after each phase
5. **Document** the new structure

---

## Notes

- This reorganization aligns with the architecture defined in `ARCHITECTURE.md`
- Follows the "One Core, Multiple Surfaces" principle
- Enables future mobile and desktop apps without code duplication
- Maintains the Sonántica brand identity across all platforms
