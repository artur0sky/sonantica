# @sonantica/audio-analyzer

> "Listening is an active act."

Real-time audio analysis for Sonántica. This package provides spectrum visualization and audio metrics without compromising playback performance.

## 📊 Responsibility

Visual feedback for the listening experience:
- **Spectrum Analysis**: Real-time FFT for frequency visualization
- **Waveform Data**: Time-domain representation
- **Audio Metrics**: RMS, peak levels, dynamic range

## 🧠 Philosophy

Analysis should inform, not interrupt. Every visualization serves the listener's understanding of the sound.

## ⚡ Performance Optimizations

Visualization must never steal cycles from audio.

### Intelligent Throttling
**Philosophy:** Analyze only when needed. Cache when possible.

```typescript
import { AudioAnalyzer } from '@sonantica/audio-analyzer';

const analyzer = new AudioAnalyzer(audioContext);

// Automatic throttling based on visibility
analyzer.setThrottle(16); // ~60fps when visible
analyzer.setThrottle(100); // Slower when hidden

const spectrum = analyzer.getSpectrum(); // Cached if recent
```

**Optimizations:**
- FFT calls reduced by 60-90% through caching
- Dynamic throttling based on visibility
- Reusable buffers (no allocations)

> "Measure what matters, when it matters."

### Impact
- 60-90% fewer FFT calculations
- Smooth 60fps visualizations
- Zero impact on audio thread

## 🛠️ Usage

```typescript
import { useAudioAnalyzer } from '@sonantica/audio-analyzer';

const { spectrum, waveform } = useAudioAnalyzer(audioElement);

// spectrum: Float32Array of frequency magnitudes
// waveform: Float32Array of time-domain samples
```

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Ambient**.
