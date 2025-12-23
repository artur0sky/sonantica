# Sonántica

> "Respect the intention of the sound and the freedom of the listener."

An audio-first, open-source multimedia player built with clean architecture principles.

## 🎵 Philosophy

Sonántica is not just a player. It is a **sound interpreter**.

- **Audio-first**: Playback is the core, UI is a consequence
- **User autonomy**: Granular control, custom themes, extensibility
- **Technical transparency**: Open standards, clear architecture
- **Intentional minimalism**: Clean, quiet, without distractions
- **Shared knowledge**: Open-source, educational

Read more in [docs/IDENTITY.md](./docs/IDENTITY.md)

## 🏗️ Architecture

This is a **monorepo** structured for clean separation of concerns:

```
sonantica/
├─ apps/
│  └─ web/              # React PWA (main app)
│
├─ packages/
│  ├─ player-core/      # Audio engine (UI-agnostic)
│  ├─ shared/           # Common types & utilities
│  ├─ dsp/              # Audio processing (future)
│  ├─ media-library/    # Metadata & indexing (future)
│  └─ ui/               # Shared components (future)
│
└─ docs/
   ├─ ARCHITECTURE.md   # Technical architecture
   ├─ IDENTITY.md       # Brand & philosophy
   └─ ROADMAP.md        # Feature roadmap
```

### Dependency Rules

```
apps ───▶ packages
packages ───▶ shared
shared ───▶ (nothing)
```

- **Packages don't know apps**
- **Apps never implement domain logic**
- **All communication is by contract**
- **The core can run without a UI**

Read more in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run web app in development
pnpm dev
```

### Project Structure

Each package is independent:

```bash
# Build a specific package
pnpm --filter @sonantica/player-core build

# Run tests for all packages
pnpm test
```

## 📦 Packages

### [@sonantica/shared](./packages/shared)
Common types, utilities, and constants. No dependencies.

### [@sonantica/player-core](./packages/player-core)
Core audio playback engine. Platform-agnostic, UI-agnostic.

### [@sonantica/web](./apps/web)
React PWA - the main web application.

## 🎯 Current Status

This is a **"Hello World"** implementation demonstrating the architecture:

✅ Monorepo structure with pnpm workspaces  
✅ Shared types and utilities  
✅ Core audio engine (basic playback)  
✅ Web app with React  
✅ Event-based communication  
✅ Clean architecture boundaries  

See [docs/ROADMAP.md](./docs/ROADMAP.md) for the full feature roadmap.

## 🧪 Try It Out

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Open http://localhost:5173

3. Click "Load Demo Track" to load a sample audio file

4. Use the playback controls to test the player

5. Open the browser console to see player events

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md) - Technical design and principles
- [Identity](./docs/IDENTITY.md) - Brand philosophy and voice
- [Roadmap](./docs/ROADMAP.md) - Feature planning and progress

## 🤝 Contributing

This project follows strict architectural principles. Before contributing:

1. Read [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
2. Read [docs/IDENTITY.md](./docs/IDENTITY.md)
3. Ensure your changes respect the dependency rules
4. Ask: "Does this improve the user's actual listening experience?"

## 📄 License

Apache-2.0 - See [LICENSE](./LICENSE)

## 🎼 Manifesto

> Sonántica believes that listening is not passive.
> 
> That sound is not noise, but language.
> 
> We don't optimize to attract attention,
> but to preserve intention.
> 
> Because when the audio is honest,
> the listener is too.

---

**"Every file has an intention."**
