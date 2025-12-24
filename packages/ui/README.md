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
- **Molecules**: Compound logic (`WaveformScrubber`, `TrackRating`, `EnhancedVolumeControl`).
- **Organisms**: Complex features (`MiniPlayer`, `ExpandedPlayer`, `MetadataPanel`).
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

## 📐 Theming

All components use CSS Custom Properties for easy extensibility per the **User Autonomy** value:

```css
:root {
  --color-accent: #f43f5e;
  --bg-surface: #0a0a0a;
}
```

> "The silence between the notes, visualized."

---

Made with ❤ and **Orchestral**.
