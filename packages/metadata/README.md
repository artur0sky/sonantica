# @sonantica/metadata

> "Sound deserves respect."

Professional metadata extraction and management for Sonántica. Reads tags from audio files with precision and care.

## 📖 Responsibility

Understand the intention of every file:
- **Tag Reading**: ID3, Vorbis Comments, FLAC tags
- **Cover Art Extraction**: Embedded and external artwork
- **Format Detection**: Codec and quality information
- **Batch Processing**: Efficient library scanning

## 🧠 Philosophy

Metadata is the bridge between the file and the listener. It must be accurate, complete, and respectful of the artist's intent.

## ⚡ Performance Optimizations

Large libraries deserve fast scans.

### Batched Extraction
**Philosophy:** Process in groups. Yield between batches.

```typescript
import { MetadataExtractor } from '@sonantica/metadata';

const extractor = new MetadataExtractor();

// Batch processing with progress
await extractor.extractMetadataBatch(
  urls,
  { batchSize: 5 },
  (current, total) => {
    console.log(`Processing: ${current}/${total}`);
  }
);
```

**Optimizations:**
- Processes 5 files at a time (configurable)
- Yields to main thread between batches
- UI remains responsive during large scans

**Impact:**
- Smooth progress updates
- No UI freezing
- Cancellable operations

> "Patience with large collections, speed with small ones."

## 🛠️ Usage

```typescript
import { extractMetadata } from '@sonantica/metadata';

const metadata = await extractMetadata(audioUrl);

// Returns: title, artist, album, year, genre, coverArt, etc.
```

## 🎵 Supported Formats

- **ID3**: MP3 tags (v1, v2.3, v2.4)
- **Vorbis Comments**: OGG, FLAC, Opus
- **iTunes**: M4A, ALAC metadata
- **Cover Art**: Embedded and folder.jpg

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Progressive Rock**.
