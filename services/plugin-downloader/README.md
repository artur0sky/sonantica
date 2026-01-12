# Sonántica Workshop (Downloader)

> "Sound deserves to be found, protected, and listened to."

The **Workshop** is the dedicated procurement engine of Sonántica. It acts as a bridge between nomadic external streams and the user's permanent high-fidelity collection. It doesn't just download; it preserves.

## 🧠 Philosophy

The Workshop embodies the **Hunter-Craftsman**. It understands that the digital landscape is vast and often ephemeral. Its goal is to navigate external sources with precision, retrieve the highest possible quality (FLAC or 320kbps MP3), and deliver it to the library for deep listening. It respects the artist by seeking the original intent of the file.

## 📦 Features

- **External Integration**: Native support for searching and fetching from various providers via standard adapters.
- **Quality Insurance**: Prioritizes lossless formats (FLAC) to maintain the integrity of the sound.
- **Asynchronous Pipeline**: Uses **Celery** and **Redis** to handle background downloads without interrupting the core player.
- **The Workshop API**: A standardized FastAPI interface for triggering new acquisitions from the UI.

## 🛡️ Security & Reliability

Acquiring media requires caution and stability:
- **Sandbox Downloads**: All downloads occur in isolated worker environments.
- **Path Sanitization**: Strict control over where files are written to prevent library pollution.
- **Metadata Reconciliation**: Validates fetched files against standard tags to ensure they match the user's request.

## ⚡ Performance Specifications

- **Concurrent Acquisition**: Configurable worker pools to handle multiple downloads in parallel.
- **Resource Priority**: Throttles downloads during active playback sessions to ensure bandwidth is reserved for the listener.
- **Progressive Delivery**: Real-time status updates via the core's event bus.

## 🏗️ Architecture

- **Language**: Python 3.12+
- **Application**: FastAPI
- **Task Queue**: Celery (Distributed workers)
- **Broker**: Redis
- **Integrations**: `spotipy`, `httpx`, and custom provider adapters.

## ⚖️ Responsibility

This service handles:
- Searching for tracks/albums on external platforms.
- Orchestrating the download of media files.
- Managing the acquisition queue and failure retries.
- Moving completed downloads to the primary `/media` storage.

> "Finding is an art. Preservation is a duty."

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Jazz**.
