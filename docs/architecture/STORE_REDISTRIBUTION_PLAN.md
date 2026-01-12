# Architectural Fix: Store Redistribution Plan

## Problem Analysis

### Current Violation
- `@sonantica/shared` contains stores (playerStore, queueStore, libraryStore, uiStore)
- `playerStore` depends on `@sonantica/player-core`
- **VIOLATION**: `shared` → `player-core` breaks the rule: `shared ───▶ (nothing)`

### Root Cause
Stores were incorrectly placed in `shared` package. According to ARCHITECTURE.md:
- **shared**: Types, utils, constants ONLY (no dependencies)
- **player-core**: Audio playback + **State management** (line 63)
- **apps**: Wiring and coordination

---

## Correct Distribution (SOLID + Clean Architecture)

### 1. `packages/shared` - Foundation Layer
**Keep:**
- ✅ Types (`MediaSource`, `PlaybackState`, etc.)
- ✅ Constants (`PLAYER_EVENTS`, etc.)
- ✅ Pure utils (`formatTime`, `clamp`, etc.)

**Remove:**
- ❌ ALL stores
- ❌ playContext utils (depends on stores)

**Dependencies:** NONE

---

### 2. `packages/player-core` - Audio Engine
**Responsibilities:**
- Audio playback engine
- **Player state management** (playerStore)
- Playback events

**Add:**
- ✅ `playerStore.ts` (manages PlayerEngine state)

**Dependencies:**
- `@sonantica/shared` (types, constants only)
- `zustand` (state management)

**Exports:**
```ts
export { PlayerEngine } from './PlayerEngine';
export { usePlayerStore } from './stores/playerStore';
export type { PlayerState } from './stores/playerStore';
```

---

### 3. `packages/media-library` - Library Management
**Responsibilities:**
- File indexing
- Metadata management
- **Library state management** (libraryStore)

**Add:**
- ✅ `libraryStore.ts` (manages library state)

**Dependencies:**
- `@sonantica/shared` (types only)
- `zustand`

**Exports:**
```ts
export { MediaLibrary } from './MediaLibrary';
export { useLibraryStore } from './stores/libraryStore';
export type { LibraryState } from './stores/libraryStore';
```

---

### 4. `packages/audio-analyzer` - Audio Analysis
**Responsibilities:**
- Spectrum analysis
- **Analyzer state management** (analyzerStore)
- Waveform generation

**Add:**
- ✅ `analyzerStore.ts`
- ✅ `waveformStore.ts`

**Dependencies:**
- `@sonantica/shared` (types only)
- `zustand`

---

### 5. `apps/web/src/stores` - Application Coordination
**Responsibilities:**
- UI state (uiStore)
- Queue coordination (queueStore)
- Wiring between packages

**Keep:**
- ✅ `uiStore.ts` (sidebar state, theme, etc.)
- ✅ `queueStore.ts` (coordinates player + library)

**Dependencies:**
- `@sonantica/player-core` (usePlayerStore)
- `@sonantica/media-library` (useLibraryStore)
- `@sonantica/shared` (types)
- `zustand`

---

## Dependency Graph (Correct)

```
┌─────────────────────────────────────────┐
│         apps/web (Wiring)               │
│  - uiStore, queueStore                  │
│  - playContext utils                    │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┬─────────────┐
       ▼                ▼             ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│player-core  │  │media-library │  │audio-analyzer│
│playerStore  │  │libraryStore  │  │analyzerStore │
└──────┬──────┘  └──────┬───────┘  └──────┬───────┘
       │                │                  │
       └────────────────┴──────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │    shared     │
                │ types, utils  │
                │  constants    │
                └───────────────┘
```

---

## Migration Steps

### Step 1: Move playerStore to player-core
1. Move `packages/shared/src/stores/playerStore.ts` → `packages/player-core/src/stores/playerStore.ts`
2. Update exports in `player-core/src/index.ts`
3. Update imports in `apps/web`

### Step 2: Move libraryStore to media-library
1. Move `packages/shared/src/stores/libraryStore.ts` → `packages/media-library/src/stores/libraryStore.ts`
2. Update exports in `media-library/src/index.ts`
3. Update imports in `apps/web`

### Step 3: Move analyzerStore and waveformStore to audio-analyzer
1. Move stores to `packages/audio-analyzer/src/stores/`
2. Update exports
3. Update imports in `apps/web`

### Step 4: Move queueStore and uiStore to apps/web
1. Keep in `apps/web/src/stores/`
2. Update to import from packages instead of shared

### Step 5: Clean up shared package
1. Remove `stores/` directory
2. Remove `utils/playContext.ts` (move to apps/web)
3. Remove `utils/storage.ts` (move to apps/web)
4. Keep only: types, constants, pure utils

### Step 6: Update package.json dependencies
1. `shared`: Remove ALL dependencies except devDependencies
2. `player-core`: Add zustand
3. `media-library`: Add zustand
4. `audio-analyzer`: Add zustand

---

## Benefits

### ✅ SOLID Principles
- **Single Responsibility**: Each package has ONE clear purpose
- **Dependency Inversion**: Apps depend on abstractions (stores), not implementations

### ✅ Clean Architecture
- **Dependency Rule**: Dependencies point inward (toward shared)
- **No circular dependencies**: Each layer is independent

### ✅ DRY
- No duplication of state management
- Each store lives in its domain package

### ✅ Future-Proof
- Each package can be extracted to its own repo
- Clear boundaries enable independent versioning
- Easy to test in isolation

---

## Validation Checklist

After migration:
- [ ] `shared` has ZERO dependencies
- [ ] `player-core` compiles independently
- [ ] `media-library` compiles independently
- [ ] `audio-analyzer` compiles independently
- [ ] `apps/web` compiles with all packages
- [ ] No circular dependencies
- [ ] All tests pass
- [ ] Build succeeds: `pnpm build`

---

## Notes

This reorganization aligns with:
- ARCHITECTURE.md Section 5.1 (Dependency Rules)
- ARCHITECTURE.md Section 4 (Responsibilities by Layer)
- SOLID Principles (Section 15)
- Clean Architecture best practices

**Key Insight:** State management belongs to the domain that owns the data, not in a shared utilities package.
