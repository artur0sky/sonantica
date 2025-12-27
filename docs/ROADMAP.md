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
| **UI Layer** | Web / Mobile / Desktop | ✅ | 🔴 |
| **Application Layer** | Playlists, UX logic | ✅ | 🔴 |
| **Player Core** | Audio engine | ✅ | 🔴 |
| **Platform Abstractions** | FS, Media Session | 🚧 | 🟠 |
| **Native / Web APIs** | Browser / OS Primitives | ✅ | 🟠 |

---

## 4. Player Core

### 4.1 Responsibilities

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Audio Decoding | ✅ | 🔴 | HTML5 Audio + Web Audio API |
| Buffer Management | ✅ | 🔴 | Implemented in PlayerEngine |
| State Control | ✅ | 🔴 | Play/Pause/Stop/Seek all working |
| EQ and DSP Processing | 📋 | 🟠 | Phase 3 feature |
| Playback Metrics | ✅ | 🟡 | Time, duration, buffered tracking |
| **Gapless Playback** | 📋 | 🟠 | Needs implementation |
| **Exclusive Mode / Bit-perfect** | 📋 | 🟡 | Browser limitations |

### 4.2 Supported Codecs

#### High Fidelity (High Priority)

| Codec | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| FLAC | ✅ | 🔴 | Native browser support |
| ALAC | ✅ | 🟠 | M4A container support |
| WAV / AIFF | ✅ | 🟠 | Native support |
| Opus (HQ) | ✅ | 🟡 | Native support |

#### Common (Compatibility)

| Codec | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| MP3 | ✅ | 🔴 | Universal compatibility |
| AAC / M4A | ✅ | 🔴 | Modern standard |
| OGG Vorbis | ✅ | 🟡 | Open format |

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
| Play/Pause | ✅ | 🔴 | Fully implemented |
| Next/Previous | ✅ | 🔴 | Queue navigation working |
| Precise Seek | ✅ | 🔴 | Waveform scrubber implemented |
| Independent Volume | ✅ | 🔴 | Volume control with mute |

### 6.2 Advanced Controls

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Media Session API | ✅ | 🟠 | Full OS integration |
| Lockscreen Controls | ✅ | 🟠 | Via Media Session API |
| Headset/Bluetooth | ✅ | 🟠 | Hardware integration working |
| Background playback | 🚧 | 🟠 | PWA supports, native pending |
| **Keyboard Shortcuts** | ✅ | 🟡 | Complete desktop control |

---

## 7. Library Organization

### 7.1 Main Views

| View | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Artist | ✅ | 🔴 | ArtistsPage with cards |
| Album | ✅ | 🔴 | AlbumsPage with grid |
| Song | ✅ | 🔴 | TracksPage with list |
| Genre | 📋 | 🟠 | Metadata available, view pending |
| Era/Year | 📋 | 🟡 | Metadata available, view pending |
| Collections (custom) | 📋 | 🟡 | User-defined groups |
| Folders | 📋 | ⚪ | Advanced mode, optional |

### 7.2 Metadata & Enrichment

#### Core Metadata

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| ID3 Tags | ✅ | 🔴 | MetadataExtractor implemented |
| Vorbis Comments | ✅ | 🔴 | Full support |
| FLAC Tags | ✅ | 🔴 | Full support |
| Embedded Covers | ✅ | 🟠 | Album art extraction working |
| External Covers | 📋 | 🟡 | Folder.jpg, etc. |

#### Extended Content (Plugins/APIs)

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| **Lyrics** (Synced) | ✅ | 🟡 | LRC parser + synchronizer |
| **Lyrics** (Unsynced) | ✅ | 🟡 | Static lyrics display |
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
| Temporary (queue) | ✅ | 🟠 | QueueStore implemented |

### 8.2 Functions

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Manual order | ✅ | 🔴 | Queue reordering working |
| Dynamic reordering | 📋 | 🟡 | Auto-sort |
| Export | 📋 | 🟡 | M3U/PLS format |
| Import | 📋 | 🟡 | M3U/PLS format |

---

## 9. Shuffle

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| True shuffle | ✅ | 🟠 | Fisher-Yates algorithm |
| Shuffle by Album | 📋 | 🟡 | Album-aware |
| Shuffle by Artist | 📋 | 🟡 | Artist-aware |
| Shuffle by Genre | 📋 | 🟡 | Genre-aware |
| Avoid early repetition | ✅ | 🟡 | True randomness implemented |

---

## 10. Favorites/Rating System

### 10.1 Key Decision (comparative)

| Option | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| ⭐ Classic 1–5 rating | ✅ | 🟡 | TrackRating component exists |
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
| Minimalist design | ✅ | 🔴 | Clean, professional UI |
| No strict Material Design | ✅ | 🔴 | Custom Sonántica identity |
| "Pro" audio player inspiration | ✅ | 🟠 | Waveform, spectrum viz |

### 11.2 Visuals

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Prominent cover art | ✅ | 🔴 | Large album art in player |
| Adaptive background (blur) | ✅ | 🟠 | Blur effect implemented |
| Adaptive background (color) | ✅ | 🟠 | Color extraction working |
| **Zen Mode** | 📋 | 🟡 | Hide all UI, only sound |
| **Technical Inspector** | ✅ | 🟡 | MetadataPanel shows details |
| **Educational UI** | 📋 | 🟡 | Tooltips - "Wise Craftsman" |
| Audio visualizers | ✅ | ⚪ | Spectrum + waveform |

### 11.3 Themes & Customization

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Token-based theming engine | ✅ | 🟠 | CSS variables system |
| User-defined CSS injection | 📋 | 🟡 | Advanced customization |
| Community theme import | 📋 | 🟡 | Ecosystem growth |

---

## 12. Platforms

### 12.1 Web / PWA

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| HTML5 Audio | ✅ | 🔴 | Foundation |
| Web Audio API | ✅ | 🔴 | Advanced features |
| Service Workers | ✅ | 🟠 | VitePWA configured |

### 12.2 Android

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Native wrapper | 🚧 | 🟠 | Mobile folder exists |
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

### 12.5 Smart TV (Living Room)

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Leanback UI | 📋 | 🟡 | D-Pad/Remote navigation |
| Immersive "Vinyl" Mode | 📋 | 🟡 | Focus on artwork & metadata |
| High-Def Audio Output | 📋 | 🟠 | Passthrough/HDMI ARC |

### 12.6 Automotive (On the Move)

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Android Auto | 📋 | 🟠 | Standard media service |
| CarPlay | 📋 | 🟠 | CPApplicationDelegate |
| Distraction-free UI | 📋 | 🔴 | Safety-first design |

### 12.7 Wearables (Wrist)

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Companion Remote | 📋 | 🟡 | Control phone playback |
| Offline Playback | 📋 | ⚪ | Standalone (Phase 6) |

### 12.8 Browser Extension (Universal DSP)

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| **Global DSP Injection** | 📋 | 🟡 | Apply EQ/DSP to any website |
| Tab Audio Capture | 📋 | 🟡 | `chrome.tabCapture` integration |
| Floating Mini-Player | 📋 | ⚪ | Control Sonántica from any tab |

### 12.9 Linux Desktop

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| **Flatpak / Flathub** | 📋 | 🟠 | Primary distribution |
| Snap Store | 📋 | 🟡 | Canonical support |
| AppImage | 📋 | 🟡 | Universal portable |
| PipeWire Integration | 📋 | 🟠 | Low latency audio |

### 12.10 macOS Desktop

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| **Apple Silicon (Native)** | 📋 | 🟠 | M1/M2/M3 Optimization |
| Touch Bar Controls | 📋 | ⚪ | Contextual controls |
| CoreAudio Exclusive | 📋 | 🟡 | Bit-perfect output |

### 12.11 Headless / Embedded (Audiophile Server)

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| **No-UI Core** | 📋 | 🟡 | Daemon mode for Raspberry Pi |
| Remote Control API | 📋 | 🟡 | Control via Phone/Web |
| Docker Container | 📋 | 🟡 | Easy deployment |

### 12.12 Game Consoles

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| Xbox UWP | 📋 | ⚪ | Background music support |
| PlayStation Web Player | 📋 | ⚪ | Optimized web view |

### 12.13 Integrations

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| **OBS Studio Dock** | 📋 | 🟡 | For streamers |
| **Home Assistant** | 📋 | 🟡 | Media Player Entity |
| Discord Rich Presence | 📋 | ⚪ | "Now Playing" status |

---

## 13. Implementation Phases

### Phase 1 – Core (MVP)
**Target:** Functional audio player with basic features

| Feature | Status | Priority | Owner | Notes |
| :--- | :---: | :---: | :--- | :--- |
| Stable playback | ✅ | 🔴 | - | PlayerEngine working |
| Base codecs (MP3, AAC, FLAC) | ✅ | 🔴 | - | All formats supported |
| Minimal UI | ✅ | 🔴 | - | MiniPlayer + ExpandedPlayer |
| File system access | ✅ | 🔴 | - | File API integration |
| Basic playlist | ✅ | 🔴 | - | Queue management |

### Phase 2 – Library
**Target:** Complete music library management

| Feature | Status | Priority | Owner | Notes |
| :--- | :---: | :---: | :--- | :--- |
| Indexing | ✅ | 🔴 | - | MediaLibrary scanner |
| Metadata parsing | ✅ | 🔴 | - | ID3/Vorbis/FLAC |
| Playlists (manual) | 📋 | 🔴 | - | User-created |
| Search functionality | ✅ | 🟠 | - | Global SearchBar |
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
| Visualizations | ✅ | 🟡 | - | Spectrum + waveform |
| Smart playlists | 📋 | 🟡 | - | Rule-based |
| Personalization | 🚧 | 🟡 | - | User preferences |
| **Theme Engine** | ✅ | 🟠 | - | CSS Variables implemented |
| **Plugin System Beta** | 📋 | 🟠 | - | DSP & UI Widgets |
| Lyrics integration | ✅ | 🟡 | - | Synced/unsynced working |

### Phase 5 – Competitive Polishing
**Target:** Production-ready, competitive product

| Feature | Status | Priority | Owner | Notes |
| :--- | :---: | :---: | :--- | :--- |
| Performance optimization | ✅ | 🟠 | - | Infinite scroll, lazy loading |
| Cloud Sync (Optional) | 📋 | ⚪ | - | Cross-device |
| Differentiators | ✅ | 🟡 | - | Waveform, lyrics, spectrum |
| Mobile apps (Android/iOS) | 🚧 | 🟠 | - | Native wrappers |
| Windows Store | 📋 | 🟡 | - | Desktop distribution |
| **Linux Desktop** | 📋 | 🟠 | - | Flatpak / Snap / AppImage |
| **macOS Desktop** | 📋 | 🟠 | - | Apple Silicon Native |

### Phase 6 – Ecosystem Expansion
**Target:** Ubiquitous listening experience (Living Room, Car, Wrist)

| Feature | Status | Priority | Owner | Notes |
| :--- | :---: | :---: | :--- | :--- |
| Smart TV App | 📋 | 🟡 | - | Android TV / Tizen |
| Automotive Integration | 📋 | 🟠 | - | Android Auto / CarPlay |
| Wearable Companion | 📋 | 🟡 | - | WatchOS / WearOS |
| Cast Protocol | 📋 | 🟡 | - | Chromecast / AirPlay |
| **Headless / IoT** | 📋 | 🟡 | - | Raspberry Pi / Home Assistant |
| **Integrations** | 📋 | 🟡 | - | OBS / Discord |
| **Game Consoles** | 📋 | ⚪ | - | Xbox / PlayStation |

---

## 14. Additional Features Implemented (Not in Original Roadmap)

### 14.1 UI/UX Enhancements

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| **Alphabet Navigator** | ✅ | 🟡 | Quick navigation in lists |
| **Infinite Scroll** | ✅ | 🟠 | Performance optimization |
| **Sticky Headers** | ✅ | 🟡 | Better navigation |
| **Responsive Mobile UI** | ✅ | 🔴 | Touch-optimized |
| **Dual Sidebars** | ✅ | 🟠 | Navigation + Queue |
| **Resizable Sidebars** | ✅ | 🟡 | User customization |
| **Waveform Scrubber** | ✅ | 🟠 | Visual seek control |
| **Background Spectrum** | ✅ | 🟡 | Ambient visualization |
| **Enhanced Volume Control** | ✅ | 🟡 | Precise control |
| **Playback Persistence** | ✅ | 🟠 | Resume on reload |

### 14.2 Library Features

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| **Artist Detail Pages** | ✅ | 🔴 | Full artist view |
| **Album Detail Pages** | ✅ | 🔴 | Full album view |
| **Track Cards** | ✅ | 🔴 | Rich track display |
| **Artist Cards** | ✅ | 🔴 | Grid view |
| **Album Cards** | ✅ | 🔴 | Grid view |
| **Sort Controls** | ✅ | 🟠 | Multiple sort options |
| **Filter by Search** | ✅ | 🟠 | Real-time filtering |

### 14.3 Player Features

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| **Repeat Modes** | ✅ | 🟠 | Off/One/All |
| **Shuffle Toggle** | ✅ | 🟠 | True randomness |
| **Queue Visualization** | ✅ | 🟠 | RightSidebar |
| **Lyrics Sidebar** | ✅ | 🟡 | Dedicated lyrics view |
| **Click-to-Seek Lyrics** | ✅ | 🟡 | Interactive lyrics |
| **Auto-scroll Lyrics** | ✅ | 🟡 | Synchronized scrolling |
| **Metadata Panel** | ✅ | 🟡 | Technical details |

### 14.4 Technical Infrastructure

| Feature | Status | Priority | Notes |
| :--- | :---: | :---: | :--- |
| **Monorepo Architecture** | ✅ | 🔴 | Packages + Apps |
| **TypeScript** | ✅ | 🔴 | Full type safety |
| **Zustand State Management** | ✅ | 🔴 | Reactive stores |
| **Framer Motion** | ✅ | 🟡 | Smooth animations |
| **Tailwind CSS** | ✅ | 🟠 | Utility-first styling |
| **Vite Build System** | ✅ | 🔴 | Fast development |
| **Docker Support** | ✅ | 🟡 | Containerization |
| **Audio Analyzer Package** | ✅ | 🟡 | Waveform generation |

---

## 15. Brand Identity (Required)

**Use the previously defined identity:**
- Name: Sonántica
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

## 16. Agent's Final Criterion

Every decision must answer:
> **"Does this improve the user's actual listening experience?"**

If not, it is postponed or discarded.

---

## 17. Progress Tracking

### Current Sprint
- **Sprint:** Phase 2 - Library & UX Polish
- **Focus:** Complete library features and UX refinements
- **Completed:** ~65 features
- **In Progress:** ~8 features
- **Blocked:** 0 features

### Overall Progress
- **Phase 1 (Core):** ✅ 100% complete
- **Phase 2 (Library):** 🚧 85% complete
- **Phase 3 (Pro Audio):** 📋 0% complete
- **Phase 4 (Advanced UX):** 🚧 70% complete
- **Phase 5 (Polishing):** 🚧 40% complete

### Quick Stats
- ✅ Done: ~65
- 🚧 In Progress: ~8
- 📋 Planned: ~45
- ⏸️ On Hold: 0
- ❌ Cancelled: 0

### Completion by Category
- **Player Core:** 85% ✅
- **Library Management:** 80% ✅
- **UI/UX:** 90% ✅
- **Metadata:** 75% ✅
- **Playlists:** 40% 🚧
- **Audio Processing (DSP):** 0% 📋
- **Platform Support:** 35% 🚧
- **Advanced Features:** 60% 🚧

---

## 18. Next Priorities

### Immediate (Next Sprint)
1. ✅ ~~Mobile UI improvements (search, alphabet nav)~~
2. Manual playlist creation and management
3. Genre and Year views
4. External cover art support
5. Keyboard shortcuts

### Short-term (1-2 Sprints)
1. Advanced EQ implementation
2. Gapless playback
3. Media Session API completion
4. Playlist import/export (M3U/PLS)
5. Educational tooltips

### Medium-term (3-6 Sprints)
1. Mobile app deployment (Android/iOS)
2. External metadata APIs (MusicBrainz)
3. Smart playlists
4. Plugin system architecture
5. Accessibility improvements

### Long-term (6+ Sprints)
1. Automotive integration (Android Auto/CarPlay)
2. Smart TV Experience
3. Cloud sync (optional)
4. Community theme marketplace
5. Advanced DSP features
6. Cross-platform optimization

---

**Last Updated:** 2024-12-24
**Version:** 3.0.0
**Status:** Active Development - Phase 2/3