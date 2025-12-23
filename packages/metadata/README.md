# @sonantica/metadata

> Lightweight metadata extraction for audio files

## Features

- ✅ **ID3v2** support (MP3)
- ✅ **FLAC** Vorbis comments
- ✅ **Album artwork** extraction
- ✅ **Browser-optimized** (range requests)
- ✅ **Zero dependencies** (except @sonantica/shared)
- ✅ **TypeScript** first

## Installation

```bash
pnpm add @sonantica/metadata
```

## Usage

```typescript
import { extractMetadata } from '@sonantica/metadata';

const metadata = await extractMetadata('/media/song.mp3');

console.log(metadata);
// {
//   title: 'Another Brick in the Wall, Pt. 2',
//   artist: 'Pink Floyd',
//   album: 'The Wall',
//   year: 1979,
//   trackNumber: 5,
//   genre: 'Progressive Rock',
//   coverArt: 'data:image/jpeg;base64,...'
// }
```

## Supported Formats

| Format | Tags | Artwork |
|--------|------|---------|
| MP3    | ID3v2.3, ID3v2.4 | ✅ APIC |
| FLAC   | Vorbis Comments | 🚧 Planned |
| M4A    | 🚧 Planned | 🚧 Planned |
| OGG    | 🚧 Planned | 🚧 Planned |

## How It Works

1. Fetches first 256KB of the audio file (range request)
2. Detects format from magic bytes
3. Parses metadata tags
4. Returns structured metadata object

## Philosophy

*"Every file has an intention."*

This package respects the original metadata embedded in audio files, extracting it faithfully without modification or interpretation.

## License

MIT
