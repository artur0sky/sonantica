/**
 * Tracks Page
 *
 * Displays all tracks in the library with sorting and filtering.
 * Supports virtual scrolling for large libraries.
 * Uses Framer Motion for page transitions (controlled by Settings)
 */

import { useCallback, useMemo } from "react";
import { Link } from "wouter";
import {
  LibraryPageHeader,
  VirtualizedList,
  Button,
  useUIStore,
  GenericPageWrapper,
} from "@sonantica/ui";
import { useLibraryStore } from "@sonantica/media-library";
import { useSortable, useAlphabetNav, OfflineStatus } from "@sonantica/shared";
import { TrackItem } from "../components/TrackItem";
import { useOfflineStore } from "@sonantica/offline-manager";
import { useSettingsStore } from "../../../stores/settingsStore";
import { useFilteredVirtualTracks } from "../../../hooks/useVirtualTracks";
import {
  IconMusic,
  IconSearch,
  IconPlayerPlay,
  IconArrowsShuffle,
} from "@tabler/icons-react";
import {
  playFromContext,
  playAll,
  playAllShuffled,
} from "../../../utils/playContext";
import { trackToMediaSource } from "../../../utils/streamingUrl";
import { useSelectionStore } from "../../../stores/selectionStore";
import { SelectionActionBar } from "../../../components/SelectionActionBar";

export function TracksPage() {
  const { stats, searchQuery } = useLibraryStore();
  const getVirtualTracks = useFilteredVirtualTracks();
  const isCramped = useUIStore((state) => state.isCramped);
  const { offlineMode, hideUnavailableOffline } = useSettingsStore();
  const offlineItems = useOfflineStore((state) => state.items);

  const filteredTracks = useMemo(() => {
    let tracks = getVirtualTracks;

    // Apply offline filtering if needed
    if (offlineMode && hideUnavailableOffline) {
      tracks = tracks.filter(
        (track: any) =>
          offlineItems[track.id]?.status === OfflineStatus.COMPLETED
      );
    }

    return tracks;
  }, [getVirtualTracks, offlineMode, hideUnavailableOffline, offlineItems]);

  const {
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    sortedItems: sortedTracks,
  } = useSortable(filteredTracks, {
    initialField: "title",
    getValue: (item: any, field: string) => {
      switch (field) {
        case "title":
          return item.title || "";
        case "artist":
          return item.artist || "";
        case "album":
          return item.album || "";
        case "year":
          return item.year || 0;
        case "duration":
          return item.duration || 0;
        case "genre":
          return item.genre || "";
        default:
          return 0;
      }
    },
  });

  const { scrollToLetter } = useAlphabetNav({
    idPrefix: "track",
    headerOffset: 120,
  });

  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectAll,
    clearSelection,
    selectedIds,
  } = useSelectionStore();

  const handleTrackClick = useCallback(
    async (_track: any, index: number) => {
      try {
        const mediaSources = sortedTracks.map(trackToMediaSource);
        await playFromContext(mediaSources, index);
      } catch (error) {
        console.error("Failed to play track:", error);
      }
    },
    [sortedTracks]
  );

  const handlePlayAll = async () => {
    try {
      const mediaSources = sortedTracks.map(trackToMediaSource);
      await playAll(mediaSources);
    } catch (error) {
      console.error("Failed to play all:", error);
    }
  };

  const handleShuffle = async () => {
    try {
      const mediaSources = sortedTracks.map(trackToMediaSource);
      await playAllShuffled(mediaSources);
    } catch (error) {
      console.error("Failed to shuffle:", error);
    }
  };

  return (
    <GenericPageWrapper className="px-3 sm:px-4 md:px-6 pb-24 sm:pb-32">
      <LibraryPageHeader
        title="Tracks"
        subtitle={
          stats.totalTracks > 0
            ? `${stats.totalTracks} track${
                stats.totalTracks !== 1 ? "s" : ""
              } in library`
            : undefined
        }
        sortOptions={[
          { value: "title", label: "Title" },
          { value: "artist", label: "Artist" },
          { value: "album", label: "Album" },
          { value: "year", label: "Year" },
          { value: "duration", label: "Duration" },
          { value: "genre", label: "Genre" },
        ]}
        sortValue={sortField}
        sortDirection={sortOrder}
        onSortChange={(val: string) => setSortField(val)}
        onSortDirectionChange={setSortOrder}
        enableMultiSelect
        isSelectionMode={isSelectionMode}
        onEnterSelectionMode={() => enterSelectionMode("track")}
        onExitSelectionMode={exitSelectionMode}
        enableSelectAll
        allSelected={
          selectedIds.size === sortedTracks.length && sortedTracks.length > 0
        }
        onSelectAll={() => selectAll(sortedTracks.map((t: any) => t.id))}
        onDeselectAll={clearSelection}
        customActions={
          <>
            <Button
              onClick={handlePlayAll}
              variant="secondary"
              className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
            >
              <IconPlayerPlay size={18} />
              <span className="hidden sm:inline">Play All</span>
            </Button>

            <Button
              onClick={handleShuffle}
              variant="secondary"
              className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
            >
              <IconArrowsShuffle size={18} />
              <span className="hidden sm:inline">Shuffle</span>
            </Button>
          </>
        }
      />

      <VirtualizedList
        items={sortedTracks}
        keyExtractor={(t: any) => t.id}
        idPrefix="track"
        renderItem={(track: any, index: number) => (
          <TrackItem
            track={track}
            onClick={() => handleTrackClick(track, index)}
          />
        )}
        emptyState={{
          icon: <IconMusic size={40} stroke={1.5} />,
          title: "No music found",
          description:
            "Your library is empty. Go to settings to add music folders.",
          action: (
            <Link href="/settings">
              <Button variant="primary">Configure Library</Button>
            </Link>
          ),
        }}
        noResultsState={{
          icon: <IconSearch size={40} className="text-text-muted/30" />,
          title: "No tracks found",
          description: `No tracks found matching "${searchQuery}"`,
        }}
        isFiltered={!!searchQuery}
        alphabetNav={{
          enabled: true,
          onLetterClick: scrollToLetter,
          forceScrollOnly: isCramped,
          getLetterItem: (t: any) => ({
            name:
              sortField === "title"
                ? t.title
                : sortField === "artist"
                ? t.artist
                : t.album,
          }),
        }}
      />

      <SelectionActionBar />
    </GenericPageWrapper>
  );
}
