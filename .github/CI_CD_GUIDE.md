# GitHub Actions CI/CD Configuration Guide

> "Automated quality checks ensure every note is in tune."

This document explains the CI/CD pipeline for Sonántica. While the actual workflow files will be created as the project matures, this guide establishes the expected checks and processes.

---

## 🎯 CI/CD Philosophy

Following Sonántica's values of **technical transparency** and **quality**, all contributions must pass automated checks before review.

### Core Principles

1. **Fast Feedback:** Developers know within minutes if their code passes
2. **Consistent Quality:** Same checks run locally and in CI
3. **Security First:** Automated security scanning
4. **No Surprises:** All checks are documented and reproducible

---

## 🔍 Automated Checks

### On Every Pull Request

#### 1. **Type Checking**
```bash
pnpm type-check
```
- Ensures TypeScript compilation succeeds
- No `any` types in new code
- All interfaces properly defined

#### 2. **Linting**
```bash
pnpm lint
```
- ESLint rules enforcement
- Code style consistency
- Best practices validation

#### 3. **Build Verification**
```bash
pnpm build
```
- All packages compile successfully
- No build errors or warnings
- Dependencies resolve correctly

#### 4. **Unit Tests** (when implemented)
```bash
pnpm test
```
- All tests pass
- Code coverage meets threshold (80%+)
- No flaky tests

#### 5. **Docker Build**
```bash
docker compose build
```
- All services build successfully
- No image vulnerabilities (critical/high)
- Optimized image sizes

### On Merge to `development`

- All PR checks (above)
- Integration tests
- Performance benchmarks
- Documentation build

### On Merge to `qa`

- All development checks
- E2E tests (Playwright)
- Cross-browser testing
- Accessibility audits

### On Merge to `main`

- All QA checks
- Security audit
- Release notes generation
- Docker image publishing
- Version tagging

---

## 🚦 Branch Protection Rules

### `development` Branch

**Required Checks:**
- ✅ TypeScript compilation
- ✅ Linting
- ✅ Build success
- ✅ Unit tests (when available)

**Merge Requirements:**
- 1 approval from @artur0sky
- All checks passing
- No merge conflicts
- Linear history (rebase preferred)

### `qa` Branch

**Required Checks:**
- ✅ All development checks
- ✅ Integration tests
- ✅ E2E tests

**Merge Requirements:**
- 1 approval from @artur0sky
- All checks passing
- QA testing completed

### `main` Branch

**Required Checks:**
- ✅ All QA checks
- ✅ Security audit
- ✅ Performance benchmarks

**Merge Requirements:**
- 1 approval from @artur0sky
- All checks passing
- Release notes prepared
- Version bumped

---

## 🔐 Security Scanning

### Dependency Scanning
- **Tool:** npm audit / pnpm audit
- **Frequency:** On every PR
- **Action:** Block merge if critical vulnerabilities found

### Code Scanning
- **Tool:** CodeQL (GitHub Advanced Security)
- **Frequency:** Daily on `main` and `development`
- **Action:** Create issues for findings

### Container Scanning
- **Tool:** Trivy
- **Frequency:** On Docker image builds
- **Action:** Fail build if critical vulnerabilities

### Secret Scanning
- **Tool:** GitHub Secret Scanning
- **Frequency:** On every commit
- **Action:** Immediate notification and block

---

## 📊 Quality Metrics

### Code Coverage
- **Target:** 80% overall
- **Critical Packages:** 90% (`player-core`, `dsp`)
- **Tool:** Vitest coverage

### Performance Benchmarks
- **Library Load:** < 200ms (with Redis cache)
- **Audio Start:** < 100ms
- **Build Time:** < 2 minutes
- **Docker Build:** < 5 minutes

### Bundle Size
- **Web App:** < 500KB (gzipped)
- **Player Core:** < 100KB
- **UI Package:** < 200KB

---

## 🔄 Local CI Simulation

Run the same checks locally before pushing:

```bash
# Full CI simulation
pnpm ci:check

# Individual checks
pnpm type-check
pnpm lint
pnpm build
pnpm test

# Docker checks
docker compose build
docker compose up -d
docker compose down
```

---

## 🎯 Future Enhancements

### Planned CI/CD Features

- [ ] **Visual Regression Testing:** Catch UI changes automatically
- [ ] **Performance Monitoring:** Track bundle size and load times
- [ ] **Automated Dependency Updates:** Dependabot integration
- [ ] **Release Automation:** Automatic changelog and version bumping
- [ ] **Multi-platform Testing:** Windows, macOS, Linux
- [ ] **Mobile App CI:** Android and iOS builds

---

## 📝 Workflow Files (Coming Soon)

Expected workflow files in `.github/workflows/`:

```
.github/workflows/
├── pr-checks.yml          # Run on every PR
├── development.yml        # Run on merge to development
├── qa.yml                 # Run on merge to qa
├── release.yml            # Run on merge to main
├── security.yml           # Daily security scans
└── dependency-review.yml  # Review dependency changes
```

---

## 🐛 Troubleshooting CI Failures

### TypeScript Errors
```bash
# Run locally to see full error
pnpm type-check

# Common fixes
pnpm install  # Update dependencies
pnpm build    # Rebuild packages
```

### Linting Errors
```bash
# Auto-fix where possible
pnpm lint --fix

# Check specific file
pnpm eslint path/to/file.ts
```

### Build Failures
```bash
# Clean build
pnpm clean
pnpm install
pnpm build

# Check for circular dependencies
pnpm list --depth=0
```

### Docker Build Failures
```bash
# Clean rebuild
docker compose down -v
docker compose build --no-cache
docker compose up
```

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [CodeQL](https://codeql.github.com/)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)

---

> "Quality is not an act, it is a habit." - Aristotle

Every automated check brings us closer to a more reliable, secure, and performant Sonántica.
