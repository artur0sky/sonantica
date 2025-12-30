# @sonantica/api-server

> "The user decides, the software accompanies."

The **Sonántica API Server** is the self-hosted heart of your audio ecosystem. It acts as the bridge between your raw files and the polished listening experience, providing metadata indexing, reliable streaming, and library management without relying on third-party cloud services.

Designed for **autonomy**, it allows you to own your data while enjoying a modern streaming experience across all your devices.

## 📡 Responsibility

- **Library Indexing**: Recursively scans directories to build a rich metadata catalog (Artists, Albums, Genres).
- **Audio Streaming**: Serves high-fidelity audio via HTTP Range Requests, enabling seeking and smooth playback.
- **Real-time Sync**: Pushes library updates to connected clients via Server-Sent Events (SSE).
- **Metadata Extraction**: Parses ID3, Vorbis, and FLAC tags to populate the library database.

## 🧠 Philosophy

> "Technically transparent, intentionally minimal."

- **Stateless**: The server is designed to be lightweight; the "truth" is in your file tags.
- **Read-Only by Default**: Resects your files. It indexes them, but avoids modifying them unless explicitly requested.
- **Standard Protocol**: Uses standard HTTP/REST patterns, making it compatible with any future client.

## 📦 What's Inside

- **LibraryController**: REST endpoints for querying tracks, albums, and artists.
- **StreamController**: High-performance file streaming handler with support for partial content (206).
- **ScanService**: Intelligent background worker that traverses file systems and extracts metadata.
- **EventSystem**: SSE implementation for broadcasting scan progress and library changes.

## 🛠️ Usage

### Running Locally

```bash
# Start the development server
pnpm dev

# Build and start for production
pnpm build
pnpm start
```

### Environment Configuration

```env
PORT=8080
MEDIA_ROOT=./media           # Path to your music library
CORS_ORIGIN=http://localhost:3000
SCAN_CONCURRENCY=4          # Number of files to process in parallel
```

## 🏗️ Architecture

The API Server follows a **Clean Architecture** approach:

```
src/
├── controllers/    # Request handlers (HTTP layer)
├── services/       # Business logic (Scanning, Streaming)
├── models/         # Data structures and types
└── utils/          # Shared utilities (FileSystem, Logging)
```

It is designed to be deployed as a microservice, either standalone or within a Docker container, seamlessly integrating with the Sonántica Monorepo.

## 🛡️ Security & Performance

- **Path Traversal Protection**: Rigorous checks to ensure requests cannot access files outside the `MEDIA_ROOT`.
- **Stream Optimization**: Optimized piping of file streams to minimize memory footprint.
- **Rate Limiting**: (Planned) To protect against abuse in public deployments.

> "Your music, served your way."

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Psytrance**.
