/**
 * Playlist Detail Page
 *
 * Displays tracks belonging to a specific playlist.
 */

import { useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useLibraryStore } from "@sonantica/media-library";
import { TrackItem } from "../components/TrackItem";
import {
  IconChevronLeft,
  IconPlayerPlay,
  IconTrash,
  IconEdit,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Button, CoverArt } from "@sonantica/ui";
import { playFromContext } from "../../../utils/playContext";
import { trackToMediaSource } from "../../../utils/streamingUrl";

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { getPlaylistById, tracks } = useLibraryStore();

  const playlist = useMemo(
    () => (id ? getPlaylistById(id) : null) ?? null,
    [id, getPlaylistById]
  );

  // Get tracks for this playlist
  const playlistTracks = useMemo(() => {
    if (!playlist || !playlist.trackIds) return [];

    // Map trackIds to actual track objects, maintaining order
    return playlist.trackIds
      .map((trackId) => tracks.find((t) => t.id === trackId))
      .filter((t): t is NonNullable<typeof t> => t !== undefined);
  }, [playlist, tracks]);

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-muted">
        <p>Playlist not found</p>
        <Button
          variant="ghost"
          onClick={() => setLocation("/playlists")}
          className="mt-4"
        >
          Back to Playlists
        </Button>
      </div>
    );
  }

  const handlePlayAll = () => {
    const tracksAsSources = playlistTracks.map(trackToMediaSource);
    playFromContext(tracksAsSources, 0);
  };

  const handleTrackClick = (index: number) => {
    const tracksAsSources = playlistTracks.map(trackToMediaSource);
    playFromContext(tracksAsSources, index);
  };

  const handleDelete = () => {
    // TODO: Implement delete with confirmation
    console.log("Delete playlist:", playlist.id);
  };

  const handleEdit = () => {
    // TODO: Open edit modal
    console.log("Edit playlist:", playlist.id);
  };

  // Determine cover art (4-grid or single)
  const coverArts = playlist.coverArts || [];
  const hasGrid = coverArts.length >= 4;

  return (
    <div className="max-w-6xl mx-auto p-6 pb-32">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation("/playlists")}
        className="mb-8 -ml-2 text-text-muted hover:text-text"
      >
        <IconChevronLeft size={20} className="mr-1" />
        Back to Playlists
      </Button>

      {/* Playlist Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0 relative"
        >
          {hasGrid ? (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full rounded-md overflow-hidden shadow-2xl">
              {coverArts.slice(0, 4).map((art: string, i: number) => (
                <CoverArt
                  key={i}
                  src={art}
                  alt=""
                  className="w-full h-full"
                  iconSize={24}
                />
              ))}
            </div>
          ) : (
            <CoverArt
              src={coverArts[0]}
              alt={playlist.name}
              className="w-full h-full shadow-2xl"
              iconSize={64}
            />
          )}
        </motion.div>

        <div className="flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-accent font-semibold tracking-wider text-sm uppercase block">
                {playlist.type === "HISTORY_SNAPSHOT"
                  ? "Queue History"
                  : "Playlist"}
              </span>
              {playlist.type === "SMART" && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400">
                  SMART
                </span>
              )}
              {playlist.type === "GENERATED" && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-400">
                  MIX
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              {playlist.name}
            </h1>
            <div className="flex items-center gap-3 text-lg text-text-muted">
              <span>
                {playlistTracks.length} track
                {playlistTracks.length !== 1 ? "s" : ""}
              </span>
              {playlist.snapshotDate && (
                <>
                  <span className="opacity-30">•</span>
                  <span className="text-sm">
                    {new Date(playlist.snapshotDate).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>

            {playlist.description && (
              <p className="mt-4 text-text-muted max-w-2xl">
                {playlist.description}
              </p>
            )}

            <div className="mt-8 flex gap-4">
              <Button
                onClick={handlePlayAll}
                className="gap-2 px-8 h-12 text-lg"
                disabled={playlistTracks.length === 0}
              >
                <IconPlayerPlay size={20} className="fill-current" />
                Play Playlist
              </Button>

              {playlist.type !== "HISTORY_SNAPSHOT" && (
                <>
                  <Button
                    onClick={handleEdit}
                    variant="secondary"
                    className="gap-2"
                  >
                    <IconEdit size={18} />
                    Edit
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="ghost"
                    className="gap-2 text-red-400 hover:text-red-300"
                  >
                    <IconTrash size={18} />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tracks List */}
      {playlistTracks.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <p>This playlist is empty</p>
        </div>
      ) : (
        <div className="space-y-1">
          {playlistTracks.map((track, index) => (
            <TrackItem
              key={track.id}
              track={track}
              onClick={() => handleTrackClick(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
