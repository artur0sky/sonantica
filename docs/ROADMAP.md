# Sonantica – Roadmap & Implementation Tracking
## Project: Open Source Multimedia Player
## Brand Identity: (strictly use the identity defined in [IDENTITY.md](./IDENTITY.md))

---

## 📖 How to Read This Roadmap

### Status Indicators
- ✅ **Done** - Feature is fully implemented and tested
- 🚧 **In Progress** - Currently being developed
- 📋 **Planned** - Scheduled for development
- ⏸️ **On Hold** - Postponed or blocked
- ❌ **Cancelled** - No longer planned

### Priority Levels
- 🔴 **Critical** - Essential for MVP, blocks other features
- 🟠 **High** - Important for core functionality
- 🟡 **Medium** - Valuable enhancement
- ⚪ **Low** - Nice to have, future consideration

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

5. **Modular Scalability (SOLID/Clean)**
   Nothing monolithic, everything extensible. Core is closed for modification, open for extension.

6. **User Autonomy (The "Picky" User)**
   Support for granular control, custom themes, and external API connectors.

---

## 3. Global Architecture

### 3.1 Layers

| Layer | Responsibilities | Status | Priority |
| :--- | :--- | :---: | :---: |
| **UI Layer** | Web / Mobile / Desktop | 📋 | 🔴 |
| **Application Layer** | Playlists, UX logic | 📋 | 🔴 |
| **Player Core** | Audio engine | 📋 | 🔴 |
| **Platform Abstractions** | FS, Media Session | 📋 | 🟠 |
| **Native / Web APIs** | Browser / OS Primitives | 📋 | 🟠 |

---

## 4. Player Core

### 4.1 Responsibilities

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Audio Decoding | 📋 | 🔴 | Foundation for all playback |
| Buffer Management | 📋 | 🔴 | Critical for smooth playback |
| State Control | 📋 | 🔴 | Play/Pause/Stop/Seek |
| EQ and DSP Processing | 📋 | 🟠 | Phase 3 feature |
| Playback Metrics | 📋 | 🟡 | Analytics and monitoring |
| **Gapless Playback** | 📋 | 🟠 | Critical for continuity |
| **Exclusive Mode / Bit-perfect** | 📋 | 🟡 | Where supported |

### 4.2 Supported Codecs

#### High Fidelity (High Priority)

| Codec | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| FLAC | 📋 | 🔴 | Primary HQ format |
| ALAC | 📋 | 🟠 | Apple ecosystem |
| WAV / AIFF | 📋 | 🟠 | Uncompressed |
| Opus (HQ) | 📋 | 🟡 | Modern codec |

#### Common (Compatibility)

| Codec | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| MP3 | 📋 | 🔴 | Universal compatibility |
| AAC / M4A | 📋 | 🔴 | Modern standard |
| OGG Vorbis | 📋 | 🟡 | Open format |

> **Evaluation Criteria:**
> - Native support vs. WASM
> - Licensing implications
> - Battery impact on mobile

---

## 5. Audio Processing (DSP)

### 5.1 Advanced Equalizer

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Parametric EQ (10+ bands) | 📋 | 🟠 | Phase 3 |
| Preset: Flat | 📋 | 🟠 | Default |
| Preset: Bass Boost | 📋 | 🟡 | Popular preset |
| Preset: V-Shape | 📋 | 🟡 | Popular preset |
| Preset: Vocal | 📋 | 🟡 | Specialized |
| Custom Presets | 📋 | 🟡 | User-defined |
| Preamp | 📋 | 🟡 | Volume normalization |
| Gain per track/album | 📋 | 🟡 | Advanced feature |

### 5.2 Future (non-MVP)

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Crossfeed | 📋 | ⚪ | Headphone enhancement |
| ReplayGain (Scanner & Player) | 📋 | 🟡 | Volume normalization |
| EBU R128 Normalization | 📋 | ⚪ | Professional standard |
| **Pitch / Speed Control** | 📋 | 🟡 | HQ resampling required |

---

## 6. Multimedia Controls

### 6.1 Basic Controls

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Play/Pause | 📋 | 🔴 | Core functionality |
| Next/Previous | 📋 | 🔴 | Core functionality |
| Precise Seek | 📋 | 🔴 | Timeline navigation |
| Independent Volume | 📋 | 🔴 | Volume control |

### 6.2 Advanced Controls

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Media Session API | 📋 | 🟠 | OS integration |
| Lockscreen Controls | 📋 | 🟠 | Mobile essential |
| Headset/Bluetooth | 📋 | 🟠 | Hardware integration |
| Background playback | 📋 | 🟠 | Mobile stores requirement |
| **Keyboard Shortcuts** | 📋 | 🟡 | Desktop "Active Listening" |

---

## 7. Library Organization

### 7.1 Main Views

| View | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Artist | 📋 | 🔴 | Core view |
| Album | 📋 | 🔴 | Core view |
| Song | 📋 | 🔴 | Core view |
| Genre | 📋 | 🟠 | Categorization |
| Era/Year | 📋 | 🟡 | Temporal organization |
| Collections (custom) | 📋 | 🟡 | User-defined groups |
| Folders | 📋 | ⚪ | Advanced mode, optional |

### 7.2 Metadata & Enrichment

#### Core Metadata

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| ID3 Tags | 📋 | 🔴 | MP3 standard |
| Vorbis Comments | 📋 | 🔴 | OGG/FLAC/Opus |
| FLAC Tags | 📋 | 🔴 | FLAC metadata |
| Embedded Covers | 📋 | 🟠 | Album art |
| External Covers | 📋 | 🟡 | Folder.jpg, etc. |

#### Extended Content (Plugins/APIs)

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| **Lyrics** (Synced) | 📋 | 🟡 | "Sound is language" |
| **Lyrics** (Unsynced) | 📋 | 🟡 | Static lyrics |
| **Artist Biographies** | 📋 | ⚪ | Context enrichment |
| **Match Validation** (MusicBrainz) | 📋 | 🟡 | Metadata accuracy |
| **Match Validation** (Discogs) | 📋 | ⚪ | Alternative source |
| User API Keys | 📋 | 🟡 | Heavy usage support |

---

## 8. Playlists

### 8.1 Types

| Type | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Manual | 📋 | 🔴 | User-created |
| Intelligent (rules) | 📋 | 🟡 | Smart playlists |
| Temporary (queue) | 📋 | 🟠 | Current session |

### 8.2 Functions

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Manual order | 📋 | 🔴 | Drag & drop |
| Dynamic reordering | 📋 | 🟡 | Auto-sort |
| Export | 📋 | 🟡 | M3U/PLS format |
| Import | 📋 | 🟡 | M3U/PLS format |

---

## 9. Shuffle

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| True shuffle | 📋 | 🟠 | Not pseudo-sequential |
| Shuffle by Album | 📋 | 🟡 | Album-aware |
| Shuffle by Artist | 📋 | 🟡 | Artist-aware |
| Shuffle by Genre | 📋 | 🟡 | Genre-aware |
| Avoid early repetition | 📋 | 🟡 | Better randomness |

---

## 10. Favorites/Rating System

### 10.1 Key Decision (comparative)

| Option | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| ⭐ Classic 1–5 rating | 📋 | 🟡 | Granular preference |
| ❤️ Binary favorite | 📋 | 🟡 | Simple UX |
| ⭐ + ❤️ Combined (Poweramp-like) | 📋 | 🟡 | Power user option |

**Agent must:**
- Evaluate UX simplicity vs. power
- Propose one as the default
- Allow user to change it

---

## 11. Visualization and UI

### 11.1 Navigation

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Minimalist design | 📋 | 🔴 | Core philosophy |
| No strict Material Design | 📋 | 🔴 | Custom identity |
| "Pro" audio player inspiration | 📋 | 🟠 | Reference design |

### 11.2 Visuals

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Prominent cover art | 📋 | 🔴 | Visual focus |
| Adaptive background (blur) | 📋 | 🟠 | Dynamic theming |
| Adaptive background (color) | 📋 | 🟠 | Dynamic theming |
| **Zen Mode** | 📋 | 🟡 | Hide all UI, only sound |
| **Technical Inspector** | 📋 | 🟡 | Bitrate, format, chain - "Transparency" |
| **Educational UI** | 📋 | 🟡 | Tooltips - "Wise Craftsman" |
| Audio visualizers | 📋 | ⚪ | Later phase |

### 11.3 Themes & Customization

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Token-based theming engine | 📋 | 🟠 | Phase 4 |
| User-defined CSS injection | 📋 | 🟡 | Advanced customization |
| Community theme import | 📋 | 🟡 | Ecosystem growth |

---

## 12. Platforms

### 12.1 Web / PWA

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| HTML5 Audio | 📋 | 🔴 | Foundation |
| Web Audio API | 📋 | 🔴 | Advanced features |
| Service Workers | 📋 | 🟠 | Offline support |

### 12.2 Android

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Native wrapper | 📋 | 🟠 | Store deployment |
| Background audio | 📋 | 🟠 | Essential feature |
| Media notifications | 📋 | 🟠 | OS integration |

### 12.3 iOS

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| AVAudioSession | 📋 | 🟠 | iOS audio system |
| Apple-first restrictions | 📋 | 🟠 | Compliance |
| Correct background modes | 📋 | 🟠 | Background playback |

### 12.4 Windows (Microsoft Store)

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Packaged PWA | 📋 | 🟡 | Store deployment |
| Media keys | 📋 | 🟡 | Hardware integration |
| Basic OS integration | 📋 | 🟡 | Windows features |

---

## 13. Implementation Phases

### Phase 1 – Core (MVP)
**Target:** Functional audio player with basic features

| Feature | Status | Priority | Owner | Notes |
| :--- | :---: | :---: | :--- | :--- |
| Stable playback | 📋 | 🔴 | - | Foundation |
| Base codecs (MP3, AAC, FLAC) | 📋 | 🔴 | - | Essential formats |
| Minimal UI | 📋 | 🔴 | - | Basic controls |
| File system access | 📋 | 🔴 | - | Load music |
| Basic playlist | 📋 | 🔴 | - | Queue management |

### Phase 2 – Library
**Target:** Complete music library management

| Feature | Status | Priority | Owner | Notes |
| :--- | :---: | :---: | :--- | :--- |
| Indexing | 📋 | 🔴 | - | Scan library |
| Metadata parsing | 📋 | 🔴 | - | ID3/Vorbis/FLAC |
| Playlists (manual) | 📋 | 🔴 | - | User-created |
| Search functionality | 📋 | 🟠 | - | Find music |
| **External Metadata APIs** | 📋 | 🟡 | - | MusicBrainz, etc. |
| **Plugin System Alpha** | 📋 | 🟡 | - | Metadata providers |
| **Accessibility features** | 📋 | 🟠 | - | Screen readers, contrast |

### Phase 3 – Pro Audio
**Target:** Advanced audio processing and quality

| Feature | Status | Priority | Owner | Notes |
| :--- | :---: | :---: | :--- | :--- |
| Advanced EQ | 📋 | 🟠 | - | 10+ band parametric |
| Gain control | 📋 | 🟡 | - | Per track/album |
| HQ tuning | 📋 | 🟡 | - | Bit-perfect, exclusive |
| Gapless playback | 📋 | 🟠 | - | Seamless transitions |
| ReplayGain | 📋 | 🟡 | - | Volume normalization |

### Phase 4 – Advanced UX
**Target:** Rich user experience and personalization

| Feature | Status | Priority | Owner | Notes |
| :--- | :---: | :---: | :--- | :--- |
| Visualizations | 📋 | 🟡 | - | Audio visualizers |
| Smart playlists | 📋 | 🟡 | - | Rule-based |
| Personalization | 📋 | 🟡 | - | User preferences |
| **Theme Engine** | 📋 | 🟠 | - | CSS Variables / JSON |
| **Plugin System Beta** | 📋 | 🟠 | - | DSP & UI Widgets |
| Lyrics integration | 📋 | 🟡 | - | Synced/unsynced |

### Phase 5 – Competitive Polishing
**Target:** Production-ready, competitive product

| Feature | Status | Priority | Owner | Notes |
| :--- | :---: | :---: | :--- | :--- |
| Performance optimization | 📋 | 🟠 | - | Speed, memory |
| Cloud Sync (Optional) | 📋 | ⚪ | - | Cross-device |
| Differentiators | 📋 | 🟡 | - | Unique features |
| Mobile apps (Android/iOS) | 📋 | 🟠 | - | Native wrappers |
| Windows Store | 📋 | 🟡 | - | Desktop distribution |

---

## 14. Brand Identity (Required)

**Use the previously defined identity:**
- Name: Sonantica
- Tone: Professional, passionate about audio
- Philosophy: Audio-first, user autonomy, transparency

**Apply to:**
- Code (names, comments)
- Documentation
- UX copy
- Issues / PRs
- Releases

⚠️ **Do not introduce new identities without explicit consent.**

---

## 15. Agent's Final Criterion

Every decision must answer:
> **"Does this improve the user's actual listening experience?"**

If not, it is postponed or discarded.

---

## 16. Progress Tracking

### Current Sprint
- **Sprint:** Not started
- **Focus:** Project setup and architecture
- **Completed:** 0 features
- **In Progress:** 0 features
- **Blocked:** 0 features

### Overall Progress
- **Phase 1 (Core):** 0% complete
- **Phase 2 (Library):** 0% complete
- **Phase 3 (Pro Audio):** 0% complete
- **Phase 4 (Advanced UX):** 0% complete
- **Phase 5 (Polishing):** 0% complete

### Quick Stats
- ✅ Done: 0
- 🚧 In Progress: 0
- 📋 Planned: ~100+
- ⏸️ On Hold: 0
- ❌ Cancelled: 0

---

**Last Updated:** 2025-12-22
**Version:** 2.0.0