# @sonantica/lyrics

> "Sound is a form of language."

A dedicated package for extracting, parsing, and synchronizing lyrics from audio files. Designed to treat lyrics as an integral part of the listening experience.

## 📖 Responsibility

In Sonántica, we believe that lyrics are not mere text—they are the verbal expression of the artist's intention. This package:
- Extracts **embedded lyrics** from ID3v2 (MP3) and Vorbis Comments (FLAC/OGG).
- Parses **LRC format** for synchronized lyrics with millisecond precision.
- Provides **synchronization tools** to align text with playback time.
- Detects and handles both synchronized and unsynchronized lyrics automatically.

## 🧠 Philosophy

Following the **"Sound is language"** principle, lyrics deserve the same technical respect as audio signal. This package provides transparent, extensible tools for users who value the complete artistic message.

## 📦 What's Inside

- **LyricsExtractor**: Extracts lyrics from audio file metadata tags.
- **LRCParser**: Parses and serializes LRC (synchronized lyrics) format.
- **LyricsSynchronizer**: Tools for creating and manipulating synchronized lyrics.

## 🛠️ Usage

```typescript
import { LyricsExtractor, LRCParser } from '@sonantica/lyrics';

// Extract from metadata tags
const lyrics = LyricsExtractor.extractFromTags(tags);

// Parse LRC format
const lrcText = '[00:12.00]First line\n[00:17.20]Second line';
const lines = LRCParser.parse(lrcText);

// Get current line during playback
const currentLine = LRCParser.getCurrentLine(lines, currentTimeMs);
```

## 📐 Supported Formats

| Source | Format | Synchronized | Unsynchronized |
| :--- | :--- | :---: | :---: |
| **ID3v2** | USLT / SYLT | ✅ | ✅ |
| **Vorbis** | LYRICS / SYNCEDLYRICS | ✅ | ✅ |
| **LRC** | Embedded or External | ✅ | — |

> "Every word has its moment."

---

Made with ❤ and **Ballads**.
