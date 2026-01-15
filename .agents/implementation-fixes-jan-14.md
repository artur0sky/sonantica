# Implementation Plan: UI/UX Fixes - January 14, 2026

## Overview
Comprehensive fixes for UI/UX issues, Tauri stability, and architectural improvements following SOLID, DRY, and Atomic Design principles.

## Issues to Address

### 1. Tauri Playback Interruptions (CRITICAL)
**Problem**: Audio pauses/crashes when navigating to new sections in Tauri desktop app
**Root Cause**: Likely React component unmounting/remounting causing PlayerEngine disruption
**Solution**:
- Ensure PlayerEngine persists across route changes
- Add navigation guards to prevent audio element cleanup
- Implement proper lifecycle management for player state

### 2. Recommendations Sidebar - Cover Arts Not Displaying
**Problem**: Cover art images not showing in recommendations sidebar
**Root Cause**: `RecommendationCard` not properly accessing cover art from track data
**Solution**:
- Fix cover art fallback logic in `RecommendationCard.tsx`
- Ensure proper data flow from recommendations engine
- Add proper image loading states

### 3. Recommendations Sidebar - Hidden Elements
**Problem**: Interface elements appear hidden or not displaying correctly
**Solution**:
- Review CSS z-index and overflow properties
- Fix container dimensions and scrolling
- Ensure proper visibility of all UI elements

### 4. Sidebar Button Carousel Styling
**Problem**: Buttons need consistent styling with miniplayer track item buttons
**Solution**:
- Refactor `SidebarButtonCarousel` to match miniplayer button style
- Remove extra container, show icons only
- Add scrollable/draggable surface with improved hitbox

### 5. Add to Playlist Functionality
**Problem**: "Add to Playlist" buttons not working in miniplayer/expanded player/sidebars
**Solution**:
- Implement proper `AddToPlaylistModal` integration
- Wire up onClick handlers correctly
- Ensure modal state management works across all contexts

### 6. Context Menu Positioning
**Problem**: Context menu appears in awkward positions
**Solution**:
- Improve positioning algorithm to stay within viewport
- Add smart positioning (prefer right/bottom, flip if needed)
- Ensure proper z-index layering

### 7. Page Titles & Metadata
**Problem**: All pages show only "Sonántica" in title
**Solution**:
- Implement dynamic document title updates
- Add proper meta tags per route
- Use React Helmet or similar for SEO

### 8. Library Scan State Persistence
**Problem**: Scan state lost when app closes
**Solution**:
- Persist scan progress to localStorage/IndexedDB
- Restore state on app restart
- Show last scan status and allow resume

### 9. Tab Navigation Scroll Behavior
**Problem**: Tab navigation (Settings, etc.) shows vertical scroll instead of horizontal
**Solution**:
- Fix CSS to prevent Y-axis scroll
- Enable X-axis scroll for tabs
- Fix border clipping issues

### 10. Sidebar Sub-Navigation
**Problem**: No way to access Artists/Albums/Playlists from sidebar
**Solution**:
- Implement tab-based navigation in sidebar
- Allow switching between main list and sub-sections
- Apply consistent tab navigation pattern

### 11. Mobile Responsiveness
**Problem**: Mobile version lacks proper padding and responsive design
**Solution**:
- Add padding to mobile header
- Ensure all pages are responsive
- Test on various screen sizes

## Implementation Order

1. **Phase 1: Critical Fixes** (Tauri stability, cover arts)
2. **Phase 2: UI Consistency** (Button styling, context menu)
3. **Phase 3: Functionality** (Add to playlist, metadata)
4. **Phase 4: Navigation** (Tabs, sidebar sub-nav)
5. **Phase 5: Mobile** (Responsive design, padding)
6. **Phase 6: Persistence** (Scan state, settings)

## Architecture Principles

- **SOLID**: Single responsibility, open/closed, dependency inversion
- **DRY**: Extract common components, avoid duplication
- **Atomic Design**: Atoms → Molecules → Organisms → Templates → Pages
- **Clean Architecture**: Separate concerns, dependency flow inward

## Files to Modify

### Core Player
- `packages/player-core/src/PlayerEngine.ts`
- `packages/player-core/src/stores/playerStore.ts`

### UI Components
- `packages/ui/src/components/molecules/SidebarButtonCarousel.tsx`
- `packages/ui/src/components/molecules/ContextMenu.tsx`
- `apps/web/src/features/recommendations/components/RecommendationCard.tsx`

### Layout & Navigation
- `apps/web/src/components/layout/MainLayout.tsx`
- `apps/web/src/components/layout/Header.tsx`
- `apps/web/src/components/layout/LeftSidebar.tsx`
- `apps/web/src/components/layout/RecommendationsSidebar.tsx`

### Pages
- `apps/web/src/features/settings/pages/SettingsPage.tsx`
- `apps/web/src/features/library/pages/*.tsx`

### Utilities
- `apps/web/src/utils/documentTitle.ts` (NEW)
- `apps/web/src/utils/scanPersistence.ts` (NEW)

## Success Criteria

- ✅ No audio interruptions when navigating in Tauri
- ✅ All cover arts display correctly in recommendations
- ✅ Sidebar buttons match miniplayer style
- ✅ Add to playlist works from all locations
- ✅ Context menu positions intelligently
- ✅ Page titles reflect current view
- ✅ Scan state persists across sessions
- ✅ Tab navigation scrolls horizontally
- ✅ Sidebar has sub-navigation
- ✅ Mobile version is fully responsive
