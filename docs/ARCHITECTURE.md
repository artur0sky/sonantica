# Initial Project Architecture
## Open Source Multimedia Player (Audio-first, Multiplatform)

This document defines the **baseline architecture**, **structural rules**, and **evolution criteria** of the project.

Its objective is to allow for **orderly growth**, **future migration to multiple repositories**, and **technical scalability**, without sacrificing speed in early stages.


The previously defined brand identity is **canonical** and must be used in:
- module names
- code comments
- documentation
- UX copy
- issues, PRs, and releases

---

## 1. Architectural Goals

1. **A single reusable core**
2. **Audio as a first-class citizen**
3. **Web-first, Store-ready**
4. **Strict separation of responsibilities**
5. **Explicit preparation for future extraction to multi-repositories**

---

## 2. Fundamental Principles (Non-negotiable)

1. **Packages don't know apps**
2. **Apps never implement domain logic**
3. **All communication between layers is by contract**
4. **Nothing depends on relative paths between packages**
5. **The core must be able to run without a UI**

---

## 3. Initial Structure of the Monorepo

```text
repo-root/
├─ apps/
│ ├─ web/ # Main PWA
│ ├─ mobile/ # Capacitor (Android / iOS)
│ └─ desktop/ # PWA / WebView2 / Tauri
│
├─ packages/
│ ├─ player-core/ # Playback engine (core)
│ ├─ dsp/ # Audio processing (EQ, filters)
│ ├─ media-library/ # Indexing, metadata, tags
│ ├─ ui/ # Shared components (no logic)
│ └─ shared/ # Types, utils, constants
│
├─ docs/
├─ .agents/
├─ .github/
└─ README.md
## 4. Responsibilities by Layer

### 4.1 player-core
**Responsibilities:**
- Audio playback
- State management
- Buffering
- Codec control
- Playback events

**Prohibited:**
- UI
- Frameworks
- Direct access to platform-specific APIs

### 4.2 dsp
**Responsibilities:**
- Advanced EQ
- Filters
- Gain
- Signal processing

**Must be able to:**
- be enabled or disabled
- function without a UI
- be replaceable

### 4.3 media-library
**Responsibilities:**
- Index files
- Read metadata
- Organize by artist / album / genre / era
- Manage playlists and ratings

### 4.4 ui
**Responsibilities:**
- Components Visuals
- Themes
- Layouts

**Rules:**
- The UI never decides what to play, it only reflects the state.

### 4.5 apps/*
**Responsibility:**
- Wiring
- Navigation
- Platform Integration
- Permissions
- App Store Publishing

## 5. Dependency Rules

### 5.1 Allowed Graph
```text
apps ───▶ packages
packages ───▶ shared
shared ───▶ (nothing)
```

### 5.2 Explicit Prohibitions
- ❌ `packages/*` → `apps/*`
- ❌ Relative imports between packages
- ❌ Domain logic in UI
- ❌ Global singletons shared between layers

## 6. Contracts and APIs
Each package must expose:
- Explicit public API
- Exported interfaces/types
- Documented events
- Minimal README

**Example:**
```ts
export interface PlayerEngine {
  load(source: MediaSource): Promise<void>
  play(): Promise<void>
  pause(): Promise<void>
  stop(): Promise<void>
}
```

## 7. State Management
Internal state encapsulated by package.

**Communication via:**
- events
- observers
- callbacks

**Never** by direct access to internal state.
This is key for migrating to a multi-repo.

## 8. Build and Test Rules
Each package must:
- compile independently
- have its own tests
- not depend on the build of another app

Even if they are initially built together.

## 9. Preparing for Multi-Repo Migration
A package is a candidate for extraction if it:
- Has a stable API
- Does not depend on private code in the repo
- Has minimal documentation
- Has its own tests
- Does not change frequently

**Clear examples:**
- `player-core`
- `dsp`

## 10. Future Migration Strategy
1. Monorepo with strict boundaries
2. Core consolidation
3. Contract stabilization
4. Selective extraction (git subtree / split)
5. Consumption via external dependencies

**Never:**
- all at once
- for aesthetic reasons
- without clear contracts

## 11. Permitted Architectural Evolution
- ✔ Migrate wrappers (Capacitor → native)
- ✔ Add audio plugins
- ✔ Add visualizations
- ✔ Publish the core SDK

- ❌ Break existing contracts
- ❌ Duplicate logic across platforms
- ❌ Introduce unnecessary closed dependencies

## 12. Final Rule of Decision
Before accepting any change:
> Does this change make it easier or harder to separate the core in the future?

If it makes it harder, it must be redesigned.

## 13. Closure
This document defines the minimum solid foundation.
It doesn't aim for rigidity, it aims for direction.

The architecture must evolve,
but never lose its center: the listening experience.

---

## 14. Extension & Customization Architecture (Plugins & Themes)

To satisfy the **User Autonomy** value and **Open Source** nature, the system is designed to be extensible without modifying the core.

### 14.1 Plugin System (The "Workshop" Strategy)
The core must expose strict **Interfaces (Ports)** that plugins (Adapters) implementation.
**Design Pattern:** Dependency Injection + Adapter Pattern.

**Plugin Categories:**
1.  **DSP Plugins:** Audio start/end processing (e.g., VST-like chain, WASM modules).
2.  **Metadata Providers:** External APIs (MusicBrainz, Discogs, Genius) to fetch tags/lyrics.
3.  **UI Widgets:** Custom visualizers or sidebar panels.
4.  **Importers/Exporters:** Playlist formats, library sync.

**Safety:**
- Plugins run in a sandbox where possible (Web Workers).
- They **cannot** directly mutate core state; they must dispatch actions or return transformed data.

### 14.2 Theming Engine ("Acoustic Aesthetics")
The `ui` package must implement a **Token-Based Design System**.
- **Variables:** CSS Custom Properties for all colors, spacing, and typography.
- **Theme Definition:** JSON/TS structure defining the palette and behavior.
- **Hot-swapping:** Capability to switch themes at runtime without reload.
- **Custom CSS:** "Pro" users can inject overrides (User Styles).

### 14.3 External API Gateway
For "detailed/picky" users requiring specific metadata or integration.
- **Architecture:** Hexagonal (Ports & Adapters).
- `IMetadataProvider` interface.
- Implementations for Last.fm, MusicBrainz, Spotify (metadata), etc.
- **Secret Management:** Users provide their own API keys if high-rate limits are needed.

## 15. Code Quality Standards (SOLID & CLEAN)

1.  **S - Single Responsibility:** One module, one reason to change.
2.  **O - Open/Closed:** Open for extension (Plugins), closed for modification (Core).
3.  **L - Liskov Substitution:** Plugin implementations must be interchangeable.
4.  **I - Interface Segregation:** Small, specific contracts for plugins (e.g., `ILyricsProvider`, not `IEverything`).
5.  **D - Dependency Inversion:** Core depends on abstractions, not concrete plugin implementations.

**DRY (Don't Repeat Yourself):**
- Logic exists once in `core`.
- UI components are reusable in `ui`.
- Common utils for plugins in `plugin-kit`.