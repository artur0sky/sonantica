# Analytics System Evolution Plan

This document outlines the roadmap for verifying and evolving the analytics pipeline of Sonántica.
It adheres to the **Technical Transparency** and **Wise Craftsman** philosophy.

## 1. Current State & Verification

**Status**: Verified & Enhanced.

- **Pipeline**:
  - `usePlaybackAnalytics` tracks audio events (Play, Pause, Seek).
  - `AnalyticsEngine` buffers and flushes events to API.
  - `useAnalyticsIntegration` now tracks Page Views (`ui.view_change`).
- **Performance**:
  - `AnalyticsEngine` now persists event buffers to `localStorage` to survive offline/crashes.
  - `useRealtimeStats` uses polling (consider WebSockets for Phase 3).
- **UI**:
  - `AnalyticsDashboard` displays core metrics.

---

## 2. Multi-Server & Scalability Strategy

To support users with multiple music servers (e.g., Home, Office, Cloud):

1.  **Federated Data Fetching**:
    - The `AnalyticsDashboard` should query all configured servers.
    - **Aggregation**: Merge data on the client-side for "Global View".
    - **Separation**: A "Server Source" dropdown in the UI to filter by specific server.

2.  **Precise Timing**:
    - Ensure all events carry `serverTimestamp` and `clientTimestamp`.
    - Use NTP-like offset calculation if servers are drift-prone.

---

## 3. Advanced Visualization (The "Audiophile Insight")

We will implement advanced charting to give "Wise Craftsman" depth to the data.

### 3.1 Swarm Plot (Timeline Distribution)

- **Concept**: Each dot is a listening session/track.
- **X-Axis**: Time of day.
- **Color**: Genre or Format (FLAC/MP3).
- **Use Case**: "See your day in sound." Identifying clusters of high-fidelity listening vs. casual background listening.

### 3.2 Icicle Chart (Hierarchical Drill-down)

- **Concept**: Hierarchical Rectangles.
- **Hierarchy**: Genre → Artist → Album → Track.
- **Use Case**: Deep dive into library composition. A visual inventory of the music collection's depth.

### 3.3 Sankey Diagram (Session Flow)

- **Concept**: Flow of entities.
- **Flow**: Source (Search/Playlist) → Song Played → Action (Skip/Complete/Repeat) or Next Song.
- **Use Case**: Analyzing "Session Flow." Do I skip more often when I start from "Shuffle" vs "Album"?

### 3.4 Stream Chart (The "Waveform" of Taste)

- **Concept**: Organic, flowing area chart centered on the axis.
- **Data**: Plays per Genre/Artist over time (Months/Years).
- **Use Case**: Visualizing the *evolution* of musical taste. It looks like a sound wave, fitting the brand identity perfectly.

### 3.5 Radial Bar & Bump Charts
*   **Radial Bar**: "The 24h Clock". Best for visualizing *when* user listens (e.g., Late night jazz vs Morning news).
*   **Bump Chart**: "Rankings Race". Visualizing how the Top 5 Artists change rank month over month.

---

## 4. Implementation Roadmap

### Phase 1: Robustness (Immediate) - **COMPLETED**
- [x] Verify Pipeline (Audio & Page Views).
- [x] Implement Persistent Event Buffer (localStorage).
- [x] Optimize caching strategy.

### Phase 2: Enhanced UI & New Charts (Next Sprint)
- [ ] Install/Upgrade visualization library (Recommend `@nivo` for Swarm/Stream/Sankey).
- [ ] Create `StreamChart` component in `@sonantica/ui`.
- [ ] Create `SessionSankey` component.
- [ ] Implement "Precise Time" toggle in Dashboard (switching between aggregations).

### Phase 3: Federation & Server Scalability
- [ ] Update `useAnalyticsDashboard` to accept `serverIds` filter.
- [ ] Implement `fetchAggregatedStats` service.
- [ ] Add "Server Source" dropdown in Dashboard Header.

### Phase 4: The "Audiophile" Deep Dive
- [ ] **Technical Inspector**: A special view showing Codec/Bitrate distribution (Pie/Bar).
- [ ] **Gapless Analysis**: unexpected gaps or buffer underruns (using `playback.buffer_underrun` events).

---

## 5. Technical Guidelines (SOLID & CLEAN)

1.  **Atomic Components**: Each chart is a Molecule/Organism.
2.  **Data Isolation**: Data transformation logic (Raw Event -> Chart Format) stays in `hooks/` or `utils/`, never in the View.
3.  **Responsive**: All charts must redraw/resize (use `ResponsiveWrapper`).
4.  **Theming**: Charts must respect the `theme-token` system (Dark/Light mode compliant colors).
