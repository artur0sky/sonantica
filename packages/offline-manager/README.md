# @sonantica/offline-manager

> "Music should not end when the connection drops."

The **Offline Manager** is the guardian of local playback in the Sonántica ecosystem. It orchestrates the download, storage, and retrieval of audio content, ensuring that the listener's library is available regardless of network conditions.

This package manages the lifecycle of offline content, from queuing downloads to serving files from the local cache, respecting user bandwidth and storage preferences.

## 📡 Responsibility

- **Queue Management**: Orchestrates download queues, prioritizing individual user requests.
- **Cache Abstraction**: Provides a unified interface for storage, whether via Web Cache API, IndexedDB, or native file systems (Capacitor).
- **Network Awareness**: Handled gracefully, pausing resume downloads based on connectivity (future roadmap).
- **State Persistence**: Tracks download progress, errors, and completion status using `offlineStore`.

## 🧠 Philosophy

> "The cache is a personal library, not just a temporary buffer."

- **Transparency**: The user should explicitly know what is downloaded and what is not.
- **Robustness**: Downloads must be resumable and error-tolerant.
- **Quality Control**: Respects the user's choice for download quality (Original, High, Balanced).

## 📦 What's Inside

- **OfflineManager**: The core class that processes the download queue and coordinates with adapters.
- **WebOfflineAdapter**: Implementation of storage using the standardized **Cache API** for web and PWA contexts.
- **useOfflineStore**: Zustand store for reactive UI updates of download progress and status.
- **OfflineStatus**: A shared contract defining the state of any item (IDLE, QUEUED, DOWNLOADING, COMPLETED, ERROR).

## 🛠️ Usage

```typescript
import { OfflineManager, WebOfflineAdapter } from '@sonantica/offline-manager';
import { useOfflineStore } from '@sonantica/offline-manager';

// 1. Initialize the manager with the appropriate adapter
const adapter = new WebOfflineAdapter();
const manager = new OfflineManager(adapter);

// 2. Queue a track for download
await manager.downloadTrack(trackObject);

// 3. React to changes in the UI
const { items } = useOfflineStore();
const trackStatus = items[track.id]?.status;

if (trackStatus === 'COMPLETED') {
  console.log("Ready for offline playback.");
}
```

## 🏗️ Architecture

The system follows a **Ports & Adapters** (Hexagonal) architecture to allow easy migration to native mobile filesystems in the future.

- **Port (`IOfflineAdapter`)**: Defines how to save, retrieve, and check for file existence.
- **Adapter (`WebOfflineAdapter`)**: Implements strict caching rules, including `RangeRequests` support for audio seeking.
- **Orchestrator (`OfflineManager`)**: Handles the business logic of queueing, deduplication, and retries.

## 🛡️ Security & Integrity

- **Content-Type Validation**: Prevents saving HTML 404 pages as audio files to avoid "corrupted" playback.
- **Stable Hashing**: Uses consistent, URL-safe identifiers to prevent duplicate downloads of the same file from different servers.
- **Range Requests**: Ensures that the cached content behaves like a true streaming source, supporting seeking (206 Partial Content).

> "A downloaded file is a promise of playback."

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Country**.
