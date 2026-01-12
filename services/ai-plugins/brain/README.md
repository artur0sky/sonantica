# Sonántica AI: The Brain (Similarity)

> "Music is a map of emotions."

**The Brain** is the connective tissue of the Sonántica library. It uses audio embeddings to understand the "acoustic soul" of a track—calculating similarity, mood, and mathematical relationships that go beyond simple metadata.

## 🧠 Philosophy

The Brain acts as the **Profound Interpreter**. It looks past the Artist and Genre tags to find the actual sonic signature of the audio. It believes that two tracks from different eras can share the same spirit. It doesn't impose recommendations; it offers paths through the listener's own landscape.

## 📦 Features

- **Vector Embeddings**: Generates high-dimensional Fingerprints using CLAP (Contrastive Language-Audio Pretraining).
- **Similarity Search**: Enables discovery of "tracks that sound like this" based on actual audio content.
- **Mood Recognition**: Analyzes acoustic properties to categorize the emotional frequency of the library.
- **pgvector Integration**: Stores and queries embeddings directly in the primary PostgreSQL instance for near-instant retrieval.

## 🛡️ Security & Reliability

- **Atomic Analysis**: Each track is processed in isolation; a failure in one audio file does not affect the global map.
- **Embedding Integrity**: Validates vector dimensions and standards to ensure long-term consistency.
- **Read-Only Media Access**: Operates on a read-only view of the media library, ensuring zero risk to source files.

## ⚡ Performance Specifications

- **Throttled Inference**: Designed to run background analysis without impacting real-time audio playback.
- **Efficient Indexing**: Uses HNSW (Hierarchical Navigable Small World) indices for fast similarity queries over millions of tracks.
- **Model Warmup**: Efficiently loads transformer models into memory for batch processing.

## 🏗️ Architecture

- **Language**: Python 3.12+
- **Deep Learning**: `transformers`, `torch`
- **Model**: `laion/clap-htsat-unfused` (or configurable)
- **Database**: PostgreSQL with `pgvector`

## ⚖️ Responsibility

This service handles:
- Generating audio embeddings for new tracks in the library.
- Calculating similarity scores between tracks.
- Managing the vector database population.
- Providing the "Acoustic Insight" seen in the Technical Inspector UI.

> "Finding the invisible thread between two notes."

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Electronic**.
