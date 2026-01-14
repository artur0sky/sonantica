# Sonántica AI: Demucs (Separation)

> "Every instrument has its own voice."

The **Demucs Plugin** is the analytical ear of Sonántica. It uses state-of-the-art source separation to decompose a mixed track into its constituent parts—Vocals, Drums, Bass, and Other. It allows the listener to peer behind the curtain of a production.

## 🧠 Philosophy

Following the **Wise Craftsman** archetype, Demucs doesn't destroy; it reveals. It understands that a song is a tapestry of intentions, and sometimes, to appreciate the whole, one must first hear the individual threads. It offers a new dimension of active listening, providing transparency into the recording process.

## 📦 Features

- **High-Fidelity Separation**: Uses Facebook's Demucs (Hybrid Transformer) model for minimal artifacts.
- **Stem Extraction**: Generates dedicated high-quality files for each isolated instrument.
- **GPU Accelerated**: Optimized for CUDA environments to ensure fast processing of full albums.
- **Internal API**: Seamlessly integrates with the `stream-core` to offer "Solo" and "Mute" capabilities in the UI.

## 🛡️ Security & Reliability

- **Resource Capping**: Limits concurrent jobs to prevent system exhaustion (CPU/RAM/VRAM).
- **Persistent Cache**: Uses `sonantica_ai_cache` to store models, avoiding multi-GB downloads on restarts.
- **Graceful Timeouts**: Long-running jobs are monitored and safely terminated if resources are needed elsewhere.

## ⚡ Performance Specifications

- **Torch Optimization**: Leverages FP16 and efficient memory management for transformer inference.
- **Queue Coordination**: Managed via Redis to prevent collisions during heavy library analysis.
- **Deterministic Output**: Ensures consistent results for the same source file.

## 🏗️ Architecture

- **Language**: Python 3.12+ (Torch/CUDA)
- **Model**: Demucs v4 (htdemucs)
- **Framework**: FastAPI
- **Audio Stack**: `torchaudio`, `numpy`, `soundfile`

## ⚖️ Responsibility

This service handles:
- Loading audio files from the shared `/media` volume.
- Running the inference pass to separate sources.
- Writing separated stems to the `/stems` volume.
- Reporting progress and results to the core analytics engine.

> "To understand the symphony, one must hear the flute."

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Classical**.
