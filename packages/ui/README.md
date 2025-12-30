# @sonantica/ui

> "The UI should feel like a well-acoustically treated room."

The official design system and component library for Sonántica. This package provides the "Acoustic Aesthetics" that define our player's visual identity.

## 🎨 Identity & Principles

Our UI is designed to be **invisible but present**. We prioritize:
- **Calmness**: Neutral tones and ample whitespace to let cover art speak.
- **Precision**: Clean lines and tabular numerals for technical data.
- **Subtlety**: Micro-animations that guide rather than distract.

## 📦 What's Inside

Built on **Atomic Design** principles:

- **Atoms**: Primitive elements (`Button`, `ShuffleButton`, `RepeatButton`, `VolumeSlider`).
- **Molecules**: Compound logic (`WaveformScrubber`, `TrackRating`, `EnhancedVolumeControl`, `AlphabetNavigator`).
- **Organisms**: Complex features (`MiniPlayer`, `ExpandedPlayer`, `MetadataPanel`).
- **Typography**: Standardized `Lexend` font usage for optimal readability.
- **Layouts**: Structural foundations for the application.

## 🛠️ Built With

- **React**: Core component architecture.
- **Framer Motion**: Smooth, physics-based transitions.
- **Tailwind CSS**: Token-based design system (Custom variables).
- **Tabler Icons**: Professional and clear iconography.

## 🚀 Usage

```tsx
import { MiniPlayer, Button } from '@sonantica/ui';

export function MyView() {
  return (
    <>
      <Button variant="primary">Start Listening</Button>
      <MiniPlayer />
    </>
  );
}
```

## ⚡ Performance Optimizations

Visual fidelity should never compromise audio fidelity. Our components are engineered for efficiency.

### React Memoization
**Philosophy:** Render only what changes. Respect the main thread.

```tsx
import { TrackCard } from '@sonantica/ui';

// Memoized with React.memo + useCallback
// Re-renders only when track data actually changes
<TrackCard track={track} onPlay={handlePlay} />
```

**Optimized Components:**
- `TrackCard` - Prevents re-renders in large lists
- `SpectrumVisualizer` - Reuses canvas context, 60fps locked
- `ContextMenu` - GPU-only animations
- `EmptyState` - Lazy-loaded with fade-in

> "Every frame matters when thousands of tracks await."

### Lazy Image Loading
**Philosophy:** Load what's visible. Cache what's valuable.

```tsx
import { LazyAlbumArt } from '@sonantica/ui';

// Lazy loads with blur-up effect
// LRU cache (200 items) prevents re-downloads
<LazyAlbumArt 
  src={coverUrl} 
  alt="Album Art"
  threshold={0.2} // Load when 20% visible
/>
```

**Features:**
- Intersection Observer for visibility detection
- Blur-up effect for smooth loading
- Automatic fallback icon
- LRU cache (200 items max)
- 30-50% memory reduction for large libraries

> "Images should arrive when needed, not before."

## 📐 Theming

All components use CSS Custom Properties for easy extensibility per the **User Autonomy** value:

```css
:root {
  --color-accent: #f43f5e;
  --bg-surface: #0a0a0a;
}
```

> "The silence between the notes, visualized."

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Orchestral**.
