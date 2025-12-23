# @sonantica/shared

Shared types, utilities, and constants for Sonántica.

## Philosophy

> "Sound is a form of language."

This package contains the fundamental building blocks used across all Sonántica packages. It has no dependencies on other packages.

## What's Inside

- **Types**: Core domain types (`PlaybackState`, `MediaSource`, `PlaybackStatus`, etc.)
- **Constants**: Application constants and supported formats
- **Utils**: Common utility functions (time formatting, validation, etc.)

## Usage

```typescript
import { PlaybackState, formatTime, APP_NAME } from '@sonantica/shared';

const time = formatTime(125.5); // "2:05"
console.log(APP_NAME); // "Sonántica"
```

## Architecture

This package follows the **Dependency Rule**: it depends on nothing else in the monorepo. All other packages can depend on `shared`.

```
shared ───▶ (nothing)
```

## License

Apache-2.0
