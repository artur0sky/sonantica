# Implementation Plan: AI Plugin Architecture (Option C)

## Goal Description
Implement an extensible "Plugin Architecture" for Sonántica where AI capabilities (Stem Separation, Recommendation, Knowledge) are provided by optional, standalone Docker containers. The Core system will discover and utilize these capabilities if available, adhering to the "User Autonomy" and "Intentional Minimalism" principles.

## User Review Required
**IMPORTANT**

**Resource Requirements:** The `sonantica-plugin-demucs` and `sonantica-plugin-brain` containers are resource-intensive (RAM/CPU/GPU). Users on low-end hardware (Raspberry Pi) should utilize the opt-in settings to keep these disabled.

## Proposed Architecture

### 1. The Core Registry (Go-Core)
- **Role:** Manages the lifecycle and discovery of plugins.
- **Mechanism:**
  - Plugins register themselves on startup via a Core internal API or are defined statically in `docker-compose`.
  - Core checks health (`GET /health`) periodically.
  - Core exposes capabilities to the Frontend via `GET /api/v1/system/capabilities`.

### 2. The Plugin Contract (HTTP/REST)
All AI plugins must implement a standard interface:
- `GET /manifest`: Returns identity (e.g., "Demucs Separator"), version, and capability type.
- `POST /jobs`: Accepts a task payload (input file path, parameters). Returns a `job_id`.
- `GET /jobs/{id}`: Returns status (pending, processing, completed, failed) and result.
- `DELETE /jobs/{id}`: Cancels a job.

### 3. Data Flow (Async)
- **Trigger:** User requests "Separate Stems" or "Find Similar" in UI.
- **Dispatch:** API -> Go-Core -> Redis Queue (`ai:jobs:{plugin_type}`).
- **Process:** Plugin Worker monitors queue or receives Webhook -> Processes Audio -> Writes Result to Shared Volume.
- **Completion:** Plugin updates Job Status -> Core detects completion -> Updates DB/UI.

### 4. Database Schema Updates (PostgreSQL)
We need to support Vector Search for the "Brain" plugin.
- **Extension:** Enable `pgvector`.
- **Table:** `track_embeddings`
  - `track_id` (FK)
  - `embedding` (`vector(512)` - dimension depends on model)
  - `model_version` (string)

## Component Implementation

### [A] sonantica-core (Go)
- **[NEW]** `services/go-core/internal/plugins/`
  - **Manager:** Handles registration and health checks.
  - **Client:** Generic HTTP client for communicating with plugins.
- **[MODIFY]** `services/go-core/api/`
  - New endpoints for UI to query available AI features.

### [B] sonantica-plugin-demucs (Python)
- **Base Image:** `python:3.10-slim` + `ffmpeg`.
- **Libs:** `demucs`, `fastapi`, `uvicorn`.
- **Function:**
  - Exposes API.
  - On `POST /jobs/separate`: Runs `demucs -n htdemucs {infile}`.
  - **Output:** 4 stems in `/media/stems/{id}/`.

### [C] sonantica-plugin-brain (Python)
- **Base Image:** `pytorch/pytorch`.
- **Libs:** `torchaudio`, `transformers` (Hugging Face), `pgvector`.
- **Function:**
  - **Embeddings Model:** `laion/clap-htsat-unfused` (Music-Audio-Text).
  - On `POST /jobs/analyze`: Generates embedding -> writes to DB.

### [D] sonantica-plugin-knowledge (Go/Python)
- **Function:** Middleman to Ollama.
- **Logic:**
  - `POST /jobs/enrich`: Takes Artist/Album -> Prompts Ollama ("Tell me about...") -> Returns JSON.

## Verification Plan

### Automated Tests
- **Contract Tests:** Ensure each plugin image responds correctly to `GET /manifest` and `GET /health`.
- **Flow Tests:** Mock the plugin response in Go-Core and verify that the UI receives the "Job Completed" event.

### Manual Verification
1. **Docker Up:** Start with `docker-compose --profile ai up`.
2. **Discovery:** Open **Settings -> AI Plugins**. Verify "Demucs" and "Brain" are listed as "Online".
3. **Separation:**
   - Upload a song.
   - Click "Separate Stems".
   - Monitor logs: `sonantica-plugin-demucs` should show progress.
   - Verify 4 new files appear in the track folder.
4. **Recommendation:**
   - Analyze library (Brain).
   - Go to a track -> "Play Similar".
   - Verify the playlist makes sense sonically.