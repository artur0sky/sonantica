# @sonantica/player-core

> "Audio playback is the core, UI is a consequence."

The professional audio engine at the heart of Sonántica. This package is responsible for the entire lifecycle of sound—from raw bits to the listener's ear.

## 🧠 Philosophy

The Player Core follows the **Non-negotiable Principle**: It must be able to run without a UI. It doesn't know about buttons, sliders, or React. It only knows about signal, state, and intention.

## 📦 Features

- **Platform-Agnostic**: Pure TypeScript core that can be wrapped for Web, Desktop (Electron/Tauri), or Mobile.
- **Contract-Based**: Strictly defined interfaces (`IPlayerEngine`) ensure technical transparency.
- **State Management**: Encapsulated Zustand store for predictable playback state across components.
- **Event-Driven**: Complete observer pattern implementation for time updates, state changes, and errors.
- **Queue Logic**: Integrated queue management with shuffle and repeat support.

## 🛡️ Security & Reliability

The core engine is hardened to ensure continuous, safe playback:
- **Strict Input Validation**: All media sources and URLs are sanitized to prevent injection attacks and type confusion.
- **Resource Protection**: Enforced limits on event listeners and resource allocation to prevent exhaustion (DoS).
- **Error Boundaries**: Comprehensive exception handling ensures the player degrades gracefully rather than crashing.
- **Memory Safety**: Proper cleanup and disposal routines prevent memory leaks during long listening sessions.

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

---

Made with ❤ and **Metalcore**.
