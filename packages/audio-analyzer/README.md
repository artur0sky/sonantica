# @sonantica/audio-analyzer

> "Sound deserves respect."

The analytical eye of Sonántica. This package provides high-precision audio analysis, allowing users to "see" the music they hear with technical clarity.

## 🧬 Responsibility

Audio is more than just hearing; it's understanding the signal. This package provides:
- **Fast Fourier Transform (FFT)**: Real-time frequency spectrum analysis.
- **Waveform Data**: Accurate time-domain representation of the audio signal.
- **Quality Detection**: Analyzing sample rates and bit depths to provide "Technical Transparency".
- **State Integration**: Store-based synchronization for audio visualization across the UI.

## 🧠 Philosophy

Following the **Conscious Audiophile** trait, the analyzer provides educational and technical value. It’s not just a "flashing light"—it's a representation of the audio's fidelity.

## 📦 What's Inside

- **AudioAnalyzer**: Core engine using the Web Audio API.
- **SpectrumStore**: Global state for frequency bands and amplitude.
- **WaveformStore**: Management for pre-rendered and real-time waveform samples.

## 🛠️ Usage

```typescript
import { useAnalyzerStore } from '@sonantica/audio-analyzer';

// Inside a React component
const bands = useAnalyzerStore(s => s.spectrum.bands);

// The BackgroundSpectrum molecule in @sonantica/ui uses this data
<BackgroundSpectrum bands={bands} enabled={true} />
```

## 🏗️ Architecture

- **Low Latency**: Optimized FFT processing for minimal visual delay.
- **Decoupled**: Analyzes any `HTMLAudioElement` without knowledge of its source.
- **Modular**: The analysis logic is separated from the visualization components in `@sonantica/ui`.

## 🛡️ Security & Reliability

Real-time analysis of potentially massive audio buffers handles memory with care:
- **Buffer Validation**: Input ArrayBuffers are checked against a 50MB limit to prevent browser crashes.
- **Resource Management**: AudioContexts used for offline analysis are wrapped in strict try-finally blocks to guarantee closure.
- **Config Safety**: Smoothing constants and FFT sizes are validated against safe ranges to prevent Web Audio API errors.
- **Performance Guards**: Analysis loops have sample count limits to prevent UI freezing on main thread.

> "The anatomy of a wave."

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Dubstep**.
