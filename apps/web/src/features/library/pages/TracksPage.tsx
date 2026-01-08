/**
 * Tracks Page
 *
 * Displays all tracks in the library with sorting and filtering.
 * Supports virtual scrolling for large libraries.
 * Uses Framer Motion for page transitions (controlled by Settings)
 */

import { useState, useMemo, useCallback } from "react";
import { Link } from "wouter";
import {
  LibraryPageHeader,
  VirtualizedList,
  Button,
  useUIStore,
} from "@sonantica/ui";
import { useLibraryStore } from "@sonantica/media-library";
import { TrackItem } from "../components/TrackItem";
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

type SortField = "title" | "artist" | "album" | "year" | "duration" | "genre";
type SortOrder = "asc" | "desc";

export function TracksPage() {
  const { stats, searchQuery, getFilteredTracks } = useLibraryStore();
  const isCramped = useUIStore((state) => state.isCramped);

  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectAll,
    clearSelection,
    selectedIds,
  } = useSelectionStore();

  const filteredTracks = getFilteredTracks();

  // Sort tracks
  const sortedTracks = useMemo(() => {
    const tracksToSort = [...filteredTracks];

    tracksToSort.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "title":
          aVal = a.title?.toLowerCase() || "";
          bVal = b.title?.toLowerCase() || "";
          break;
        case "artist":
          aVal = a.artist?.toLowerCase() || "";
          bVal = b.artist?.toLowerCase() || "";
          break;
        case "album":
          aVal = a.album?.toLowerCase() || "";
          bVal = b.album?.toLowerCase() || "";
          break;
        case "year":
          aVal = a.year || 0;
          bVal = b.year || 0;
          break;
        case "duration":
          aVal = a.duration || 0;
          bVal = b.duration || 0;
          break;
        case "genre":
          aVal = a.genre?.toLowerCase() || "";
          bVal = b.genre?.toLowerCase() || "";
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return tracksToSort;
  }, [filteredTracks, sortField, sortOrder]);

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

  const handleLetterClick = (index: number, _letter: string) => {
    const main = document.getElementById("main-content");
    if (!main) return;

    const element = document.getElementById(`item-${index}`);
    if (element) {
      const top = element.offsetTop - 100;
      main.scrollTo({ top, behavior: "smooth" });
    } else {
      // Fallback for virtualized items not yet rendered
      const estimate = index * 76;
      main.scrollTo({ top: estimate, behavior: "smooth" });
    }
  };

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
    <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pb-24 sm:pb-32">
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
        onSortChange={(val: string) => setSortField(val as SortField)}
        onSortDirectionChange={setSortOrder}
        enableMultiSelect
        isSelectionMode={isSelectionMode}
        onEnterSelectionMode={() => enterSelectionMode("track")}
        onExitSelectionMode={exitSelectionMode}
        enableSelectAll
        allSelected={
          selectedIds.size === sortedTracks.length && sortedTracks.length > 0
        }
        onSelectAll={() => selectAll(sortedTracks.map((t) => t.id))}
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
          onLetterClick: handleLetterClick,
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
    </div>
  );
}
