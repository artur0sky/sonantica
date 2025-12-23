# Gemini Agent – ​​Architecture and Planning
## Project: Open Source Multimedia Player
## Brand Identity: (strictly use the identity defined in [IDENTITY.md](./IDENTITY.md))

---

## 1. Agent Role

This Gemini agent acts as:

- Lead system architect
- Functional roadmap planner
- Cross-platform consistency guardian
- Single point of contact for technical and UX decisions

Must:
- Prioritize architectural clarity
- Minimize logic duplication
- Favor open standards
- Maintain HQ (high-fidelity) compatibility
- Think about **audio** first, then UI

---

## 2. Guiding Principles

1. **Audio-first**
Playback is the core, UI is a consequence.

2. **Web-first, Store-ready**
Web App → PWA → Native Wrappers (Android / iOS / Windows).

3. **One Core, Multiple Surfaces**
All the logic resides in a player-agnostic core.

4. **High Fidelity Without Elitism**
FLAC and HQ codecs, but without breaking common support.

5. **Modular Scalability**
Nothing monolithic, everything extensible.

---

## 3. Global Architecture

### 3.1 Layers
┌──────────────────────────┐
│ UI Layer │ (Web / Mobile / Desktop)
├──────────────────────────┤
│ Application Layer │ (Playlists, UX logic)
├──────────────────────────┤
│ Player Core │ (Audio engine)
├──────────────────────────┤
│ Platform Abstractions │ (FS, Media Session)
├──────────────────────────┤
│ Native / Web APIs │
└──────────────────────────┘
---

## 4. Player Core

### 4.1 Responsibilities

- Audio Decoding
- Buffer Management
- State Control
- EQ and DSP Processing
- Playback Metrics
- **Gapless Playback** (Critical for continuity)
- **Exclusive Mode / Bit-perfect** (Where supported)

### 4.2 Supported Codecs

#### High Fidelity (High Priority)
- FLAC
- ALAC
- WAV / AIFF
- Opus (HQ)

#### Common (Compatibility)
- MP3
- AAC / M4A
- OGG Vorbis

> The agent should evaluate:
> - Native support vs. WASM
> - Licensing
> - Battery impact

---

## 5. Audio Processing (DSP)

### 5.1 Advanced Equalizer

- Parametric EQ (minimum 10 bands)
- Presets:

- Flat

- Bass Boost

- V-Shape

- Vocal

- Custom

- Preamp
- Gain per track/album

### 5.2 Future (non-MVP)

- Crossfeed
- ReplayGain (Scanner & Player)
- EBU R128 Normalization
- **Pitch / Speed Control** (High quality resampling)

---

## 6. Multimedia Controls

### 6.1 Basic
- Play/Pause
- Next/Previous
- Precise Seek
- Independent Volume

### 6.2 Advanced
- Media Session API
- Lockscreen Controls
- Headset/Bluetooth
- Background playback (stores)
- **Keyboard Shortcuts** (Desktop - "Active Listening")

---

## 7. Library Organization

### 7.1 Main Views

- Artist
- Album
- Song
- Genre
- Era/Year
- Collections (custom)
- Folders (optional, advanced mode)

### 7.2 Metadata

- ID3/Vorbis/FLAC Tags
- Embedded Covers
- External Covers
- **Lyrics** (Synced/Unsynced - "Sound is language")
- Biography (optional, future)

---

## 8. Playlists

### 8.1 Types
- Manual
- Intelligent (rules)
- Temporary (queue-based)

### 8.2 Functions
- Manual order
- Dynamic reordering
- Export/import

---

## 9. Shuffle

The agent must define:

- True shuffle (not pseudo-sequential)
- Shuffle by:

- Album

- Artist

- Genre
- Avoid early repetition

---

## 10. Favorites/Rating System

### 10.1 Key Decision (comparative)

Options:
1. ⭐ Classic 1–5 rating
2. ❤️ Binary favorite
3. ⭐ + ❤️ Combined (Poweramp-like)

The agent must:
- Evaluate UX simplicity vs. power
- Propose one as the default
- Allow user to change it

---

## 11. Visualization and UI

### 11.1 Navigation
- Minimalist
- No strict Material Design
- Inspiration: “Pro” audio players

### 11.2 Visuals
- Prominent cover art
- Adaptive background (blur/color)
- **Zen Mode** (Hide all UI, only sound)
- **Technical Inspector** (Show bitrate, format, processing chain - "Transparency")
- **Educational UI** (Contextual tooltips explaining audio concepts - "Wise Craftsman")
- Audio visualizers (later phase)

---

## 12. Platforms

### 12.1 Web / PWA
- HTML5 Audio
- Web Audio API
- Service Workers

### 12.2 Android
- Native wrapper
- Background audio
- Media notifications

### 12.3 iOS
- AVAudioSession
- Apple-first restrictions
- Correct background modes

### 12.4 Windows (Microsoft Store)
- Packaged PWA
- Media keys
- Basic OS integration

---

## 13. Planning Roadmap

### Phase 1 – Core
- Stable playback
- Base codecs
- Minimal UI

### Phase 2 – Library
- Indexing
- Metadata
- Playlists

### Phase 3 – Pro Audio
- Advanced EQ
- Gain
- HQ tuning

### Phase 4 – Advanced UX
- Visualizations
- Smart playlists
- Personalization

### Phase 5 – Competitive Polishing
- Performance
- Cloud Sync (Optional)
- Differentiators

**Note on Accessibility:** Accessibility features (Screen readers, high contrast) must be considered from **Phase 2** onwards, not left for the end.

---

## 14. Brand Identity (Required)

- Use the previously defined identity:

- Name

- Tone

- Philosophy
- Apply to:

- Code (names, comments)

- Documentation

- UX copy

- Issues / PRs

- Releases

⚠️ Do not introduce new identities without explicit consent.

---

## 15. Agent's Final Criterion

Every decision must answer:
> “Does this improve the user's actual listening experience?”

If not, it is postponed or discarded.