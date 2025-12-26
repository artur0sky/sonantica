# @sonantica/recommendations

> "Sound is a form of language—recommendations help discover connections."

An intelligent recommendation engine that analyzes musical relationships through metadata. Designed to help listeners discover without imposing.

## 🧠 Philosophy

Music discovery should feel natural, not algorithmic. This package respects the listener's autonomy by suggesting connections based on what the music itself reveals—its artist, genre, era, and character.

We don't predict. We interpret.

## 📦 Responsibility

This package handles:
- **Similarity Analysis**: Calculates relationships between tracks, albums, and artists.
- **Context-Aware Suggestions**: Recommends based on what's playing, not what's trending.
- **Graceful Metadata Handling**: Works with incomplete information without discrimination.
- **Multiple Perspectives**: Suggests by artist, album, genre, year, or combination.

> "Every file has an intention"—even with partial metadata.

## 🎯 Features

- **Metadata-Based Intelligence**: Analyzes artist, album, genre, and year relationships.
- **No Discrimination**: Missing fields don't penalize—weights normalize to available data.
- **Diversity Control**: Balance between similarity and variety (0.0 = pure similarity, 1.0 = maximum diversity).
- **React Integration**: Hooks ready for immediate UI use.
- **Extensible**: Strategy pattern allows custom algorithms.

## 🛠️ Usage

### React Hooks

```typescript
import { useQueueRecommendations } from '@sonantica/recommendations';

// Dynamic recommendations based on current track
const { 
  trackRecommendations,
  albumRecommendations,
  artistRecommendations 
} = useQueueRecommendations();
```

### Track Recommendations

```typescript
import { useTrackRecommendations } from '@sonantica/recommendations';

const similar = useTrackRecommendations(currentTrack, {
  limit: 10,
  minScore: 0.4,
  diversity: 0.2,
  excludeQueued: true
});
```

### Artist & Album Context

```typescript
import { 
  useArtistSimilarArtists,
  useAlbumSimilarAlbums 
} from '@sonantica/recommendations';

// In artist view
const similarArtists = useArtistSimilarArtists(artist, {
  limit: 8,
  minScore: 0.5
});

// In album view
const similarAlbums = useAlbumSimilarAlbums(album, {
  limit: 6,
  minScore: 0.5
});
```

### Genre & Year

```typescript
import { 
  useGenreRecommendations,
  useYearRecommendations 
} from '@sonantica/recommendations';

const jazzTracks = useGenreRecommendations("Jazz");
const tracks2020 = useYearRecommendations(2020);
```

## 🧮 How It Works

### Similarity Factors

The engine calculates similarity using available metadata:

| Factor | Weight | Method |
| :--- | :---: | :--- |
| **Artist** | 35% | Exact match + Jaccard similarity |
| **Genre** | 25% | Jaccard similarity for multi-genre |
| **Album** | 20% | Exact match |
| **Year** | 10% | Temporal proximity |
| **Future** | 10% | Tempo, Key (when audio analysis available) |

### Graceful Degradation

Missing metadata doesn't penalize similarity:

```typescript
Track A: { artist: "Pink Floyd", genre: "Progressive Rock", year: 1973 }
Track B: { artist: "Pink Floyd" }

// Similarity: 1.0 (perfect match on available field)
// Weights auto-normalize to artist only
```

### Diversity Control

```typescript
{
  diversity: 0.0,  // Pure similarity
  diversity: 0.5,  // Balanced mix
  diversity: 1.0,  // Maximum variety
}
```

## 📐 Options

```typescript
interface RecommendationOptions {
  limit?: number;           // Max results (default: 10)
  minScore?: number;        // Min similarity 0-1 (default: 0.3)
  excludeQueued?: boolean;  // Skip queued tracks (default: false)
  diversity?: number;       // Variety factor 0-1 (default: 0.0)
  weights?: {               // Custom factor weights
    artist?: number;
    album?: number;
    genre?: number;
    year?: number;
  };
}
```

## 🏗️ Architecture

Follows Sonántica's clean architecture:

```
@sonantica/shared (MediaMetadata types)
    ↑
    ├── @sonantica/media-library (Track, Album, Artist)
    │       ↑
    │       └── @sonantica/recommendations
```

- **No metadata package dependency**: Uses shared types only.
- **Strategy pattern**: Extensible recommendation algorithms.
- **Pure functions**: Stateless similarity calculations.
- **React integration**: Hooks with automatic memoization.

## 🔮 Future Enhancements

- Audio analysis integration (tempo, key, mood)
- Collaborative filtering (listening patterns)
- Machine learning models
- External API integration (Last.fm, MusicBrainz)
- Time-of-day awareness
- Listening history analysis

> "Adjust. Listen. Decide."

---

Made with ❤ and **Post-Rock**.
