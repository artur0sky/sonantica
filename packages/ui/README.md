# @sonantica/ui

Shared UI components for Sonántica multimedia player.

## Overview

This package contains reusable React components that work across all Sonántica applications (Web, Mobile, Desktop).

## Components

### Atoms
- `Button` - Primary UI button
- `Badge` - Status and label badges
- `Input` - Form inputs
- `RepeatButton` - Repeat mode toggle
- `ShuffleButton` - Shuffle mode toggle
- `VolumeSlider` - Volume control slider

### Molecules
- `TrackCard` - Unified track display component
- `TrackRating` - Star/heart rating component
- `WaveformScrubber` - Audio waveform progress bar
- `EnhancedVolumeControl` - Advanced volume control
- `BackgroundSpectrum` - Real-time audio visualization
- `GlobalSearchBar` - Multi-metadata search

### Player Components
- `MiniPlayer` - Compact player UI
- `ExpandedPlayer` - Full-screen player UI

## Usage

```tsx
import { Button, TrackCard, MiniPlayer } from '@sonantica/ui';
import '@sonantica/ui/styles';

function App() {
  return (
    <div>
      <Button variant="primary">Play</Button>
      <TrackCard track={track} />
      <MiniPlayer />
    </div>
  );
}
```

## Styling

This package uses Tailwind CSS with CSS variables for theming. Make sure to include the styles:

```tsx
import '@sonantica/ui/styles';
```

## Development

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev
```

## Philosophy

All components follow the Sonántica brand identity:
- **Minimalist** - Clean, uncluttered interfaces
- **Functional** - Every element serves a purpose
- **Elegant** - Subtle animations and transitions
- **Accessible** - Keyboard navigation and screen reader support

## License

Apache License 2.0
