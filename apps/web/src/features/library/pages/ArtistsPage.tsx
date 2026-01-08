/**
 * Artists Page
 *
 * Browse library by artists.
 */

import { useState, useMemo } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { ArtistCard } from "../components/ArtistCard";
import { IconMicrophone, IconSearch } from "@tabler/icons-react";
import { LibraryPageHeader, VirtualizedGrid, useUIStore } from "@sonantica/ui";
import { useLocation } from "wouter";
import { useSelectionStore } from "../../../stores/selectionStore";
import { SelectionActionBar } from "../../../components/SelectionActionBar";

type SortField = "name" | "trackCount";
type SortOrder = "asc" | "desc";

export function ArtistsPage() {
  const { stats, searchQuery, getFilteredArtists } = useLibraryStore();
  const isCramped = useUIStore((state) => state.isCramped);
  const [, setLocation] = useLocation();

  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    itemType,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    selectedIds,
  } = useSelectionStore();

  const filteredArtists = getFilteredArtists();

  // Sort artists
  const sortedArtists = useMemo(() => {
    const artists = [...filteredArtists];

    artists.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "trackCount":
          aVal = a.trackCount || 0;
          bVal = b.trackCount || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return artists;
  }, [filteredArtists, sortField, sortOrder]);

  // Sync with server if needed? (Page maintains original logic)
  const handleArtistClick = (artist: any) => {
    setLocation(`/artist/${artist.id}`);
  };

  const handleLetterClick = (index: number, _letter: string) => {
    const element = document.getElementById(`artist-${index}`);
    const container = document.getElementById("main-content");

    if (element && container) {
      const elementTop = element.offsetTop;
      const headerOffset = 120;
      const scrollPosition = elementTop - headerOffset;
      container.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      });
    } else if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pb-32">
      <LibraryPageHeader
        title="Artists"
        subtitle={
          stats.totalArtists > 0
            ? `${stats.totalArtists} artist${
                stats.totalArtists !== 1 ? "s" : ""
              } in library`
            : undefined
        }
        sortOptions={[
          { value: "name", label: "Name" },
          { value: "trackCount", label: "Track Count" },
        ]}
        sortValue={sortField}
        sortDirection={sortOrder}
        onSortChange={(val) => setSortField(val as SortField)}
        onSortDirectionChange={setSortOrder}
        enableMultiSelect
        isSelectionMode={isSelectionMode && itemType === "artist"}
        onEnterSelectionMode={() => enterSelectionMode("artist")}
        onExitSelectionMode={exitSelectionMode}
        enableSelectAll
        allSelected={
          selectedIds.size === sortedArtists.length && sortedArtists.length > 0
        }
        onSelectAll={() => selectAll(sortedArtists.map((a) => a.id))}
        onDeselectAll={clearSelection}
      />

      <VirtualizedGrid
        items={sortedArtists}
        keyExtractor={(artist) => artist.id}
        idPrefix="artist"
        renderItem={(artist) => (
          <ArtistCard
            artist={artist}
            onClick={() => handleArtistClick(artist)}
            selected={
              isSelectionMode && itemType === "artist" && isSelected(artist.id)
            }
            isInSelectionMode={isSelectionMode && itemType === "artist"}
            onSelectionToggle={toggleSelection}
          />
        )}
        emptyState={{
          icon: <IconMicrophone size={40} stroke={1.5} />,
          title: "Library Empty",
          description: "No artists in your library.",
        }}
        noResultsState={{
          icon: <IconSearch size={40} className="text-text-muted/30" />,
          title: "No results found",
          description: `No artists found matching "${searchQuery}"`,
        }}
        isFiltered={!!searchQuery}
        alphabetNav={{
          enabled: true,
          onLetterClick: handleLetterClick,
          forceScrollOnly: isCramped,
        }}
      />

      <SelectionActionBar />
    </div>
  );
}
