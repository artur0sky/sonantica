/**
 * Playlists Page
 *
 * Browse and manage playlists.
 */

import { useState, useMemo } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { PlaylistCard } from "@sonantica/ui";
import { IconPlaylist, IconSearch, IconPlus } from "@tabler/icons-react";
import { Button } from "@sonantica/ui";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useSelectionStore } from "../../../stores/selectionStore";
import { SelectionActionBar } from "../../../components/SelectionActionBar";
import { usePlaylistSettingsStore } from "../../../stores/playlistSettingsStore";
import { playFromContext } from "../../../utils/playContext";
import { trackToMediaSource } from "../../../utils/streamingUrl";
import { IconCheckbox } from "@tabler/icons-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

export function PlaylistsPage() {
  const { playlists, searchQuery, tracks } = useLibraryStore();
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<string>("all");
  const trackAccess = usePlaylistSettingsStore((s) => s.trackAccess);

  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    isSelected,
    toggleSelection,
    itemType,
    selectAll,
    clearSelection,
    selectedIds,
  } = useSelectionStore();

  const isInSelectionModeForPlaylists =
    isSelectionMode && itemType === "playlist";

  // Filter playlists
  const filteredPlaylists = useMemo(() => {
    let filtered = playlists;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((p) => p.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(query));
    }

    // Sort by updated date (newest first)
    return filtered.sort((a, b) => {
      const aDate = new Date(a.updatedAt).getTime();
      const bDate = new Date(b.updatedAt).getTime();
      return bDate - aDate;
    });
  }, [playlists, searchQuery, filterType]);

  const handlePlaylistClick = (playlist: any) => {
    trackAccess(playlist.id);
    setLocation(`/playlist/${playlist.id}`);
  };

  const handlePlayPlaylist = (playlist: any) => {
    trackAccess(playlist.id);
    if (!playlist.trackIds) return;

    // Map trackIds to actual tracks
    const playlistTracks = playlist.trackIds
      .map((id: string) => tracks.find((t) => t.id === id))
      .filter((t: any) => !!t);

    if (playlistTracks.length === 0) return;

    const mediaSources = playlistTracks.map(trackToMediaSource);
    playFromContext(mediaSources, 0);
  };

  const handleCreatePlaylist = () => {
    // TODO: Open create playlist modal
    console.log("Create playlist");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pb-32">
      {/* Sticky Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-30 bg-bg/95 backdrop-blur-md border-b border-border/50 -mx-6 px-6 py-4 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Playlists</h1>
            {playlists.length > 0 && (
              <p className="text-sm text-text-muted mt-1">
                {playlists.length} playlist{playlists.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter by type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="all">All Types</option>
              <option value="MANUAL">Manual</option>
              <option value="SMART">Smart</option>
              <option value="GENERATED">Generated</option>
              <option value="HISTORY_SNAPSHOT">History</option>
            </select>

            {/* Create Playlist Button */}
            <Button
              onClick={handleCreatePlaylist}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <IconPlus size={18} />
              <span className="hidden sm:inline">New Playlist</span>
            </Button>

            {/* Multi-Select Button */}
            <Button
              onClick={() =>
                isSelectionMode
                  ? exitSelectionMode()
                  : enterSelectionMode("playlist")
              }
              variant={isSelectionMode ? "primary" : "ghost"}
              size="sm"
              className="flex items-center gap-2"
              title="Multi-Select"
            >
              <IconCheckbox size={18} />
              {isSelectionMode && (
                <span className="hidden sm:inline">Done</span>
              )}
            </Button>

            {/* Select All Toggle (only in selection mode) */}
            {isSelectionMode && (
              <Button
                onClick={() => {
                  if (selectedIds.size === filteredPlaylists.length) {
                    clearSelection();
                  } else {
                    selectAll(filteredPlaylists.map((p) => p.id));
                  }
                }}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                {selectedIds.size === filteredPlaylists.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Selection Action Bar */}
      <SelectionActionBar />

      {/* Content */}
      <AnimatePresence mode="wait">
        {filteredPlaylists.length === 0 && searchQuery ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <IconSearch size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted">
              No playlists found matching "{searchQuery}"
            </p>
          </motion.div>
        ) : filteredPlaylists.length === 0 ? (
          <motion.div
            key="empty-library"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <IconPlaylist
              size={48}
              className="mx-auto text-text-muted/30 mb-4"
            />
            <h3 className="text-lg font-medium mb-2">No playlists yet</h3>
            <p className="text-text-muted mb-6">
              Create your first playlist to organize your music
            </p>
            <Button onClick={handleCreatePlaylist} variant="primary">
              <IconPlus size={18} className="mr-2" />
              Create Playlist
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {filteredPlaylists.map((playlist: any) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onClick={() => handlePlaylistClick(playlist)}
                onPlay={() => handlePlayPlaylist(playlist)}
                selected={
                  isInSelectionModeForPlaylists && isSelected(playlist.id)
                }
                isInSelectionMode={isInSelectionModeForPlaylists}
                onSelectionToggle={toggleSelection}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
