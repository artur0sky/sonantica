# @sonantica/analytics

> **Technical Transparency** - Understanding your listening patterns

Analytics and telemetry package for Sonántica. Provides comprehensive tracking of user behavior, playback patterns, and system metrics while respecting privacy and user autonomy.

## Philosophy

This package embodies Sonántica's core value of **Technical Transparency**:

- **Clear**: Users understand exactly what data is collected
- **Respectful**: Privacy-first design with local-first storage
- **Educational**: Insights that help users understand their listening habits
- **Autonomous**: Full user control over data collection

## Features

- 📊 **Comprehensive Event Tracking**: Session, playback, UI, DSP, and search events
- 🎯 **Smart Buffering**: Efficient event batching and sending
- 🔒 **Privacy-First**: Local storage, IP hashing, granular privacy controls
- ⚡ **Performance**: Minimal overhead, async processing
- 🎨 **React Integration**: Easy-to-use hooks for React applications
- 💾 **Persistent State**: Configuration and stats persist across sessions

## Installation

```bash
pnpm add @sonantica/analytics
```

## Quick Start

### Basic Usage

```typescript
import { useAnalytics } from '@sonantica/analytics';

function MyComponent() {
  const analytics = useAnalytics();
  
  // Track a custom event
  const handleClick = () => {
    analytics.track('ui.view_change', {
      type: 'ui',
      action: 'view_change',
      toView: 'library',
    });
  };
  
  return <button onClick={handleClick}>Go to Library</button>;
}
```

### Playback Tracking

```typescript
import { usePlaybackTracking } from '@sonantica/analytics';

function Player({ track, isPlaying, position, volume }) {
  const playbackTracking = usePlaybackTracking(
    {
      trackId: track.id,
      albumId: track.albumId,
      artistId: track.artistId,
      duration: track.duration,
      codec: track.codec,
      bitrate: track.bitrate,
      sampleRate: track.sampleRate,
      source: 'library',
      eqEnabled: false,
      dspEffects: [],
    },
    {
      isPlaying,
      position,
      volume,
    }
  );
  
  useEffect(() => {
    if (isPlaying) {
      playbackTracking.trackPlaybackStart();
    } else {
      playbackTracking.trackPlaybackPause();
    }
  }, [isPlaying]);
  
  return <div>Player UI</div>;
}
```

### Configuration

```typescript
import { useAnalyticsStore } from '@sonantica/analytics';

function SettingsPanel() {
  const { config, updateConfig } = useAnalyticsStore();
  
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => updateConfig({ enabled: e.target.checked })}
        />
        Enable Analytics
      </label>
      
      <label>
        <input
          type="checkbox"
          checked={config.collectPlaybackData}
          onChange={(e) => updateConfig({ collectPlaybackData: e.target.checked })}
        />
        Collect Playback Data
      </label>
    </div>
  );
}
```

## Event Types

### Session Events
- `session.start` - Session started
- `session.end` - Session ended
- `session.heartbeat` - Periodic heartbeat

### Playback Events
- `playback.start` - Track started playing
- `playback.pause` - Track paused
- `playback.resume` - Track resumed
- `playback.stop` - Track stopped
- `playback.skip` - Track skipped
- `playback.complete` - Track completed
- `playback.seek` - User seeked within track
- `playback.progress` - Periodic progress update

### Library Events
- `library.scan` - Library scan initiated
- `library.track_added` - Track added to library
- `track.favorite` - Track favorited
- `playlist.created` - Playlist created

### UI Events
- `ui.view_change` - View changed
- `ui.sidebar_toggle` - Sidebar toggled
- `ui.theme_change` - Theme changed

### DSP Events
- `dsp.eq_preset_changed` - EQ preset changed
- `dsp.eq_band_adjusted` - EQ band adjusted
- `dsp.effect_toggled` - Effect toggled

### Search Events
- `search.query` - Search performed
- `search.result_clicked` - Search result clicked

## Privacy Controls

The analytics system respects user privacy with multiple controls:

```typescript
interface AnalyticsConfig {
  enabled: boolean;                    // Master switch
  collectPlaybackData: boolean;        // Track playback events
  collectUIInteractions: boolean;      // Track UI events
  collectPlatformInfo: boolean;        // Collect browser/OS info
  shareAnonymousStats: boolean;        // Share with project (opt-in)
  dataRetentionDays: number;           // How long to keep data
}
```

### Privacy Features

- **IP Hashing**: IPs are hashed before storage
- **Local-First**: Data stored locally by default
- **Granular Control**: Enable/disable specific event categories
- **Data Export**: Users can export their data (GDPR compliance)
- **Clear Deletion**: Easy data deletion

## API Reference

### `useAnalytics()`

Main hook for analytics tracking.

```typescript
const {
  sessionId,        // Current session ID
  enabled,          // Whether analytics is enabled
  track,            // Track an event
  flush,            // Flush buffered events
  trackPageView,    // Track page view
  trackSearch,      // Track search
  updateConfig,     // Update configuration
  startSession,     // Start session
  endSession,       // End session
} = useAnalytics();
```

### `usePlaybackTracking(options, state)`

Specialized hook for playback tracking.

```typescript
const {
  trackPlaybackStart,
  trackPlaybackPause,
  trackPlaybackResume,
  trackPlaybackComplete,
  trackSeek,
  trackSkip,
} = usePlaybackTracking(options, state);
```

### `getAnalyticsEngine(config?)`

Get or create the analytics engine instance.

```typescript
import { getAnalyticsEngine } from '@sonantica/analytics';

const engine = getAnalyticsEngine({
  enabled: true,
  debug: true,
});

engine.trackEvent('custom.event', { ... });
```

## Performance

The analytics system is designed for minimal performance impact:

- **Event Buffering**: Events are batched (default: 50 events)
- **Periodic Flushing**: Events sent every 30 seconds
- **Async Processing**: All network operations are async
- **Beacon API**: Uses `navigator.sendBeacon` for reliable page unload
- **Debouncing**: Progress events throttled to every 10 seconds

## Architecture

```
@sonantica/analytics
├── core/
│   └── AnalyticsEngine.ts    # Core engine
├── store/
│   └── analyticsStore.ts     # Zustand store
├── hooks/
│   ├── useAnalytics.ts       # Main hook
│   └── usePlaybackTracking.ts
└── types/
    ├── events.ts             # Event types
    └── metrics.ts            # Metric types
```

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm type-check

# Lint
pnpm lint
```

## License

Apache-2.0

---

**Sonántica** - *Respect the intention of the sound and the freedom of the listener.*
