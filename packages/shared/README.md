# @sonantica/shared

> "Sound is a form of language."

The bedrock of the Sonántica ecosystem. This package defines the common vocabulary used by all other packages and applications.

## 📖 Responsibility

As the most foundational layer of our architecture, `@sonantica/shared` defines:
- **Core Domain Types**: `Track`, `Album`, `Artist`, `PlaybackState`.
- **Global Constants**: Application names, versioning, and default settings.
- **Fundamental Utilities**: Time formatting, math helpers (clamp, normalize), and ID generation.
- **Contracts**: Base event types used for cross-package communication.

## 🧠 Philosophy

This package follows the **Strict Proximity Rule**: It depends on nothing. It is the purest expression of our architecture, containing no logic that isn't universal to the player.

## 🏗️ Dependency Rule

```text
packages ───▶ shared ───▶ (nothing)
```

By keeping `shared` dependency-free, we ensure that every other part of the system has a stable and lightweight foundation to build upon.

## 🚀 Usage

```typescript
import { PlaybackState, formatTime } from '@sonantica/shared';

const label = formatTime(300); // "5:00"
const currentState = PlaybackState.PLAYING;
```

> "A common pulse for every signal."

## 🛡️ Security & Reliability

Even utility functions must be safe:
- **Storage Quotas**: Storage helpers handle `QuotaExceededError` gracefully and validate store names against an allowlist.
- **Input Truncation**: String formatters (time, artists) enforce max lengths to prevent UI overflow or allocation attacks.
- **Safe Randomness**: ID generation uses `crypto.randomUUID()` instead of `Math.random()` where possible.

> "Foundations must be stronger than what they support."

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Jazz**.
