# PERFORMANCE-PLAN.md: Performance Optimization Plan

This document outlines the strategy and tasks for improving the performance of the Sonántica monorepo using code-splitting and dynamic `import()` where appropriate.

## 1. Applications: Web (`apps/web`)

### 1.1 Settings Page Optimization

- [x] **Lazy Load Sub-sections**: Convert `AudioSettings`, `LibrarySettings`, `InterfaceSettings`, `OfflineSettings`, `AnalyticsSettings`, and `ServersSection` to `React.lazy()`.
- [x] **Suspense Boundaries**: Wrap individual tab contents in `Suspense` with a custom `SettingsLoader` fallback.
- [x] **Icon Cleanup**: Ensure icons from `@sonantica/ui` (or `@tabler/icons-react`) are correctly imported for per-icon bundling.

### 1.2 Analytics Dashboard

- [x] **Heavy Charts**: Lazy load the visualization components from `@nivo/*` (Line, Bar, Pie, Heatmap, Calendar).
- [x] **Component Splitting**: Refactor `@sonantica/ui` to export charts individually to avoid bundling all of `@nivo` in a single chunk.
- [x] **Data Processing**: Ensure data processing for charts remains efficient and doesn't block the main thread before the lazy component is ready.

### 1.3 Contextual Components

- [x] **Metadata Panel**: Defer loading the detailed metadata inspector in `MainLayout` until it's actually shown.
- [x] **Add to Playlist Modal**: Lazy load the modal in `TrackItem` to avoid bundling its logic with every track in long lists.
- [x] **Expanded Player**: Lazy load the expanded player view in `MainLayout`.
- [x] **Sidebars**: Lazy load `LeftSidebar`, `RightSidebar` (Queue), `LyricsSidebar`, `EQSidebar`, and `RecommendationsSidebar` in both Desktop and Mobile layouts.

### 1.4 Heavy Features

- [x] **Lyrics Engine**: Lazy load the lyrics processing logic and UI (Sidebars/Overlays) when requested.
- [x] **EQ Panels**: Ensure complex EQ visualizations in `EQSidebar` are loaded on demand via `lazy()`.

## 2. Applications: Mobile (`apps/mobile`)

### 2.1 Capacitor Optimization

- [x] **Native Bridge Modules**: Group and lazy-load modules that interact with Capacitor plugins (Filesystem, Notifications, etc.) using dynamic `import()` in `capacitor-hooks.ts`.
- [x] **Mobile-Specific Overlays**: Use `lazy()` and `Suspense` for all overlay sidebars in `MobileOverlays.tsx`.

## 3. Packages (`packages/*`)

### 3.1 UI Package (`@sonantica/ui`)

- [x] **Organisms**: Refactor `AnalyticsCharts.tsx` into individual files to allow for granular bundling of `@nivo` dependencies.
- [x] **Icons**: Verify that `@tabler/icons-react` usage allows for per-icon bundling.

### 3.2 DSP Package (`@sonantica/dsp`)

- [x] **Specific Processors**: `VocalProcessor` is now loaded only when enabled (via dynamic `import()` in `DSPEngine.ts`).

### 3.3 Metadata Package (`@sonantica/metadata`)

- [x] **Format-Specific Parsers**: Lazy load `ID3v2Parser` and `FLACParser` in `MetadataExtractor.ts` to reduce bundle size for the initial metadata extraction logic.

## 4. Infrastructure (Docker)

### 4.1 Resource Optimization & Hardware Alignment

- [x] **Database Constraints**: Limited `postgres` and `redis` to 1.0 CPU and 512M RAM to protect host resources.
- [x] **AI Workload Balancing**: Refined resource limits for `demucs` (2 CPU / 3G RAM) and `brain` (2 CPU / 2G RAM) to allow concurrent execution without OS instability.
- [x] **GPU Reservation**: Explicitly configured NVIDIA GPU passthrough reservations for AI plugins.
- [x] **Profile-based Deployment**: Implemented Docker profiles (`ai`) to prevent heavy services from starting on low-end hardware by default.

---

*Status updated as of January 2026.*
