# Sonantica Audio Worker (Python)

> "Understanding content requires deep listening."

The analytical engine of Sonántica. Built with **Python** to leverage its rich ecosystem of audio analysis libraries, this worker meticulously processes every file to extract its essence—metadata, waveforms, and acoustic properties.

## 🧠 Philosophy

## 🧠 Philosophy

The Audio Worker embodies the **Craftsman**. It does not rush. It takes the time necessary to understand the material deeply. Whether extracting intricate tags from a classical piece or generating a waveform for a jazz improvisation, it ensures that the data returned is accurate, complete, and respectful of the source.

## 📦 Features

- **Metadata Extraction**: robust parsing of ID3, Vorbis, FLAC, and MP4 tags using `mutagen`.
- **Database Persistence**: direct SQLAlchemy integration to store Artists, Albums, and Tracks with relational integrity.
- **Job Processing**: Consumes analysis jobs from a Redis queue, ensuring scalable processing of large libraries.
- **Idempotency**: Designed to safely re-process files without creating duplicates or corrupting state.

## 🛡️ Security & Reliability

The worker operates in a secure, isolated environment:
- **Sanitized Input**: File paths from queue are validated against allowed roots.
- **Exception Isolation**: A failure in analyzing one file never crashes the worker daemon.
- **Transaction Safety**: Database updates are atomic; metadata is only committed if all relations using `AudioRepository` are valid.

## ⚡ Performance Specifications

Optimized for throughput and accuracy:
- **Batch Processing**: Capable of handling thousands of files via efficient queue consumption.
- **Connection Pooling**: Reuses database connections to minimize overhead.
- **Resource Management**: explicit cleanup of file handles and resources after each job.

## 🛠️ Usage

This service runs as a background worker via Docker Compose.

```bash
# Start the worker service
docker compose up -d python-worker
```

### Configuration
Configured via environment variables:
- `MEDIA_PATH`: Root directory for media files (read-only access recommended)
- `POSTGRES_URL`: Database connection string
- `REDIS_HOST`: Redis hostname

## 🏗️ Architecture

- **Language**: Python 3.12+
- **ORM**: SQLAlchemy (Declarative mapping)
- **Audio Lib**: Mutagen (Metadata)
- **Queue**: Redis (Blocking pop for efficiency)

## ⚖️ Responsibility

This service handles:
- Reading raw audio files from disk.
- Extracting technical (bitrate, duration) and semantic (artist, title) metadata.
- "Get or Create" logic for Artists and Albums.
- Updating the PostgreSQL database with track information.

> "Details matter. Every tag is a piece of the story."

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Blues**.
