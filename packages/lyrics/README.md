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

## 🛡️ Security & Reliability

Parsing external text files and regex operations carries risks. We mitigate them with strict bounds:
- **ReDoS Protection**: Timestamp parsing regexes are strictly bounded and state-managed to prevent catastrophic backtracking.
- **Resource Limits**: Max LRC size (1MB) and line count (5000) caps prevent memory exhaustion from malicious files.
- **Input Sanitization**: Control characters and null bytes are stripped during parsing and serialization.
- **Loop Guards**: Synchronization logic includes iteration limits to prevent infinite loops during merge operations.

- **Loop Guards**: Synchronization logic includes iteration limits to prevent infinite loops during merge operations.

## ⚡ Performance Optimizations

Syncing text with audio requires millisecond precision without CPU overhead.

### Optimized Parsing
**Philosophy:** Text processing should never stall the main thread.

```typescript
// Single pass parsing, zero recursion
const lines = LRCParser.parse(lrcText); 
// <1ms for standard songs
```

**Optimizations:**
- **Single-Pass Parser**: LRC files parsed in O(n) time.
- **Binary Search**: Current line lookups use binary search O(log n) for instant retrieval.
- **Lazy Formatting**: Time stamps formatted only when displayed.

**Impact:**
- Negligible CPU usage during playback.
- Instant seek synchronization.

> "Timing is everything."

> "Every word has its moment."

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Ballads**.
