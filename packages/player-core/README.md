# @sonantica/player-core

> "Audio playback is the core, UI is a consequence."

The professional audio engine at the heart of Sonántica. This package is responsible for the entire lifecycle of sound—from raw bits to the listener's ear.

## 🧠 Philosophy

> "The core must be able to run without a UI."

The Player Core acts as the **subconscious** of Sonántica. It does not know about pixels, interactions, or frameworks. It deals strictly with **Time**, **State**, and **Signal**. It guarantees that the listening experience remains unbroken, regardless of what happens on the surface.

## 📦 Capabilities

- **Platform-Agnostic**: A pure TypeScript kernel adaptable to Web, Desktop (Electron/Tauri), or Mobile scopes.
- **Contract-First Design**: Architecture defined by strict interfaces (`IPlayerEngine`), ensuring modularity and clarity.
- **Encapsulated State**: A predictable state machine (via Zustand) that acts as the single source of truth for playback.
- **Event-Driven Lifecycle**: A robust observer pattern (`on('timeupdate')`, `on('ended')`) that allows the UI to react, not poll.

## 🛡️ Security & Reliability

The core engine is hardened to ensure continuous, safe playback:
- **Strict Input Validation**: All media sources and URLs are sanitized to prevent injection attacks and type confusion.
- **Resource Protection**: Enforced limits on event listeners and resource allocation to prevent exhaustion (DoS).
- **Error Boundaries**: Comprehensive exception handling ensures the player degrades gracefully rather than crashing.
- **Memory Safety**: Proper cleanup and disposal routines prevent memory leaks during long listening sessions.

## ⚡ Performance Specifications

The core engine is engineered for **asynchronous isolation** to ensure audio priority.

### UI-Independent Operation
**Philosophy:** Playback must continue even if the UI freezes.

```typescript
// State updates are decoupled from the render loop
engine.on('timeupdate', (time) => {
  // Low-frequency updates for UI
  throttle(updateUI, 250);
});
```

**Optimizations:**
- **Asynchronous State**: Audio thread (Web Audio) runs independently of main thread.
- **Throttled Events**: High-frequency audio events are throttled for UI consumption.
- **Lazy Metadata**: Metadata extracted only when needed for the active track.

**Impact:**
- Glitch-free audio even during heavy UI rendering.
- Reduced main thread contention.
- Instant response to play/pause controls.

> "The beat waits for no one."

## 🛠️ Usage

```typescript
import { usePlayerStore } from '@sonantica/player-core';

// Within a component or logic block
const { play, pause, loadTrack } = usePlayerStore.getState();

await loadTrack(myMediaSource);
play();
```

## 🏗️ Architecture

- **Clean Architecture**: Decoupled from all external dependencies except `@sonantica/shared` and `@sonantica/metadata`.
- **Zustand**: Used as the internal state orchestrator.
- **HTML5 Audio**: Leverages the browser's native engine for stability while preparing for WASM-based decoding in future phases.

## ⚖️ Responsibility

This package handles:
- Audio decoding and buffering.
- Playback state (IDLE, LOADING, PLAYING, etc.).
- Volume and Mute states.
- Event emission for all playback lifecycle steps.

> "Rhythm is the architecture of time."

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Metalcore**.
