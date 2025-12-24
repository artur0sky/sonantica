/**
 * Library Page
 *
 * Browse music library by artists, albums, and tracks.
 */

import React from "react";
import { Button } from "@sonantica/ui";
import { useLibraryStore } from "@sonantica/media-library";
import { usePlayerStore } from "@sonantica/player-core";
import { TrackItem } from "./components/TrackItem";
import { AlbumCard } from "./components/AlbumCard";
import { ArtistCard } from "./components/ArtistCard";
import { cn } from "@sonantica/shared";

type ViewMode = "artists" | "albums" | "tracks";

export function LibraryPage() {
  const {
    stats,
    scanning,
    scanProgress,
    selectedArtist,
    selectedAlbum,
    scan,
    selectArtist,
    selectAlbum,
    clearSelection,
    getFilteredArtists,
    getFilteredAlbums,
    getFilteredTracks,
  } = useLibraryStore();

  const { loadTrack, play } = usePlayerStore();

  const [view, setView] = React.useState<ViewMode>("artists");

  const handleScan = async () => {
    try {
      await scan(["/media/"]);
    } catch (error) {
      console.error("Scan failed:", error);
    }
  };

  const handleTrackClick = async (track: any) => {
    try {
      await loadTrack({
        id: track.id,
        url: track.path,
        mimeType: track.mimeType,
        metadata: track.metadata,
      });
      await play();
    } catch (error) {
      console.error("Failed to play track:", error);
    }
  };

  const handleArtistClick = (artist: any) => {
    selectArtist(artist);
    setView("albums");
  };

  const handleAlbumClick = (album: any) => {
    selectAlbum(album);
    setView("tracks");
  };

  const filteredArtists = getFilteredArtists();
  const filteredAlbums = getFilteredAlbums();
  const filteredTracks = getFilteredTracks();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Music Library</h1>
          {stats.totalTracks > 0 && (
            <p className="text-sm text-text-muted mt-1">
              {stats.totalTracks} tracks • {stats.totalAlbums} albums •{" "}
              {stats.totalArtists} artists
            </p>
          )}
        </div>

        <Button onClick={handleScan} disabled={scanning} variant="primary">
          {scanning ? `🔄 Scanning... (${scanProgress})` : "🔄 Scan Library"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(["artists", "albums", "tracks"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setView(mode)}
            className={cn(
              "px-4 py-2 font-medium capitalize transition-fast",
              "border-b-2 -mb-px",
              view === mode
                ? "text-accent border-accent"
                : "text-text-muted border-transparent hover:text-text"
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Breadcrumbs */}
      {(selectedArtist || selectedAlbum) && (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => {
              clearSelection();
              setView("artists");
            }}
            className="text-accent hover:underline"
          >
            Artists
          </button>

          {selectedArtist && (
            <>
              <span className="text-text-muted">›</span>
              <button
                onClick={() => {
                  selectAlbum(null);
                  setView("albums");
                }}
                className="text-accent hover:underline"
              >
                {selectedArtist.name}
              </button>
            </>
          )}

          {selectedAlbum && (
            <>
              <span className="text-text-muted">›</span>
              <span className="text-text-muted">{selectedAlbum.name}</span>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        {stats.totalTracks === 0 ? (
          <div className="text-center py-12 bg-surface border border-border rounded-lg">
            <p className="text-text-muted mb-2">No music found in library.</p>
            <p className="text-sm text-text-muted">
              Click "Scan Library" to index your music files.
            </p>
          </div>
        ) : (
          <>
            {view === "artists" &&
              filteredArtists.map((artist: any) => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  onClick={() => handleArtistClick(artist)}
                />
              ))}

            {view === "albums" &&
              filteredAlbums.map((album: any) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  onClick={() => handleAlbumClick(album)}
                />
              ))}

            {view === "tracks" &&
              filteredTracks.map((track: any) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  onClick={() => handleTrackClick(track)}
                />
              ))}
          </>
        )}
      </div>
    </div>
  );
}
