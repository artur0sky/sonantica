# Sonantica Go Core (Stream Core)

> "Stability is the foundation of fidelity."

The high-performance backend service of Sonántica. Built with **Go (Golang)** for speed, concurrency, and reliability, it acts as the central nervous system for library management and media streaming.

## 🧠 Philosophy

The Go Core follows the **Single Responsibility Principle**: It serves data and streams audio. It does not render UI, nor does it perform heavy DSP analysis (delegated to workers). It is designed to be the rock-solid foundation that never crashes seamlessly serving your music.

## 📦 Features

- **High-Performance Streaming**: Native Go `http.ServeContent` implementation supporting Range requests for instant seeking and buffering.
- **Library Management**: Fast indexing and retrieval of Tracks, Artists, and Albums backed by PostgreSQL.
- **Scanner Engine**: Efficient directory traversal to discover media files, using Redis for job dispatching to analysis workers.
- **RESTful API**: Clean, strictly typed endpoints for all library interactions.

## 🛡️ Security & Reliability

The core service is hardened for production environments:
- **Input Validation**: All file paths and IDs are validated to prevent directory traversal and injection attacks.
- **Graceful Error Handling**: Requests fail safely with informative error codes, preserving service stability.
- **Containerized**: Runs in an isolated Docker container with minimal privileges (Alpine Linux).

## ⚡ Performance Specifications

Designed for minimal latency and high throughput:
- **Direct Streaming**: Streams files directly from disk with zero-copy optimizations where possible.
- **Concurrent DB Access**: Uses `pgx` with connection pooling for high-concurrency database operations.
- **Asynchronous Scanning**: Scanning operations are non-blocking, dispatched to background workers via Redis.

## 🛠️ Usage

This service is intended to be run via Docker Compose as part of the Sonántica stack.

```bash
# Start the core service
docker compose up -d stream-core
```

### Configuration
Configured via environment variables:
- `PORT`: Service port (default: 8080)
- `MEDIA_PATH`: Root directory for media files
- `POSTGRES_URL`: Database connection string
- `REDIS_HOST`: Redis hostname

## 🏗️ Architecture

- **Language**: Go 1.22+
- **Router**: Chi (lightweight, idiomatic)
- **Database**: PostgreSQL (via `jackc/pgx`)
- **Queue**: Redis (for worker coordination)

## ⚖️ Responsibility

This service handles:
- Serving the `/api/library` endpoints.
- Streaming audio via `/api/stream/{id}`.
- Triggering and monitoring library scans.
- Persistence of library metadata.

> "Data flow is the rhythm of the system."

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Cumbias**.
