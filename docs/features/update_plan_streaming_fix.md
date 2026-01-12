# Sonántica Core & Frontend Update Plan

## Objective
Fix metadata display issues ("Unknown Artist") and enable reliable audio streaming/playback.

## Changes Implemented

### 1. Backend: `go-core`
- **Updated `models.Track` & `models.Album`**: Added `ArtistName` and `AlbumTitle` fields (mapped to `json:"artist"` and `json:"album"`).
- **Refactored `api.GetTracks`**: Changed SQL query to `JOIN` with `artists` and `albums` tables to fetch names instead of just returning IDs.
- **Refactored `api.GetAlbums`**: Changed SQL query to `JOIN` with `artists` to fetch artist name.
- **Implemented Streaming Endpoint**: Created `api/stream.go` with `StreamTrack` handler.
    - **Logic**: LOOKUP `file_path` from DB by `track_id` -> SERVE file using `http.ServeContent` (Native Go support for Range requests/buffering).
- **Updated `main.go`**:
    - Replaced buggy `/stream/{filename}` route with `/stream/{id}`.
    - Registered `api.StreamTrack`.

### 2. Frontend: `apps/web`
- **Updated `streamingUrl.ts`**:
    - Modified `buildStreamingUrl` to use the new secure ID-based endpoint: `${baseUrl}/stream/${trackId}`.
    - Removed reliance on file paths in URLs (which was causing 404s with special characters/slashes).

## Verification Steps
1. **Restart `go-core` service**: `docker restart sonantica-core` (or equivalent).
2. **Reload Web App**: Refresh the browser.
3. **Check Library**: "Unknown Artist" should now display actual artist names.
4. **Play a Track**: Click play. The audio should load, and you should be able to seek/scrub through the timeline (buffering enabled).

## Remaining Tasks (Future)
- **Cover Art Extraction**: Python worker needs update to extract embedded art to disk.
- **Lyrics**: Python worker needs update to extract lyrics tag.
