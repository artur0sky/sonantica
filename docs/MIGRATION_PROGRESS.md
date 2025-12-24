# Component Migration Progress

## Status: 🚧 In Progress

---

## Phase 1: Setup ✅ COMPLETED

- [x] Create `packages/ui` structure
- [x] Add `package.json` with dependencies
- [x] Configure TypeScript
- [x] Configure Tailwind CSS
- [x] Add README
- [x] Create utils (cn function)
- [x] Create main index.ts

---

## Phase 2: Move Stores to `packages/shared` 📋 NEXT

### Stores to Move:
- [ ] `playerStore.ts` - Core playback state
- [ ] `queueStore.ts` - Queue management
- [ ] `libraryStore.ts` - Library state
- [ ] `uiStore.ts` - UI preferences
- [ ] `waveformStore.ts` - Waveform data

### Steps:
1. Move store files to `packages/shared/src/stores/`
2. Update imports in `packages/shared/src/index.ts`
3. Update all imports in `apps/web`
4. Test functionality

---

## Phase 3: Move UI Components to `packages/ui` ⏳ PENDING

### Atoms (Priority: HIGH)
- [ ] `Button.tsx`
- [ ] `Badge.tsx`
- [ ] `Input.tsx`
- [ ] `RepeatButton.tsx`
- [ ] `ShuffleButton.tsx`
- [ ] `VolumeSlider.tsx`

### Molecules (Priority: HIGH)
- [ ] `TrackCard.tsx` - Unified track display
- [ ] `TrackRating.tsx` - Rating component
- [ ] `WaveformScrubber.tsx` - Progress bar with waveform
- [ ] `EnhancedVolumeControl.tsx` - Volume control
- [ ] `BackgroundSpectrum.tsx` - Audio visualization
- [ ] `GlobalSearchBar.tsx` - Search component

### Player Components (Priority: CRITICAL)
- [ ] `MiniPlayer.tsx` - Bottom player
- [ ] `ExpandedPlayer.tsx` - Full-screen player

### Steps:
1. Create component directories in `packages/ui/src/components/`
2. Copy components from `apps/web/src/shared/components/`
3. Update imports to use `@sonantica/shared` for stores
4. Export from `packages/ui/src/index.ts`
5. Update imports in `apps/web`
6. Test all components

---

## Phase 4: Move Shared Hooks ⏳ PENDING

### To `packages/ui`:
- [ ] `useClickOutside.ts`
- [ ] `useKeyPress.ts`

### Steps:
1. Move hooks to `packages/ui/src/hooks/`
2. Export from index
3. Update imports in web app

---

## Phase 5: Clean Up `apps/web/src/shared` ⏳ PENDING

### Keep in Web (Platform-specific):
- ✅ `layouts/` - MainLayout, Sidebars, Header
- ✅ `organisms/` - Web-specific complex components
- ✅ Web-specific hooks
- ✅ Web routing utils

### Remove from Web (Moved):
- [ ] All atoms (moved to `packages/ui`)
- [ ] All molecules (moved to `packages/ui`)
- [ ] Player components (moved to `packages/ui`)
- [ ] Stores (moved to `packages/shared`)
- [ ] Shared hooks (moved to `packages/ui`)

---

## Testing Checklist

After each phase:
- [ ] Run `pnpm build` in affected packages
- [ ] Run `pnpm dev` in web app
- [ ] Test all player functionality
- [ ] Test library browsing
- [ ] Test search
- [ ] Test queue management
- [ ] Verify no TypeScript errors
- [ ] Verify no runtime errors

---

## Next Immediate Steps

1. ✅ Install dependencies in `packages/ui`
2. ⏳ Move stores to `packages/shared`
3. ⏳ Move Button component (test migration process)
4. ⏳ Move remaining atoms
5. ⏳ Move molecules
6. ⏳ Move player components

---

## Notes

- Each component migration should be tested individually
- Update imports incrementally to avoid breaking changes
- Keep git commits small and focused
- Document any issues or blockers
