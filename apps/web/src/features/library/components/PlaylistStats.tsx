/**
 * Playlist Stats Component
 *
 * Displays statistics and insights about a playlist.
 * Following Sonántica's philosophy of transparency and user control.
 * Refactored to use shared UI atoms and molecules.
 */

import { useMemo } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import {
  IconClock,
  IconMusic,
  IconUser,
  IconDisc,
  IconCalendar,
  IconFileMusic,
} from "@tabler/icons-react";
import { formatTime, cn } from "@sonantica/shared";
import { StatCard } from "@sonantica/ui";

interface PlaylistStatsProps {
  playlistId: string;
}

export function PlaylistStats({ playlistId }: PlaylistStatsProps) {
  const { getPlaylistById, tracks } = useLibraryStore();

  const playlist = useMemo(
    () => getPlaylistById(playlistId),
    [playlistId, getPlaylistById]
  );

  const stats = useMemo(() => {
    if (!playlist || !playlist.trackIds) {
      return null;
    }

    // Get actual track objects
    const playlistTracks = playlist.trackIds
      .map((id) => tracks.find((t) => t.id === id))
      .filter((t): t is NonNullable<typeof t> => t !== undefined);

    if (playlistTracks.length === 0) {
      return null;
    }

    // Calculate total duration
    const totalDuration = playlistTracks.reduce(
      (sum, track) => sum + (track.duration || 0),
      0
    );

    // Count unique artists
    const uniqueArtists = new Set(
      playlistTracks.map((t) => t.artist).filter(Boolean)
    );

    // Count unique albums
    const uniqueAlbums = new Set(
      playlistTracks.map((t) => t.album).filter(Boolean)
    );

    // Count formats
    const formats = playlistTracks.reduce((acc, track) => {
      const format = String(track.format || "Unknown");
      acc[format] = (acc[format] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonFormat = Object.entries(formats).sort(
      ([, a], [, b]) => b - a
    )[0];

    // Get year range
    const years = playlistTracks
      .map((t) => t.year)
      .filter((y): y is number => typeof y === "number" && y > 0)
      .sort((a, b) => a - b);

    const yearRange =
      years.length > 0
        ? years[0] === years[years.length - 1]
          ? `${years[0]}`
          : `${years[0]} - ${years[years.length - 1]}`
        : "Unknown";

    // Calculate average bitrate
    const bitrates = playlistTracks
      .map((t) => (t as any).bitrate)
      .filter((b): b is number => typeof b === "number" && b > 0);

    const avgBitrate =
      bitrates.length > 0
        ? Math.round(bitrates.reduce((a, b) => a + b, 0) / bitrates.length)
        : null;

    return {
      trackCount: playlistTracks.length,
      totalDuration,
      uniqueArtists: uniqueArtists.size,
      uniqueAlbums: uniqueAlbums.size,
      mostCommonFormat: mostCommonFormat
        ? `${mostCommonFormat[0]} (${mostCommonFormat[1]} tracks)`
        : "Mixed",
      yearRange,
      avgBitrate,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };
  }, [playlist, tracks]);

  if (!stats) {
    return (
      <div className="bg-surface-elevated rounded-xl p-6 border border-border">
        <p className="text-text-muted text-center text-sm">
          No statistics available
        </p>
      </div>
    );
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">
        Playlist Statistics
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<IconMusic size={18} stroke={1.5} />}
          label="Tracks"
          value={stats.trackCount}
        />

        <StatCard
          icon={<IconClock size={18} stroke={1.5} />}
          label="Total Duration"
          value={formatTime(stats.totalDuration)}
          subtitle={`${Math.round(stats.totalDuration / 60)} minutes`}
        />

        <StatCard
          icon={<IconUser size={18} stroke={1.5} />}
          label="Unique Artists"
          value={stats.uniqueArtists}
          subtitle={stats.uniqueArtists === 1 ? "artist" : "different artists"}
        />

        <StatCard
          icon={<IconDisc size={18} stroke={1.5} />}
          label="Unique Albums"
          value={stats.uniqueAlbums}
          subtitle={stats.uniqueAlbums === 1 ? "album" : "different albums"}
        />

        <StatCard
          icon={<IconFileMusic size={18} stroke={1.5} />}
          label="Main Format"
          value={stats.mostCommonFormat}
        />

        <StatCard
          icon={<IconCalendar size={18} stroke={1.5} />}
          label="Musical Era"
          value={stats.yearRange}
        />
      </div>

      {/* Audio Quality Section */}
      {stats.avgBitrate && (
        <div className="bg-surface-elevated rounded-2xl p-5 border border-border/50 relative overflow-hidden group">
          {/* Subtle noise/texture would go here */}
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 opacity-60">
                Average Fidelity
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-accent tracking-tighter">
                  {stats.avgBitrate}
                </span>
                <span className="text-sm font-bold text-text-muted">kbps</span>
              </div>
            </div>
            <div className="text-right">
              <div
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  stats.avgBitrate >= 1000
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : stats.avgBitrate >= 320
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "bg-text-muted/10 text-text-muted border border-border"
                )}
              >
                {stats.avgBitrate >= 1000
                  ? "Lossless High-End"
                  : stats.avgBitrate >= 320
                  ? "High Fidelity"
                  : "Standard Audio"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface/30 rounded-xl p-4 border border-border/10">
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1 opacity-50">
            Collection Created
          </div>
          <div className="text-xs font-semibold text-text">
            {formatDate(stats.createdAt)}
          </div>
        </div>
        <div className="bg-surface/30 rounded-xl p-4 border border-border/10 text-right">
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1 opacity-50">
            Last Inventory
          </div>
          <div className="text-xs font-semibold text-text">
            {formatDate(stats.updatedAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
