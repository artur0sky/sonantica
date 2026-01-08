/**
 * Playlists Page
 *
 * Browse and manage playlists.
 */

import { useState, useMemo } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { useSortable, useAlphabetNav } from "@sonantica/shared";
import { PlaylistCard } from "@sonantica/ui";
import { IconPlaylist, IconSearch, IconPlus } from "@tabler/icons-react";
import {
  LibraryPageHeader,
  VirtualizedGrid,
  Button,
  PromptDialog,
  useUIStore,
  GenericPageWrapper,
} from "@sonantica/ui";
import { useLocation } from "wouter";
import { useSelectionStore } from "../../../stores/selectionStore";
import { SelectionActionBar } from "../../../components/SelectionActionBar";
import { usePlaylistSettingsStore } from "../../../stores/playlistSettingsStore";
import { playFromContext } from "../../../utils/playContext";
import { trackToMediaSource } from "../../../utils/streamingUrl";
import { usePlaylistCRUD } from "../../../hooks/usePlaylistCRUD";
import { useDialog } from "../../../hooks/useDialog";

export function PlaylistsPage() {
  const { playlists, searchQuery, tracks } = useLibraryStore();
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<string>("all");
  const trackAccess = usePlaylistSettingsStore((s) => s.trackAccess);
  const { createPlaylist } = usePlaylistCRUD();
  const { dialogState, showPrompt, handleConfirm, handleCancel } = useDialog();
  const isCramped = useUIStore((state) => state.isCramped);

  // Filter playlists first
  const filterBaseRaw = useMemo(() => {
    let filtered = [...playlists];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((p) => p.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(query));
    }
    return filtered;
  }, [playlists, filterType, searchQuery]);

  const { sortedItems: filteredPlaylists } = useSortable(filterBaseRaw, {
    initialField: "updatedAt",
    initialOrder: "desc",
    getValue: (item: any, field: string) => {
      if (field === "updatedAt") return new Date(item.updatedAt).getTime();
      return (item as any)[field];
    },
  });

  const { scrollToLetter } = useAlphabetNav({
    idPrefix: "playlist",
    headerOffset: 120,
  });

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

  const handleCreatePlaylist = async () => {
    const name = await showPrompt(
      "Create Playlist",
      "Enter a name for your new playlist",
      "",
      "My Playlist"
    );
    if (name && name.trim()) {
      try {
        const playlist = await createPlaylist(name.trim());
        trackAccess(playlist.id);
        setLocation(`/playlist/${playlist.id}`);
      } catch (error) {
        alert("Failed to create playlist");
      }
    }
  };

  return (
    <GenericPageWrapper>
      <LibraryPageHeader
        title="Playlists"
        subtitle={
          playlists.length > 0
            ? `${playlists.length} playlist${playlists.length !== 1 ? "s" : ""}`
            : undefined
        }
        enableMultiSelect
        isSelectionMode={isInSelectionModeForPlaylists}
        onEnterSelectionMode={() => enterSelectionMode("playlist")}
        onExitSelectionMode={exitSelectionMode}
        enableSelectAll
        allSelected={
          selectedIds.size === filteredPlaylists.length &&
          filteredPlaylists.length > 0
        }
        onSelectAll={() => selectAll(filteredPlaylists.map((p: any) => p.id))}
        onDeselectAll={clearSelection}
        customActions={
          <div className="flex items-center gap-2">
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

            <Button
              onClick={handleCreatePlaylist}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <IconPlus size={18} />
              <span className="hidden sm:inline">New Playlist</span>
            </Button>
          </div>
        }
      />

      <VirtualizedGrid
        items={filteredPlaylists}
        keyExtractor={(p: any) => p.id}
        idPrefix="playlist"
        renderItem={(playlist: any) => (
          <PlaylistCard
            playlist={playlist}
            onClick={() => handlePlaylistClick(playlist)}
            onPlay={() => handlePlayPlaylist(playlist)}
            selected={isInSelectionModeForPlaylists && isSelected(playlist.id)}
            isInSelectionMode={isInSelectionModeForPlaylists}
            onSelectionToggle={toggleSelection}
          />
        )}
        emptyState={{
          icon: <IconPlaylist size={48} className="text-text-muted/30 mb-4" />,
          title: "No playlists yet",
          description: "Create your first playlist to organize your music",
          action: (
            <Button onClick={handleCreatePlaylist} variant="primary">
              <IconPlus size={18} className="mr-2" />
              Create Playlist
            </Button>
          ),
        }}
        noResultsState={{
          icon: (
            <IconSearch size={48} className="mx-auto text-text-muted/30 mb-4" />
          ),
          title: "No results found",
          description: `No playlists found matching "${searchQuery}"`,
        }}
        isFiltered={!!searchQuery}
        alphabetNav={{
          enabled: true,
          onLetterClick: scrollToLetter,
          forceScrollOnly: isCramped,
          getLetterItem: (p: any) => ({
            name: p.name,
          }),
        }}
      />

      <SelectionActionBar />

      <PromptDialog
        isOpen={dialogState.isOpen && dialogState.type === "prompt"}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        defaultValue={dialogState.defaultValue}
        placeholder={dialogState.placeholder}
      />
    </GenericPageWrapper>
  );
}
