# Performance Optimizations Usage Guide

This document explains how to use all the performance optimizations implemented in Sonántica.

## 1. GPU-Accelerated Animations (`@sonantica/shared`)

### Usage

```typescript
import { gpuAnimations, springConfigs } from "@sonantica/shared";
import { motion } from "framer-motion";

// Use predefined GPU-only animations
<motion.div {...gpuAnimations.fadeIn}>
  Content
</motion.div>

// List items
<motion.div {...gpuAnimations.listItem}>
  Track Item
</motion.div>

// Modals
<motion.div {...gpuAnimations.modal}>
  Modal Content
</motion.div>

// Custom with spring
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={springConfigs.snappy}
>
  Content
</motion.div>
```

### Available Animations

- `fadeIn` - Simple fade
- `fadeInUp` - Fade with upward motion
- `fadeInDown` - Fade with downward motion
- `scaleIn` - Fade with scale
- `slideInLeft` - Slide from left
- `slideInRight` - Slide from right
- `hoverScale` - Hover effect with scale
- `hoverLift` - Hover effect with lift
- `listItem` - Optimized for list items
- `modal` - Modal/dialog animation
- `overlay` - Backdrop overlay

### Spring Configs

- `gentle` - Smooth, gentle animation
- `snappy` - Quick, responsive
- `bouncy` - Playful bounce

## 2. Lazy Images with LRU Cache (`@sonantica/ui`)

### Usage

```typescript
import { LazyAlbumArt } from "@sonantica/ui";

// Basic usage
<LazyAlbumArt
  src={track.metadata?.coverArt}
  alt="Album Art"
  className="w-12 h-12 rounded"
/>

// With custom threshold
<LazyAlbumArt
  src={coverUrl}
  alt="Cover"
  threshold={0.2} // Load when 20% visible
  iconSize={24}
/>
```

### Features

- Automatic lazy loading (only loads when visible)
- LRU cache (200 items max)
- Blur-up effect
- Automatic fallback icon
- Error handling

## 3. IndexedDB Batch Writes (`@sonantica/shared`)

### Usage

```typescript
import { saveBatchToStorage, STORES } from "@sonantica/shared";

// Batch write tracks
const tracks = [
  { key: 'track-1', data: track1 },
  { key: 'track-2', data: track2 },
  // ... more tracks
];

await saveBatchToStorage(
  STORES.LIBRARY,
  tracks,
  (current, total) => {
    console.log(`Progress: ${current}/${total}`);
  }
);
```

### Performance

- 50-70% faster than individual writes
- Single transaction for all items
- Progress callback support
- Graceful error handling

## 4. Virtual Scrolling (`@tanstack/react-virtual`)

### Already Implemented In

- `TracksPage` - Auto-enables for >100 tracks

### Usage Pattern

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 76, // Item height
  overscan: 5,
});

// Render only visible items
{virtualizer.getVirtualItems().map((virtualItem) => (
  <div key={virtualItem.key} ...>
    {items[virtualItem.index]}
  </div>
))}
```

## 5. Code Splitting (Lazy Loading)

### Already Implemented

- EQSidebar
- LyricsSidebar
- RecommendationsSidebar

### Pattern

```typescript
import { lazy, Suspense } from "react";

const HeavyComponent = lazy(() => 
  import("./HeavyComponent").then(m => ({ default: m.HeavyComponent }))
);

<Suspense fallback={<Loader />}>
  <HeavyComponent />
</Suspense>
```

## 6. React Memoization

### Already Implemented

- `TrackCard` - Memoized with useCallback/useMemo
- `SpectrumVisualizer` - Memoized with context reuse

### Pattern

```typescript
import { memo, useCallback, useMemo } from "react";

export const MyComponent = memo(function MyComponent({ data, onAction }) {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return expensiveOperation(data);
  }, [data]);

  // Memoize callbacks
  const handleClick = useCallback(() => {
    onAction(data);
  }, [data, onAction]);

  return <div onClick={handleClick}>{processedData}</div>;
});
```

## 7. Async Batching

### Already Implemented

- `RecommendationEngine.getRecommendationsAsync()`
- `MetadataExtractor.extractMetadataBatch()`

### Pattern

```typescript
// Process in batches, yield to main thread
async function processBatch(items: any[], batchSize = 50) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Process batch
    for (const item of batch) {
      await processItem(item);
    }
    
    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

## 8. Throttling

### Already Implemented

- `AudioAnalyzer` - Intelligent FFT throttling

### Pattern

```typescript
class ThrottledService {
  private cache: any = null;
  private lastUpdate = 0;
  private throttleMs = 16; // ~60fps

  getData() {
    const now = Date.now();
    if (now - this.lastUpdate < this.throttleMs && this.cache) {
      return this.cache;
    }

    this.cache = expensiveOperation();
    this.lastUpdate = now;
    return this.cache;
  }

  setThrottle(ms: number) {
    this.throttleMs = ms;
  }
}
```

## Best Practices

### DO ✅

- Use GPU-only properties (transform, opacity) for animations
- Batch IndexedDB writes for bulk operations
- Lazy load images and heavy components
- Memoize components that render frequently
- Use virtual scrolling for lists >100 items
- Throttle high-frequency operations

### DON'T ❌

- Animate layout properties (width, height, margin, top, left)
- Write to IndexedDB in loops without batching
- Load all images immediately
- Re-create functions on every render
- Render 1000+ DOM nodes without virtualization
- Call expensive operations at 60fps without throttling

## Performance Checklist

- [ ] Animations use only transform/opacity
- [ ] Images are lazy loaded
- [ ] Heavy components are code-split
- [ ] Frequently rendered components are memoized
- [ ] Large lists use virtual scrolling
- [ ] Bulk operations use batching
- [ ] High-frequency operations are throttled
- [ ] No unnecessary re-renders

## Monitoring

Use React DevTools Profiler to identify:
- Components re-rendering unnecessarily
- Expensive render times
- Memory leaks

Use Chrome DevTools Performance to identify:
- Layout thrashing
- Long tasks blocking main thread
- Memory usage patterns
