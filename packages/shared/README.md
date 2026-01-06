# @sonantica/shared

> "Sound is a form of language."

The bedrock of the Sonántica ecosystem. This package defines the common vocabulary used by all other packages and applications.

## 📖 Responsibility

As the most foundational layer of our architecture, `@sonantica/shared` defines:
- **Core Domain Types**: `Track`, `Album`, `Artist`, `PlaybackState`, `OfflineStatus`.
- **Global Constants**: Application names, versioning, and default settings.
- **Fundamental Utilities**: Time formatting, math helpers (clamp, normalize), and stable ID generation.
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

## ⚡ Performance Optimizations

Sonántica respects your resources. Every millisecond matters when the goal is uninterrupted listening.

### GPU-Accelerated Animations
**Philosophy:** Smooth motion without stealing cycles from audio.

```typescript
import { gpuAnimations } from '@sonantica/shared';

// All animations use only transform and opacity
// No layout thrashing. No frame drops.
<motion.div {...gpuAnimations.fadeIn}>
  Content
</motion.div>
```

**Available Variants:**
- `fadeIn`, `fadeInUp`, `fadeInDown` - Gentle transitions
- `scaleIn` - Zoom with grace
- `slideInLeft`, `slideInRight` - Directional motion
- `listItem` - Optimized for repeated elements
- `modal`, `overlay` - Dialog animations

> "Motion should enhance, not distract."

### IndexedDB Batch Writes
**Philosophy:** Respect the user's time. Large libraries deserve fast saves.

```typescript
import { saveBatchToStorage, STORES } from '@sonantica/shared';

// 50-70% faster than individual writes
await saveBatchToStorage(
  STORES.LIBRARY,
  tracks.map(t => ({ key: t.id, data: t })),
  (current, total) => console.log(`${current}/${total}`)
);
```

**Impact:**
- Single transaction for all writes
- Progress callbacks for transparency
- Graceful error handling per item
- 50-70% faster for libraries >1000 tracks

> "Speed is a feature when it serves the listener."

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
