# Quick Contribution Reference

> "A cheat sheet for joining the orchestra."

This is a quick reference for common contribution scenarios. For full details, see [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## 🚀 Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/sonantica.git
cd sonantica

# 2. Add upstream
git remote add upstream https://github.com/artur0sky/sonantica.git

# 3. Install and build
pnpm install
pnpm build

# 4. Start developing
pnpm dev
```

---

## 🌿 Branch Workflow

### Creating a Feature Branch

```bash
# Always branch from development
git checkout development
git pull upstream development
git checkout -b feature/your-feature-name
```

### Branch Naming

```
feature/add-gapless-playback
fix/eq-preset-loading-bug
refactor/extract-track-item
docs/update-architecture-diagram
```

---

## 💻 Common Tasks

### Running the App

```bash
# Development mode (hot reload)
pnpm dev

# Docker mode (full stack)
docker compose up -d

# Production build
pnpm build
pnpm preview
```

### Code Quality Checks

```bash
# Run all checks
pnpm type-check && pnpm lint && pnpm build

# Auto-fix linting
pnpm lint --fix

# Check specific package
cd packages/player-core
pnpm type-check
```

### Working with Packages

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @sonantica/player-core build

# Watch mode for development
pnpm --filter @sonantica/ui dev
```

---

## 📝 Commit Messages

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Examples

```bash
git commit -m "feat(player-core): add gapless playback support"
git commit -m "fix(dsp): resolve EQ preset loading issue"
git commit -m "docs(contributing): clarify branch workflow"
git commit -m "refactor(ui): extract TrackItem to atomic component"
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `perf` - Performance
- `test` - Tests
- `chore` - Maintenance

---

## 🔄 Syncing Your Fork

```bash
# Fetch upstream changes
git fetch upstream

# Update your local development branch
git checkout development
git merge upstream/development

# Update your feature branch
git checkout feature/your-feature-name
git rebase development
```

---

## 📤 Creating a Pull Request

### Before Submitting

```bash
# 1. Ensure you're up to date
git checkout development
git pull upstream development
git checkout feature/your-feature-name
git rebase development

# 2. Run checks
pnpm type-check
pnpm lint
pnpm build

# 3. Push to your fork
git push origin feature/your-feature-name
```

### On GitHub

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. **Base:** `artur0sky/sonantica` `development`
4. **Compare:** `your-username/sonantica` `feature/your-feature-name`
5. Fill out the PR template
6. Submit!

---

## 🐛 Fixing Issues

### Finding Issues

- [Good First Issues](https://github.com/artur0sky/sonantica/labels/good%20first%20issue)
- [Help Wanted](https://github.com/artur0sky/sonantica/labels/help%20wanted)
- [Bug Reports](https://github.com/artur0sky/sonantica/labels/bug)

### Claiming an Issue

Comment on the issue: "I'd like to work on this!"

### Linking PR to Issue

In your PR description:
```markdown
Closes #123
```

---

## 🏗️ Architecture Quick Reference

### Package Structure

```
packages/
├── player-core/     # Audio engine (UI-agnostic)
├── dsp/            # Audio processing
├── media-library/  # Client-side library manager
├── ui/             # React components
├── shared/         # Types and utilities
└── ...
```

### Dependency Rules

```
✅ apps → packages
✅ packages → shared
❌ packages → apps
❌ packages → packages (use shared)
```

### Import Examples

```typescript
// ✅ GOOD
import { Track } from '@sonantica/shared';
import { PlayerEngine } from '@sonantica/player-core';

// ❌ BAD
import { Track } from '../../shared/types';
import { SomeComponent } from '../../../apps/web/components';
```

---

## 🎨 UI Component Guidelines

### Atomic Design Structure

```
ui/src/components/
├── atoms/       # Button, Icon, Input
├── molecules/   # SearchBar, VolumeControl
├── organisms/   # TrackList, PlayerControls
└── templates/   # PageLayout
```

### Creating a Component

```tsx
// packages/ui/src/components/atoms/Button.tsx
import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary'
}) => {
  return (
    <button
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
};
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

```typescript
// packages/player-core/src/__tests__/PlayerEngine.test.ts
import { describe, it, expect } from 'vitest';
import { PlayerEngine } from '../PlayerEngine';

describe('PlayerEngine', () => {
  it('should initialize with stopped state', () => {
    const engine = new PlayerEngine();
    expect(engine.getState()).toBe('stopped');
  });
});
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Rebuild after changes
docker compose up --build

# Stop services
docker compose down

# Clean everything
docker compose down -v
```

---

## 🆘 Common Issues

### "Module not found"
```bash
pnpm install
pnpm build
```

### "Type errors in packages"
```bash
# Build packages in order
pnpm build
```

### "Port already in use"
```bash
# Kill process on port 3000
npx kill-port 3000
```

### "Docker build fails"
```bash
docker compose down -v
docker compose build --no-cache
```

---

## 📚 Key Documents

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Full contribution guide
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
- [IDENTITY.md](../docs/IDENTITY.md) - Brand philosophy
- [ROADMAP.md](../docs/ROADMAP.md) - Feature roadmap
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) - Community guidelines

---

## 💬 Getting Help

- **GitHub Discussions:** Ask questions
- **GitHub Issues:** Report bugs or request features
- **Documentation:** Check the `/docs` folder

---

## ✅ Pre-Submission Checklist

Before submitting a PR:

- [ ] Code follows style guidelines
- [ ] All checks pass (`type-check`, `lint`, `build`)
- [ ] Tested locally and in Docker
- [ ] Commits follow conventional format
- [ ] PR targets `development` branch
- [ ] PR template filled out completely
- [ ] Documentation updated if needed

---

> "Every contribution, no matter how small, makes Sonántica better."

Happy coding! 🎵
