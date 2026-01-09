# Contributing to Sonántica

> "Like a violinist joining an orchestra, every contribution must follow the rhythm."

Welcome to Sonántica. We're grateful you want to contribute to this open-source multimedia player. This guide will help you understand how to make meaningful contributions that harmonize with our existing codebase.

---

## 🎼 The Orchestra Metaphor

Think of Sonántica as an orchestra:
- **The Conductor (Maintainer):** @artur0sky reviews and approves all contributions
- **The Score (Architecture):** Our [ARCHITECTURE.md](./docs/ARCHITECTURE.md) defines the structure
- **The Musicians (Contributors):** You bring your unique skills and ideas
- **The Performance (Code):** Every contribution must be in sync with the ensemble

Just as a violinist doesn't improvise during a classical performance, contributors must follow our established patterns. But like jazz, we welcome creative solutions within our framework.

---

## 🎵 Core Philosophy

Before contributing, understand our values (detailed in [IDENTITY.md](./docs/IDENTITY.md)):

1. **Respect for sound** - Audio fidelity is paramount
2. **User autonomy** - Users decide, software facilitates
3. **Technical transparency** - Clear, maintainable code
4. **Intentional minimalism** - No unnecessary complexity
5. **Shared knowledge** - Open-source collaboration

**Guiding Question:**
> Does this contribution help users listen better, understand better, or decide better?

---

## 🎹 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Docker** & **Docker Compose** (for full stack development)
- **Git** with proper configuration

### Initial Setup

```bash
# 1. Fork the repository on GitHub
# Click "Fork" at https://github.com/artur0sky/sonantica

# 2. Clone YOUR fork
git clone https://github.com/YOUR_USERNAME/sonantica.git
cd sonantica

# 3. Add upstream remote
git remote add upstream https://github.com/artur0sky/sonantica.git

# 4. Install dependencies
pnpm install

# 5. Build packages
pnpm build

# 6. Start development environment
pnpm dev
```

### Docker Development Setup

For full-stack development with backend services:

```bash
# Start all services (PostgreSQL, Redis, Go Core, Python Worker)
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

See [DOCKER.md](./docs/DOCKER.md) for detailed deployment instructions.

---

## 🎺 Contribution Workflow (The "Remix" Process)

### Branch Strategy

All contributions follow this strict flow:

```
your_feature_branch → development → qa → main
```

**Branch Naming Convention:**
```
feature/your-feature-name    # New features
fix/bug-description          # Bug fixes
refactor/component-name      # Code improvements
docs/documentation-update    # Documentation changes
```

### Step-by-Step Process

#### 1. Sync with Upstream

```bash
# Always start from the latest development branch
git checkout development
git pull upstream development
```

#### 2. Create Your Feature Branch

```bash
# Branch from development
git checkout -b feature/your-feature-name
```

#### 3. Make Your Changes

Follow our [Architecture Principles](#-architectural-principles) and [Code Standards](#-code-quality-standards).

#### 4. Test Thoroughly

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Build all packages
pnpm build

# Test in Docker (recommended)
docker compose up --build
```

#### 5. Commit with Meaningful Messages

We follow **Conventional Commits**:

```bash
# Format: <type>(<scope>): <description>

git commit -m "feat(player-core): add gapless playback support"
git commit -m "fix(dsp): resolve EQ preset loading issue"
git commit -m "docs(contributing): clarify branch workflow"
git commit -m "refactor(ui): extract TrackItem to atomic component"
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks

**Scopes:** Use package names (`player-core`, `dsp`, `ui`, `media-library`, etc.)

#### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

#### 7. Create Pull Request

1. Go to **your fork** on GitHub
2. Click **"Compare & pull request"**
3. **Base repository:** `artur0sky/sonantica`
4. **Base branch:** `development` (NOT `main`)
5. Fill out the PR template (see below)

---

## 📝 Pull Request Guidelines

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Closes #123 (if applicable)

## Testing
- [ ] Tested locally with `pnpm dev`
- [ ] Tested in Docker environment
- [ ] No TypeScript errors (`pnpm type-check`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)

## Architectural Compliance
- [ ] Follows SOLID principles
- [ ] Respects package boundaries (no `packages/*` → `apps/*`)
- [ ] Uses contracts/interfaces for communication
- [ ] Maintains separation of concerns

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] My changes generate no new warnings
- [ ] I have updated documentation if needed
```

### Review Process

1. **Automated Checks:** CI/CD runs tests and builds
2. **Code Review:** @artur0sky reviews your PR
3. **Feedback:** Address any requested changes
4. **Approval:** Once approved, your PR merges to `development`
5. **QA Testing:** Changes are tested in `qa` branch
6. **Production:** After QA approval, changes merge to `main`

**Note:** Only @artur0sky can approve and merge PRs. This ensures architectural consistency.

---

## 🏗️ Architectural Principles

### Non-Negotiable Rules

1. **Packages don't know apps**
   - Never import from `apps/*` in `packages/*`
   
2. **Apps never implement domain logic**
   - Business logic belongs in packages
   
3. **Communication by contract**
   - Use interfaces and types from `@sonantica/shared`
   
4. **Core runs without UI**
   - `player-core` must be UI-agnostic
   
5. **No relative imports between packages**
   - Use package names: `@sonantica/shared`

### Dependency Graph

```text
apps ───▶ packages
packages ───▶ shared
shared ───▶ (nothing)
```

**Prohibited:**
- ❌ `packages/*` → `apps/*`
- ❌ Circular dependencies
- ❌ Global singletons across layers

### Package Responsibilities

| Package | Responsibility | Prohibited |
|---------|---------------|------------|
| `player-core` | Audio playback, state, buffering | UI, frameworks, platform APIs |
| `dsp` | EQ, filters, signal processing | Direct audio element access |
| `media-library` | Indexing, metadata, organization | Playback logic |
| `ui` | Components, themes, layouts | Business logic, API calls |
| `apps/*` | Wiring, navigation, platform integration | Domain logic |

---

## 🎨 Code Quality Standards

### SOLID Principles

1. **S - Single Responsibility:** One module, one reason to change
2. **O - Open/Closed:** Open for extension, closed for modification
3. **L - Liskov Substitution:** Implementations must be interchangeable
4. **I - Interface Segregation:** Small, specific contracts
5. **D - Dependency Inversion:** Depend on abstractions, not concretions

### Clean Code Practices

```typescript
// ✅ GOOD: Clear, single responsibility
export class TrackMetadataExtractor {
  extract(file: File): Promise<TrackMetadata> {
    // ...
  }
}

// ❌ BAD: Multiple responsibilities
export class MusicManager {
  extract(file: File) { /* ... */ }
  play(track: Track) { /* ... */ }
  updateUI() { /* ... */ }
}
```

### DRY (Don't Repeat Yourself)

- Logic exists **once** in `core`
- UI components are **reusable** in `ui`
- Common utilities in `shared`

### TypeScript Standards

```typescript
// ✅ GOOD: Explicit types
interface PlaybackConfig {
  volume: number;
  loop: boolean;
  shuffle: boolean;
}

function configurePlayback(config: PlaybackConfig): void {
  // ...
}

// ❌ BAD: Implicit any
function configurePlayback(config) {
  // ...
}
```

### Naming Conventions

- **Files:** `PascalCase.tsx` for components, `camelCase.ts` for utilities
- **Components:** `PascalCase` (e.g., `TrackItem`, `PlayerControls`)
- **Functions:** `camelCase` (e.g., `extractMetadata`, `calculateDuration`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_BUFFER_SIZE`)
- **Interfaces:** `IPascalCase` (e.g., `IPlayerEngine`, `IDSPConfig`)

---

## 🎭 UI/UX Guidelines

### Acoustic Aesthetics

Our design philosophy (from [IDENTITY.md](./docs/IDENTITY.md)):

- **Clean, quiet, without visual distractions**
- **Conservative defaults** (flat, neutral)
- **Advanced features accessible, not intrusive**
- **Subtle, functional animations**

### Component Structure (Atomic Design)

```
ui/
├── atoms/          # Basic building blocks (Button, Icon)
├── molecules/      # Simple combinations (SearchBar, VolumeControl)
├── organisms/      # Complex components (TrackList, PlayerControls)
└── templates/      # Page layouts
```

### Example: Creating a New Component

```tsx
// packages/ui/src/components/atoms/PlayButton.tsx
import React from 'react';
import { IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';

interface PlayButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
  size?: number;
}

export const PlayButton: React.FC<PlayButtonProps> = ({
  isPlaying,
  onToggle,
  size = 24
}) => {
  return (
    <button
      onClick={onToggle}
      className="play-button"
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      {isPlaying ? (
        <IconPlayerPause size={size} />
      ) : (
        <IconPlayerPlay size={size} />
      )}
    </button>
  );
};
```

---

## 🧪 Testing Guidelines

### What to Test

1. **Core Logic:** All business logic in `packages/*`
2. **Edge Cases:** Empty states, errors, boundary conditions
3. **Integration:** Package interactions
4. **Performance:** Large libraries (10,000+ tracks)

### Testing Stack

- **Unit Tests:** Vitest
- **Component Tests:** React Testing Library
- **E2E Tests:** Playwright (coming soon)

### Example Test

```typescript
// packages/player-core/src/__tests__/PlayerEngine.test.ts
import { describe, it, expect } from 'vitest';
import { PlayerEngine } from '../PlayerEngine';

describe('PlayerEngine', () => {
  it('should initialize with stopped state', () => {
    const engine = new PlayerEngine();
    expect(engine.getState()).toBe('stopped');
  });

  it('should transition to playing state when play is called', async () => {
    const engine = new PlayerEngine();
    await engine.load({ url: 'test.mp3' });
    await engine.play();
    expect(engine.getState()).toBe('playing');
  });
});
```

---

## 📚 Documentation Standards

### Code Comments

```typescript
/**
 * Extracts metadata from an audio file using multiple parsers.
 * 
 * Supports ID3v2, Vorbis Comments, and FLAC tags.
 * Falls back to filename parsing if metadata is unavailable.
 * 
 * @param file - The audio file to analyze
 * @returns Promise resolving to extracted metadata
 * @throws {MetadataError} If file is corrupted or unsupported
 */
export async function extractMetadata(file: File): Promise<TrackMetadata> {
  // Implementation
}
```

### README Updates

When adding a new package or feature, update:
1. Package `README.md`
2. Root `README.md` (if user-facing)
3. `docs/ARCHITECTURE.md` (if architectural change)

---

## 🐛 Bug Reports

### Before Reporting

1. Search existing issues
2. Test on latest `development` branch
3. Verify it's not a configuration issue

### Bug Report Template

```markdown
**Describe the bug**
Clear description of what's wrong.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen instead.

**Environment:**
- OS: [e.g., Windows 11, macOS 14]
- Browser: [e.g., Chrome 120, Firefox 121]
- Sonántica Version: [e.g., 1.0.0]

**Additional context**
Screenshots, logs, or other relevant information.
```

---

## 💡 Feature Requests

### Before Requesting

1. Check [ROADMAP.md](./docs/ROADMAP.md) - it might be planned
2. Search existing feature requests
3. Consider if it aligns with our [philosophy](#-core-philosophy)

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other approaches you've thought about.

**How does this align with Sonántica's philosophy?**
Explain how it respects sound, user autonomy, or transparency.

**Additional context**
Mockups, examples, or references.
```

---

## 🎼 Forking & Remixing

### Creating Your Own "Remix"

Sonántica is open-source under **Apache-2.0**. You're free to fork and create your own version:

```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR_USERNAME/sonantica.git
cd sonantica

# Rename the project
# Update package.json, README.md, etc.

# Make it your own!
```

**Requirements:**
1. Maintain Apache-2.0 license
2. Credit original project
3. Don't use "Sonántica" trademark for your fork

**We encourage remixes!** Just like music, software thrives on reinterpretation.

---

## 🚀 Release Process

### Versioning

We follow **Semantic Versioning** (SemVer):

- `MAJOR.MINOR.PATCH` (e.g., `1.4.2`)
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes

### Release Cycle

1. **Development:** Active work in `development` branch
2. **QA:** Tested in `qa` branch
3. **Release Candidate:** Tagged as `v1.x.x-rc.1`
4. **Production:** Merged to `main`, tagged as `v1.x.x`

---

## 🎯 Priority Areas for Contribution

Looking to contribute but not sure where? Check these high-priority areas:

### Phase 1 - Core (MVP)
- [ ] Stable playback engine improvements
- [ ] Additional codec support (Opus, ALAC)
- [ ] Performance optimizations

### Phase 2 - Library
- [ ] Enhanced search functionality
- [ ] Smart playlist rules
- [ ] External metadata API integrations

### Phase 3 - Pro Audio
- [ ] Advanced EQ presets
- [ ] ReplayGain implementation
- [ ] Gapless playback refinements

### Phase 4 - Advanced UX
- [ ] Theme engine development
- [ ] Plugin system architecture
- [ ] Synced lyrics support

See [ROADMAP.md](./docs/ROADMAP.md) for complete feature list.

---

## 🤝 Community Guidelines

### Code of Conduct

- **Be respectful:** Treat all contributors with dignity
- **Be constructive:** Offer solutions, not just criticism
- **Be patient:** We're all learning
- **Be transparent:** Communicate openly about challenges

### Communication Channels

- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** Questions and ideas
- **Pull Requests:** Code contributions

---

## 📜 Legal

### Contributor License Agreement (CLA)

By contributing, you agree that:

1. You have the right to submit your contribution
2. Your contribution is licensed under Apache-2.0
3. You grant the project maintainers rights to use your contribution

### Attribution

All contributors are recognized in:
- `CONTRIBUTORS.md` (automatically generated)
- GitHub's contributor graph
- Release notes for significant contributions

---

## 🎵 Final Notes

> "Fidelity is not a destination, but a promise."

Thank you for contributing to Sonántica. Every line of code, every bug report, every documentation improvement helps us build a better listening experience.

Remember:
- **Follow the rhythm** (our architecture and standards)
- **Play your part** (contribute within your expertise)
- **Listen to the conductor** (respect maintainer decisions)
- **Enjoy the performance** (have fun coding!)

---

**Questions?** Open a GitHub Discussion or reach out to @artur0sky.

**Ready to contribute?** Start with a [good first issue](https://github.com/artur0sky/sonantica/labels/good%20first%20issue).

---

Made with ❤️ and **Progressive Rock**.
