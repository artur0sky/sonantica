# @sonantica/media-library

> "Listening is an active act."

The intelligent indexing and management system for Sonántica. This package transforms a collection of files into a curated, searchable, and meaningful library.

## 📖 Responsibility

The Media Library is the "librarian" of Sonántica. It manages:
- **Indexing**: Recursive scanning of directories (Web and Local).
- **Organization**: Grouping tracks by Artist, Album, Genre, and Era.
- **Search**: Fast, multi-criteria filtering.
- **Change Detection**: Efficient incremental scanning to detect new or removed files.
- **Persistence**: Caching library state to ensure instant startup.

## 🧠 Philosophy

Following the **User Autonomy** value, this package provides the tools for users to organize their music exactly how they want it. We recognize that every collection is personal and deserves meticulous order.

## 📦 What's Inside

- **MediaLibrary**: The core class handling the scanning algorithm and data structures.
- **LibraryStore**: A Zustand store for real-time UI synchronization.
- **Contracts**: Explicit interfaces for all library operations.

## 🛡️ Security & Reliability

Indexing user files requires trust and rigorous safety standards:
- **Path Traversal Protection**: Strict validation prevents access to files outside explicitly allowed directories (`../` attacks).
- **Recursion Limits**: Enforced depth limits prevent stack overflow crashes on deeply nested or circular directory structures.
- **ReDoS Prevention**: Search inputs and regex patterns are sanitized to prevent Regular Expression Denial of Service.
- **Resource Limits**: Caps on files per directory and HTML parse sizes ensure stability even with massive libraries.

## 🚀 Usage

```typescript
import { useLibraryStore } from '@sonantica/media-library';

// Start a library scan
const { scan } = useLibraryStore.getState();
await scan(['/my-music/flac/']);

// Access sorted metadata
const artists = useLibraryStore.getState().artists;
```

## 🛠️ Built With

- **@sonantica/metadata**: For deep file inspection.
- **Zustand**: For real-time library state.
- **Fuzzy Search logic**: For instant, responsive filtering.

> "Remembering every vibration."

---

Made with ❤ and **Classical Orchestral**.
