/**
 * Library Page
 *
 * Main library view with server management.
 * Server-based architecture - no local file scanning.
 */

import { useLocation } from "wouter";
import { Button } from "@sonantica/ui";
import { IconSettings, IconServer } from "@tabler/icons-react";
import { useLibraryStore } from "@sonantica/media-library";
import { ServersSection } from "./components/ServersSection";

export function LibraryPage() {
  const [, setLocation] = useLocation();
  const { stats } = useLibraryStore();

  return (
    <div className="max-w-6xl mx-auto p-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Library</h1>
          <p className="text-text-muted">
            {stats.totalTracks} tracks • {stats.totalArtists} artists •{" "}
            {stats.totalAlbums} albums
          </p>
        </div>
        <Button
          onClick={() => setLocation("/settings")}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <IconSettings size={18} />
          Settings
        </Button>
      </div>

      {/* Server Status */}
      <div className="bg-surface-elevated border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <IconServer size={24} className="text-accent" />
          <h2 className="text-xl font-semibold">Media Servers</h2>
        </div>

        <ServersSection />
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={() => setLocation("/tracks")}
          variant="secondary"
          className="p-6 h-auto flex flex-col items-start"
        >
          <span className="text-2xl font-bold mb-1">{stats.totalTracks}</span>
          <span className="text-sm text-text-muted">Tracks</span>
        </Button>

        <Button
          onClick={() => setLocation("/artists")}
          variant="secondary"
          className="p-6 h-auto flex flex-col items-start"
        >
          <span className="text-2xl font-bold mb-1">{stats.totalArtists}</span>
          <span className="text-sm text-text-muted">Artists</span>
        </Button>

        <Button
          onClick={() => setLocation("/albums")}
          variant="secondary"
          className="p-6 h-auto flex flex-col items-start"
        >
          <span className="text-2xl font-bold mb-1">{stats.totalAlbums}</span>
          <span className="text-sm text-text-muted">Albums</span>
        </Button>
      </div>
    </div>
  );
}
