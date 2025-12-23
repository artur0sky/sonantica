# @sonantica/audio-analyzer

Professional audio analysis engine for Sonántica.

## Features

- **Real-time Spectrum Analysis**: FFT-based frequency analysis with configurable bands
- **Waveform Capture**: Time-domain audio visualization
- **Quality Detection**: Automatic detection of audio format quality (lossy/CD/Hi-Res)
- **Format Agnostic**: Works with any audio format supported by the browser
- **Zero Dependencies**: Pure Web Audio API implementation

## Philosophy

> "Sound deserves respect."

This package provides professional-grade audio analysis tools for audiophiles and sound engineers, without imposing unnecessary complexity on casual users.

## Usage

```typescript
import { AudioAnalyzer } from '@sonantica/audio-analyzer';

// Create analyzer
const analyzer = new AudioAnalyzer({
  fftSize: 2048,
  bandCount: 32,
  smoothingTimeConstant: 0.75
});

// Connect to audio element
const audioElement = document.querySelector('audio');
analyzer.connect(audioElement);

// Get spectrum data (in animation loop)
function visualize() {
  const spectrum = analyzer.getSpectrum();
  const waveform = analyzer.getWaveform();
  
  // Use spectrum.bands for frequency visualization
  // Use waveform.samples for waveform visualization
  
  requestAnimationFrame(visualize);
}

// Get quality info
const quality = analyzer.getQualityInfo();
console.log(`Sample rate: ${quality.sampleRate} Hz`);
console.log(`Quality: ${quality.qualityTier}`);

// Cleanup
analyzer.dispose();
```

## Architecture

This package follows Sonántica's core principles:

- **Single Responsibility**: Only analyzes audio, doesn't render
- **Open/Closed**: Extensible through configuration
- **Dependency Inversion**: Depends on Web Audio API abstractions
- **Platform Agnostic**: Works in any browser with Web Audio API

## License

Apache-2.0
