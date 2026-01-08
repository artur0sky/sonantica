/**
 * Artists Page
 *
 * Browse library by artists.
 */

import { useLibraryStore } from "@sonantica/media-library";
import { useSortable, useAlphabetNav } from "@sonantica/shared";
import { ArtistCard } from "../components/ArtistCard";
import { IconMicrophone, IconSearch } from "@tabler/icons-react";
import { LibraryPageHeader, VirtualizedGrid, useUIStore } from "@sonantica/ui";
import { useLocation } from "wouter";
import { useSelectionStore } from "../../../stores/selectionStore";
import { SelectionActionBar } from "../../../components/SelectionActionBar";

export function ArtistsPage() {
  const { stats, searchQuery, getFilteredArtists } = useLibraryStore();
  const isCramped = useUIStore((state) => state.isCramped);
  const [, setLocation] = useLocation();

  const filteredArtists = getFilteredArtists();

  const {
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    sortedItems: sortedArtists,
  } = useSortable(filteredArtists, {
    initialField: "name",
    getValue: (item: any, field: string) => {
      if (field === "name") return item.name;
      if (field === "trackCount") return item.trackCount || 0;
      return 0;
    },
  });

  const { scrollToLetter } = useAlphabetNav({
    idPrefix: "artist",
    headerOffset: 120,
  });

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

  const handleArtistClick = (artist: any) => {
    setLocation(`/artist/${artist.id}`);
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
        onSortChange={(val: string) => setSortField(val)}
        onSortDirectionChange={setSortOrder}
        enableMultiSelect
        isSelectionMode={isSelectionMode && itemType === "artist"}
        onEnterSelectionMode={() => enterSelectionMode("artist")}
        onExitSelectionMode={exitSelectionMode}
        enableSelectAll
        allSelected={
          selectedIds.size === sortedArtists.length && sortedArtists.length > 0
        }
        onSelectAll={() => selectAll(sortedArtists.map((a: any) => a.id))}
        onDeselectAll={clearSelection}
      />

      <VirtualizedGrid
        items={sortedArtists}
        keyExtractor={(artist: any) => artist.id}
        idPrefix="artist"
        renderItem={(artist: any) => (
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
          onLetterClick: scrollToLetter,
          forceScrollOnly: isCramped,
        }}
      />

      <SelectionActionBar />
    </div>
  );
}
