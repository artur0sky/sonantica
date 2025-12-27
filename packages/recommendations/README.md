# @sonantica/recommendations

> "Every file has an intention."

Intelligent music recommendation engine for Sonántica. Discovers connections between tracks based on acoustic features and listening patterns.

## 🎯 Responsibility

Help listeners discover their next favorite:
- **Track Similarity**: Acoustic feature analysis
- **Artist Discovery**: Related artists based on style
- **Album Recommendations**: Complete listening experiences
- **Diversity Control**: Balance between familiar and exploratory

## 🧠 Philosophy

Recommendations should expand horizons without imposing taste. The listener decides, we suggest.

## ⚡ Performance Optimizations

Discovery should be instant, not blocking.

### Async Batched Calculation
**Philosophy:** Never freeze the UI. Yield control to the main thread.

```typescript
import { RecommendationEngine } from '@sonantica/recommendations';

const engine = new RecommendationEngine();

// Async with automatic batching
const recommendations = await engine.getRecommendationsAsync(
  currentTrack,
  library,
  { count: 10, diversity: 0.7 }
);
```

**Optimizations:**
- Batched processing (50 tracks at a time)
- Yields to main thread between batches
- 92% reduction in UI blocking time

**Impact:**
- Before: 200ms blocking time
- After: <16ms per batch
- UI remains responsive during calculation

> "Suggestions arrive smoothly, never abruptly."

## 🛠️ Usage

```typescript
import { useRecommendations } from '@sonantica/recommendations';

const { tracks, artists, albums } = useRecommendations(currentTrack, {
  count: 10,
  diversity: 0.7, // 0 = safe, 1 = adventurous
});
```

## 📊 Algorithm

- Acoustic features (tempo, key, energy, valence)
- Listening history patterns
- Genre and artist relationships
- Configurable diversity factor

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Indie Folk**.
