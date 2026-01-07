/**
 * Playlist Stats Component
 *
 * Displays statistics and insights about a playlist.
 * Following Sonántica's philosophy of transparency and user control.
 */

import { useMemo } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { motion } from "framer-motion";
import {
  IconClock,
  IconMusic,
  IconUser,
  IconDisc,
  IconCalendar,
  IconFileMusic,
} from "@tabler/icons-react";
import { formatTime } from "@sonantica/shared";

interface PlaylistStatsProps {
  playlistId: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
}

function StatCard({ icon, label, value, subtitle }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-elevated rounded-xl p-4 border border-border hover:border-accent/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="text-accent mt-1">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
            {label}
          </div>
          <div className="text-2xl font-bold text-text truncate">{value}</div>
          {subtitle && (
            <div className="text-xs text-text-muted mt-1">{subtitle}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
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
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Playlist Statistics
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard
          icon={<IconMusic size={20} stroke={1.5} />}
          label="Total Tracks"
          value={stats.trackCount}
        />

        <StatCard
          icon={<IconClock size={20} stroke={1.5} />}
          label="Duration"
          value={formatTime(stats.totalDuration)}
          subtitle={`${Math.round(stats.totalDuration / 60)} minutes`}
        />

        <StatCard
          icon={<IconUser size={20} stroke={1.5} />}
          label="Artists"
          value={stats.uniqueArtists}
          subtitle={stats.uniqueArtists === 1 ? "artist" : "different artists"}
        />

        <StatCard
          icon={<IconDisc size={20} stroke={1.5} />}
          label="Albums"
          value={stats.uniqueAlbums}
          subtitle={stats.uniqueAlbums === 1 ? "album" : "different albums"}
        />

        <StatCard
          icon={<IconFileMusic size={20} stroke={1.5} />}
          label="Format"
          value={stats.mostCommonFormat}
        />

        <StatCard
          icon={<IconCalendar size={20} stroke={1.5} />}
          label="Year Range"
          value={stats.yearRange}
        />
      </div>

      {/* Audio Quality */}
      {stats.avgBitrate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-elevated rounded-xl p-4 border border-border"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
                Average Bitrate
              </div>
              <div className="text-xl font-bold text-accent">
                {stats.avgBitrate} kbps
              </div>
            </div>
            <div className="text-right text-xs text-text-muted">
              {stats.avgBitrate >= 1000
                ? "High Quality"
                : stats.avgBitrate >= 320
                ? "Good Quality"
                : "Standard Quality"}
            </div>
          </div>
        </motion.div>
      )}

      {/* Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-elevated rounded-xl p-4 border border-border text-xs text-text-muted space-y-2"
      >
        <div className="flex justify-between">
          <span>Created:</span>
          <span className="text-text">{formatDate(stats.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Last Modified:</span>
          <span className="text-text">{formatDate(stats.updatedAt)}</span>
        </div>
      </motion.div>
    </div>
  );
}
