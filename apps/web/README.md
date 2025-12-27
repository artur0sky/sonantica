# Sonántica Web (PWA)

The flagship interface for the Sonántica ecosystem. A Progressive Web App designed to feel like a high-end audio workspace—clean, professional, and deeply focused on the music.

## 🎨 Intentional Design

Following our **Acoustic Aesthetics** philosophy, the web application avoids visual clutter. It serves as a window into your library, providing:

- **Immersive Playback**: Dual-view player (Mini and Expanded) with real-time audio visualization.
- **Fast Navigation**: Infinite scrolling and instant search across tracks, albums, and artists.
- **Responsive Layout**: Designed for the desktop but ready for the palm of your hand.
- **Technical Transparency**: Direct access to track quality, bitrates, and waveform data.

## 🛠️ Technology Stack

This application is built as a thin layer of orchestration over our core packages:

- **Framework**: `React 19`
- **Build Tool**: `Vite` & `TypeScript`
- **State**: `Zustand` (connected to cross-package stores)
- **Styling**: `Tailwind CSS 4.0` (Acoustic Design System)
- **Animations**: `Framer Motion`
- **Icons**: `Tabler Icons`
- **Routing**: `Wouter` (Minimalist router)

## ⚡ Performance Specifications

The application architecture prioritizes audio integrity and UI responsiveness.

### 1. Rendering Optimization
- **Virtual Scrolling**: TracksPage handles 10k+ items with `<20` active DOM nodes using `@tanstack/react-virtual`.
- **GPU Animations**: All transitions use `transform`/`opacity` only (via `@sonantica/shared`).
- **React Memoization**: Critical components (`TrackCard`, `SpectrumVisualizer`) prevent unnecessary re-renders.

### 2. Memory & Network
- **Lazy Loading**:
  - **Images**: `LazyAlbumArt` with LRU cache (200 items) + blur-up effect.
  - **Code**: `EQSidebar`, `LyricsSidebar`, `RecommendationsSidebar` loaded on-demand.
- **Result**: 30-40% smaller initial bundle, 50% less memory usage.

### 3. Data Persistence
- **IndexedDB Batch Writes**: Library saves are 50-70% faster using single-transaction batching.
- **Progressive Scanning**: UI updates incrementally without freezing.

> "Performance is the invisible feature."

## 🏗️ Structure

```text
src/
├─ components/     # Layout-specific components (Header, Sidebars)
├─ features/       # Domain-driven features (Library, Player)
├─ hooks/          # Application-level hooks
├─ stores/         # UI-specific state
└─ utils/          # Orchestration helpers (PlayContext)
```

## 🚀 Running Locally

From the root directory:

```bash
pnpm dev --filter @sonantica/web
```

## ⚖️ Responsibility

This application **never implements domain logic**. It only:
1.  Wires the UI to `@sonantica/*` packages.
2.  Handles platform-specific integration (Web Media Session API).
3.  Manages layout and navigation state.

> "A window that breathes with the sound."

---

Made with ❤ and **Indie Pop**.
