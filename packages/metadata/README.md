# @sonantica/metadata

> "Every file has an intention."

A lightweight, dedicated package for extracting the hidden intention (metadata) within audio files. Designed for speed and technical transparency.

## 🧬 Responsibility

In modern audio, metadata is often as important as the signal itself. This package:
- Reads **ID3v2** (MP3) and **Vorbis Comments** (FLAC/OGG) tags.
- Identifies file containers by magic bytes.
- Extracts high-resolution **Cover Art** directly from the binary data.
- Optimized for the web using **HTTP Range Requests** to read only the necessary headers.

## 🧠 Philosophy

We believe in **Technical Transparency**. This package doesn't invent metadata; it faithfully uncovers what the artist and engineers embedded in the file.

## 📦 Features

- **Format Detection**: Support for MP3, FLAC, and more.
- **Zero External Dependencies**: Focused, lightweight binary parsing.
- **Browser & Node compatible**: Optimized for range fetching.

## 🛡️ Security & Reliability

Parsing external binary data represents a significant attack surface. We handle it with "Wise Craftsman" precision:
- **Buffer Overflow Protection**: Rigorous bounds checking on all array buffers and offsets during ID3 and FLAC parsing.
- **Integer Overflow Prevention**: Safe arithmetic for all frame sizes and synchsafe integer calculations.
- **DoS Safeguards**: Limits on frame counts, block sizes, and loop iterations to prevent memory exhaustion attacks.
- **Robustness**: Infinite loops and zero-byte reads are strictly prevented through validation layers.

## 🛠️ Usage

```typescript
import { extractMetadata } from '@sonantica/metadata';

const trackInfo = await extractMetadata('https://server.com/music.flac');
console.log(trackInfo.title, trackInfo.artist);
```

## 📐 Supported Formats

| Format | Tag Type | Cover Art |
| :--- | :--- | :---: |
| **MP3** | ID3v2.3 / ID3v2.4 | ✅ |
| **FLAC** | Vorbis Comments | ✅ |
| **OGG** | Vorbis Comments | 🚧 |
| **M4A** | Atoms | 🚧 |

> "The truth hidden in the headers."

---

Made with ❤ and **Grunge**.
