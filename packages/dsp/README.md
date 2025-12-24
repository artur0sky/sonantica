# @sonantica/dsp

> "If a function alters the sound, it must be optional, explainable, and reversible."

The professional DSP (Digital Signal Processing) engine at the heart of Sonántica's audio enhancement. This package provides parametric EQ, preamp control, and audio effects while respecting the original signal.

## 🎛️ Responsibility

Sound shaping is an art that requires precision and transparency. This package provides:

- **Parametric Equalizer**: 10-band professional EQ with full control over frequency, gain, and Q factor.
- **Curated Presets**: Genre-specific and use-case optimized EQ curves designed with care.
- **Preamp Control**: Independent gain staging to prevent clipping and optimize headroom.
- **Technical Transparency**: Real-time audio metrics for the conscious audiophile.
- **Reversibility**: Every change can be undone—fidelity is never compromised permanently.

## 🧠 Philosophy


Following the **"Fidelity should not be imposed, it should be offered"** principle, the DSP engine is designed to enhance, not dictate. All processing is optional, transparent, and can be bypassed with a single toggle.

## 📦 What's Inside

- **DSPEngine**: Core audio processing engine using Web Audio API.
- **EQ Presets**: 11 built-in presets (Flat, Bass Boost, V-Shape, Vocal, Acoustic, Rock, Classical, Electronic, Jazz, Treble Boost, Headphone).
- **Custom Presets**: Save and manage your own EQ configurations.
- **DSP Store**: Zustand-based state management for reactive UI integration.
- **Audio Metrics**: Real-time RMS, peak levels, and spectrum data.

## 🛠️ Usage

```typescript
import { useDSPStore } from '@sonantica/dsp';

// Initialize with an audio element
const { initialize, applyPreset, setEnabled } = useDSPStore();

await initialize(audioElement);

// Apply a preset
applyPreset('bass-boost');

// Enable processing
setEnabled(true);

// Custom EQ
const customBands = [
  { id: 'bass', type: 'lowshelf', frequency: 100, gain: 6, q: 1.0, enabled: true },
  { id: 'mid', type: 'peaking', frequency: 1000, gain: -2, q: 1.0, enabled: true },
];
applyCustomEQ(customBands);
```

## 🏗️ Architecture

- **Web Audio API**: Native browser audio processing for maximum performance.
- **Zero Latency**: Real-time processing with no perceivable delay.
- **Modular Chain**: Source → EQ Bands → Preamp → Analyzer → Destination.
- **SOLID Principles**: Open for extension (custom effects), closed for modification (stable core).

## 🎚️ Built-in Presets

| Preset | Purpose | Character |
| :--- | :--- | :--- |
| **Flat** | Reference | Unaltered, pure signal |
| **Bass Boost** | Enhanced low-end | Impactful without muddiness |
| **V-Shape** | Modern sound | Boosted lows and highs |
| **Vocal** | Speech clarity | Enhanced presence |
| **Acoustic** | Natural warmth | Organic instruments |
| **Rock** | Punchy mids | Guitar and drums |
| **Classical** | Balanced dynamics | Orchestral music |
| **Electronic** | Bright and energetic | EDM and synthwave |
| **Jazz** | Smooth warmth | Brass and upright bass |
| **Treble Boost** | Added air | Sparkle and clarity |
| **Headphone** | Reduced fatigue | Extended listening |

> "Adjust. Listen. Decide."

---

Made with ❤ and **Kawaii Metal**.
