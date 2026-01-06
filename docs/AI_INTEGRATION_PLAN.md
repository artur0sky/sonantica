# AI & Audiophile Features Implementation Plan
## Project: Sonántica "Neural Acoustic"

This document outlines the roadmap to integrate **PyTorch/Demucs** (Source Separation) and **Advanced Metering** into Sonántica.
The goal is to elevate the project from a "Player" to an "Active Listening Station".

---

## 🏗️ Phase 1: "The Inspector" (Real-time Analysis)
**Objective:** Provide immediate, tangible "Audiophile Quality" feedback in the UI using Web Audio API (Client-side).
**Why:** Low latency visualization, builds trust with the user ("Technical Transparency").

- [x] **Architecture**
  - [x] Extend `AudioAnalyzer` in `@sonantica/audio-analyzer`.
  - [x] Create dedicated efficient processors (Worklets if needed) for math-heavy tasks.

- [x] **Metrics Implementation**
  - [x] **Phase Correlation:** Detect mono compatibility issues (-1 to +1).
  - [x] **Stereo Width:** Mid/Side processing to measure width percentage.
  - [x] **Dynamic Range (DR):** Real-time Crest Factor (Peak vs RMS) measurement.
  - [x] **Clipping Detection:** Sample-peak monitoring (> 0dBFS).

- [x] **UI Components**
  - [x] `Goniometer` (Vectorscope) component (Lissajous figures).
  - [x] `CorrelationMeter` bar.
  - [x] `DynamicRangeMeter` (Audiophile-style DR meter).

---

## 🧠 Phase 2: AI Infrastructure (Server-side)
**Objective:** Enable heavy "Offline" processing using Demucs within the dockerized architecture.
**Why:** Separation requires heavy compute; must run in the Python Worker, not the browser.

- [ ] **Environment Setup (`services/python-worker`)**
  - [ ] Update `Dockerfile` to support PyTorch (CPU/CUDA awareness).
  - [ ] Manage Image Size (Torch is heavy).
  - [ ] Install **Demucs** (Hybrid Transformer model).

- [ ] **Task Pipeline**
  - [ ] Create `SeparationTask` in Redis/Worker.
  - [ ] Input: Track ID.
  - [ ] Process: Demucs separation (Vocals, Bass, Drums, Other).
  - [ ] Output: 4x FLAC stems saved to `media/stems/{track_id}/`.
  - [ ] Update Database (`is_separated`, `stem_paths`).

---

## 🎛️ Phase 3: The Stem Engine (Player Core & DSP)
**Objective:** Allow the player to handle multi-stream playback and advanced channel routing.
**Assumption:** Playback of stems requires syncing 4 audio sources or real-time mixing.

- [ ] **Player Core Evolution**
  - [ ] Add `StemPlaybackEngine`: Ability to sync 4 `AudioBuffers` or `MediaElementSources`.
  - [ ] Gapless sync strategies.

- [ ] **Advanced DSP Routing (Spatial Audio)**
  - [ ] **Channel Mixing Matrix:**
    - [ ] **Mono:** L+R -> C.
    - [ ] **Stereo:** Standard.
    - [ ] **2.1:** Stereo + Low Pass Filter to LFE (Subwoofer channel).
  - [ ] **AI-Assisted Upmixing (5.1 / 7.1):**
    - [ ] Use Demucs output to route **Vocals** -> Center Channel.
    - [ ] Route **Drums/Bass** -> L/R + LFE.
    - [ ] Route **Other/Ambience** -> Surrounds (using decorrelation/delay).

---

## 🎹 Phase 4: "The Studio" UX (Final Integration)
**Objective:** Give the user control over the AI results.

- [ ] **Stem Mixer Interface**
  - [ ] 4-Fader View (Vocals, Drums, Bass, Other).
  - [ ] Solo/Mute buttons per stem (Karaoke Mode / Bass Practice Mode).
  - [ ] Export feature: "Download Stems" or "Save Mix".

- [ ] **Smart "Focus" Modes**
  - [ ] One-click "Vocal Remover" (Karaoke).
  - [ ] One-click "Musician Mode" (Boost Bass/Drums, lower Vocals).

---

## 📈 Status Tracking

### Phase 1: Real-time Analysis
- [x] Implement `PhaseCorrelation` logic `packages/audio-analyzer`
- [x] Implement `CrestFactor/DR` logic
- [x] Create `Goniometer` visualizer `packages/ui`

### Phase 2: AI Backend
- [ ] Add PyTorch/Demucs to `python-worker`
- [ ] Implement `source_separation.py` module

### Phase 3: DSP & Spatial
- [ ] Implement `ChannelMatrix` processor
- [ ] Implement Upmixing logic

### Phase 4: UX
- [ ] Build `StemMixer` Sidebar
