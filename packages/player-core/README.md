# @sonantica/player-core

Core audio playback engine for Sonántica.

## Philosophy

> "The core must be able to run without a UI."

This package contains the audio playback engine. It is:
- **Platform-agnostic**: Works in any JavaScript environment
- **UI-agnostic**: No knowledge of React, Vue, or any framework
- **Framework-agnostic**: Pure TypeScript with minimal dependencies

## What's Inside

- **PlayerEngine**: Main audio playback class
- **Contracts**: Interfaces defining the public API (`IPlayerEngine`)

## Usage

```typescript
import { PlayerEngine } from '@sonantica/player-core';
import { PlaybackState } from '@sonantica/shared';

const player = new PlayerEngine();

// Load audio
await player.load({
  id: 'song-1',
  url: 'path/to/audio.mp3',
  metadata: {
    title: 'Song Title',
    artist: 'Artist Name',
  },
});

// Play
await player.play();

// Listen to events
player.on('player:state-change', (event) => {
  console.log('State changed:', event.data.newState);
});

// Cleanup
player.dispose();
```

## Architecture

The player core follows **Clean Architecture** principles:
- Depends only on `@sonantica/shared` (types and utilities)
- Exposes a contract-based API (`IPlayerEngine`)
- Communicates via events (observer pattern)
- Encapsulates all state internally

```
player-core ───▶ shared ───▶ (nothing)
```

## Current Implementation

This is a minimal "Hello World" implementation using the Web Audio API. Future versions will include:
- Advanced codec support (FLAC, ALAC, etc.)
- Gapless playback
- DSP processing
- Buffer management
- Bit-perfect output

## License

Apache-2.0
