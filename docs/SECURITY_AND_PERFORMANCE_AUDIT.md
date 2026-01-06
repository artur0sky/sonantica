# Security and Performance Audit Report
**Date:** 2026-01-06
**Scope:** Core Services (`stream-core`, `audio-worker`), API, and Logging Infrastructure.

## 1. Executive Summary
A re-inspection of the codebase was conducted to identify security vulnerabilities, performance bottlenecks, and architectural gaps in preparation for production deployment and Promtail/Loki integration.

**Key Findings:**
- 🔴 **Critical:** Missing pagination in all core library endpoints (`/tracks`, `/albums`, `/artists`).
- 🟠 **High:** No Authentication/Authorization layer implemented.
- 🟠 **High:** Unstructured logging (`fmt.Printf`) incompatible with advanced monitoring (Loki).
- 🟡 **Medium:** CORS is overly permissive (`*`).
- ⚪ **Low:** No compression middleware (Gzip) enabled.

---

## 2. Missing Modules & Features

The following modules were identified as effectively **missing** or incomplete:

### 2.1. Authentication & Authorization
*   **Current State:** No middleware exists to verify users. APIs are open to any network caller.
*   **Risk:** Unauthorized access to private media libraries; potential for malicious library scans.
*   **Recommendation:** Implement JWT-based middleware in `go-core`.

### 2.2. Pagination
*   **Current State:** Endpoints `GetTracks`, `GetArtists`, and `GetAlbums` return the **entire** dataset in a single JSON response.
*   **Risk:** Application crash (OOM) and massive latency with libraries > 10,000 items.
*   **Recommendation:** Implement cursor-based or offset-based pagination immediately.

### 2.3. Rate Limiting
*   **Current State:** No protection against flooding.
*   **Risk:** Denial of Service (DoS) via `/api/scan/start` or rapid requests.
*   **Recommendation:** Add `httprate` or similar middleware to `chi`.

### 2.4. Compression
*   **Current State:** No Gzip/Brotli compression middleware.
*   **Risk:** Increased bandwidth usage, slower load times on mobile.
*   **Recommendation:** Enable `middleware.Compress` in `go-chi`.

---

## 3. Security Analysis

### 3.1. Improper Function Usage & Path Traversal
*   **Symbolic Links / Path Traversal:**
    *   `api/media.go`: `resolveMediaPath` allows absolute paths from the database to be served directly.
    *   **Mitigation:** `http.ServeFile` prevents `../` traversal in the URL request, but if a malicious actor injects an absolute path (e.g., `/etc/passwd`) into the `tracks` table, the system will serve it.
    *   **Fix:** Enforce `filepath.Rel` checks or whitelist allowed directories (`MEDIA_PATH`, `/covers`).

### 3.2. Dangerous Operations
*   No evidence of `os.Exec`, `syscall`, or "Remote Terminal" backdoors found in `go-core` or `python-worker`.
*   Scanner runs via constrained `os.Walk` / `filepath.Walk`.

### 3.3. Communication Security
*   **CORS:** Currently set to `AllowedOrigins: []string{"*"}`.
    *   **Fix:** Restrict to specific frontend origins in production.
*   **TLS:** Not terminated by the application (assumed to be behind Nginx/Traefik).

---

## 4. Performance & Scalability

### 4.1. Database Queries
*   **Problem:** `SELECT *` behavior in `GetTracks` fetches heavy text fields (`bio`, `lyrics` if added) for all rows.
*   **Fix:** Select only necessary fields for list views.

### 4.2. Logging & Tracing Infrastructure (Promtail/Loki Readiness)
The current logging implementation is **insufficient** for the requested "strong logs" standard.

*   **Current:**
    *   Go: Mix of `log.Printf` (standard logger) and `fmt.Printf`.
    *   Python: `logging` with basic formatting.
*   **Deficiencies:** No request IDs (`TraceID`), no structured JSON, no severity levels in `std` output.
*   **Requirement for Loki:** Logs must be in JSON format or strict valid key=value pairs with a `trace_id` to correlate requests across services.

---

## 5. Remediation Plan

### Phase 1: Logging Overhaul (Immediate)
- [x] **Go:** Replace `fmt.Printf` and `log` with `slog` (Go 1.21+) or `zap`. Output JSON.
- [x] **Python:** Configure `python-json-logger`.
- [x] **Tracing:** Inject `X-Request-ID` in Go middleware and pass it to consumers.

### Phase 2: Core Stability
- [ ] Add **Pagination** to `GetTracks`, `GetAlbums`, `GetArtists`.
- [ ] Add **Gzip Compression**.
- [ ] Fix **CORS** restrictions.

### Phase 3: Security
- [ ] Implement **JWT Middleware**.
- [ ] Sanitize `resolveMediaPath` to disallow paths outside `MEDIA_PATH`.

---

## 6. Audit Evidence (Code References)

*   `services/go-core/api/library.go`: Lines 21-33 (No LIMIT/OFFSET clause).
*   `services/go-core/api/media.go`: Lines 15-17 (Accepts absolute paths blindly).
*   `services/go-core/main.go`: Line 88 (CORS `*`), Lines 36-39 (Unstructured logging).
