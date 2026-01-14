# Expanded Player - Architecture Documentation

## 📐 Design Principles

This component follows **Atomic Design**, **Clean Architecture**, **SOLID**, and **DRY** principles.

### Golden Ratio (φ ≈ 1.618)
The desktop layout uses the **Golden Ratio** for visual harmony:
- Main grid: `1.618fr : 1fr` (Cover Art : Info Grid)
- Info section: `1.618fr : 1fr` (Track Info : Controls)
- **Cover Art**: Full-size, no max-width limits - occupies entire left column for maximum visual impact

### Mobile Fibonacci Sequence
The mobile layout follows Fibonacci proportions vertically:
- Cover Art: `flex-[2.618]` (φ² - largest element)
- Info Section: `flex-[1.618]` (φ - golden rectangle)
- Controls: `flex-1` (1 - unit rectangle)

## 🏗️ Architecture

```
ExpandedPlayer/
├── index.tsx                    # Main Orchestrator (Organism)
├── ExpandedPlayerMobile.tsx     # Mobile Template
├── ExpandedPlayerDesktop.tsx    # Desktop Template (Golden Ratio)
├── types.ts                     # Shared TypeScript types
├── hooks/
│   └── useExpandedPlayerGestures.ts  # Gesture logic (SRP)
└── sections/                    # Reusable Molecules
    ├── index.ts                 # Barrel export
    ├── CoverArtSection.tsx      # Pure gallery-style art
    ├── InfoSection.tsx          # Track metadata
    ├── ArtistPhotoSection.tsx   # Artist photo (placeholder)
    ├── WidgetsSection.tsx       # Widgets (placeholder)
    ├── TimelineSection.tsx      # Waveform + time
    ├── ControlsSection.tsx      # Playback controls
    └── NavigationFooter.tsx     # Footer navigation
```

## 🎯 SOLID Principles Applied

### Single Responsibility Principle (SRP)
- Each section has ONE clear purpose
- `useExpandedPlayerGestures` handles ONLY gesture logic
- `CoverArtSection` handles ONLY cover art display

### Open/Closed Principle (OCP)
- Sections are open for extension (props) but closed for modification
- New widgets can be added without changing existing code

### Liskov Substitution Principle (LSP)
- `CoverArtSection` works with/without gestures (mobile/desktop)
- `ControlsSection` adapts to mobile/desktop sizes

### Interface Segregation Principle (ISP)
- Each section receives ONLY the props it needs
- No bloated interfaces with unused props

### Dependency Inversion Principle (DIP)
- Components depend on abstractions (types.ts)
- Business logic separated from presentation

## 🧩 Atomic Design Hierarchy

### Atoms (from `@sonantica/ui`)
- `PlayerButton`, `PlayButton`, `SkipButton`
- `ShuffleButton`, `RepeatButton`, `ActionIconButton`

### Molecules (Sections)
- `CoverArtSection` - Combines image + motion + gestures
- `InfoSection` - Combines title + artist + rating
- `TimelineSection` - Combines waveform + time display
- `ControlsSection` - Combines playback buttons
- `NavigationFooter` - Combines navigation buttons

### Templates
- `ExpandedPlayerMobile` - Mobile layout structure
- `ExpandedPlayerDesktop` - Desktop layout structure (Golden Ratio)

### Organism
- `ExpandedPlayer` (index.tsx) - Main orchestrator

## 🔄 DRY Implementation

### Shared Logic
- `useExpandedPlayerGestures` - Reusable gesture hook
- `TimelineSection` - Used in both mobile & desktop
- `ControlsSection` - Used in both mobile & desktop
- `NavigationFooter` - Used in both mobile & desktop

### Shared Props
- `types.ts` - Single source of truth for interfaces
- Main orchestrator passes same props to both templates

## 📱 Responsive Behavior

### Mobile (`lg:hidden`)
- Vertical layout
- Interactive cover art with gestures (drag, long-press)
- Full-width sections

### Desktop (`hidden lg:grid`)
- **Golden Ratio grid** layout
- Pure cover art (no overlays, gallery-style)
- Info grid with Artist Photo + Widgets placeholders
- Adapts to sidebar visibility

## 🎨 Sonántica Philosophy

> **"Respect the intention of the sound and the freedom of the listener."**

- **Cover Art as Art**: Desktop treats album art as a gallery piece
- **Intentional Minimalism**: Clean, distraction-free design
- **Mathematical Harmony**: Golden Ratio for visual balance
- **User Autonomy**: Placeholders ready for future customization

## 🚀 Future Extensions

### Artist Photo Section
- Fetch from MusicBrainz/Last.fm
- Fallback to placeholder

### Widgets Section
- Audio quality indicator
- Lyrics preview
- Related tracks
- Custom user widgets (plugin system)

## 📦 Import Usage

```tsx
// Main component
import { ExpandedPlayer } from "@sonantica/ui";

// Individual sections (if needed)
import { 
  CoverArtSection,
  InfoSection,
  TimelineSection 
} from "@sonantica/ui/ExpandedPlayer/sections";

// Types (if extending)
import type { 
  ExpandedPlayerProps,
  InfoSectionProps 
} from "@sonantica/ui/ExpandedPlayer/types";
```

## 🔧 Maintenance

### Adding a New Section
1. Create `NewSection.tsx` in `sections/`
2. Export from `sections/index.ts`
3. Add to appropriate template (Mobile/Desktop)
4. Define props in `types.ts`

### Modifying Layout
- **Mobile**: Edit `ExpandedPlayerMobile.tsx`
- **Desktop**: Edit `ExpandedPlayerDesktop.tsx`
- **Both**: Update shared sections

### Golden Ratio Adjustments
- Main grid: `lg:grid-cols-[1fr_1.618fr]`
- Info grid: `grid-cols-[1.618fr_1fr]`

---

**Built with ❤️ following Sonántica's philosophy of intentional minimalism and technical excellence.**

---

Made with ❤ and **Opera**.
