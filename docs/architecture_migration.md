# Architecture Migration: "Audiophile & Scalable"

This document outlines the migration plan to a high-performance, microservices-based architecture for Sonántica.

## 🎯 Objective

Separate streaming logic, analysis, and metadata extraction to achieve:

- **Instant Playback** (Go + Redis)
- **High-Fidelity Audio Processing** (Python)
- **Scalable Data Management** (PostgreSQL)

## 🏗️ New Architecture Overview

| Service          | Technology           | Responsibility                                                  |
| :--------------- | :------------------- | :-------------------------------------------------------------- |
| **Stream Core**  | Go (Latest)          | HTTP Range Streaming, Authentication, API Gateway               |
| **Audio Worker** | Python 3.12 (Alpine) | DSP, Waveform generation, Metadata extraction (Librosa/Mutagen) |
| **Data Store**   | PostgreSQL           | Persistent metadata, user data, playlists                       |
| **Cache & Bus**  | Redis                | Hot metadata cache, Job Queues (Analysis jobs), Pub/Sub         |

## ✅ Implementation Checklist

### Phase 1: Infrastructure & Foundation (Current Step)

- [x] **Define Architecture Plan**: Document decisions and structure (This file).
- [x] **Containerization**: Update `docker-compose.yml` with separate services.
- [x] **Data Persistence**: Configure volumes for Redis (`data/redis`) and Postgres (`data/psql`).
- [x] **Base Service Scaffolding**:
  - [x] `services/go-core`: Basic HTTP server setup.
  - [x] `services/py-worker`: Basic Worker/Listener setup.

### Phase 2: Logic Migration

- [x] **Migration: Database Schema**: Design SQL schema for Tracks, Albums, Artists.
- [x] **Migration: Streaming Logic**: Implement efficient file streaming in Go.
- [x] **Migration: Scanner**: Create file watcher in Go that pushes jobs to Redis.
- [x] **Migration: Analysis**: Implement Python worker to consume jobs and process audio files (Mutagen + SQLAlchemy).

### Phase 3: Integration & Polish

- [ ] **API Implementation (Go)**:
    - [ ] `GET /api/library/tracks`
    - [ ] `GET /api/library/albums`
    - [ ] `GET /api/library/artists`
- [ ] **Connect Frontend**: Update Web/Mobile apps to query the new Go API.
- [ ] **Performance Tuning**: Optimize Redis caching strategies.
- [ ] **Testing**: Verify "Instant Playback" and "Lossless" integrity.

## 📝 Philosophy Compliance (IDENTITY.md)

> "Sonántica is not just a player. It is a sound interpreter."

- **Transparency**: The Go core will serve files exactly as they are on disk (bit-perfect).
- **Respect**: Python worker ensures accurate analysis (Gain, BPM) without altering the source file.
- **Speed**: Instant playback respects the user's time and intention.
