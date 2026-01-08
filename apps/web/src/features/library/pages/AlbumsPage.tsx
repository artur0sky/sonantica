/**
 * Albums Page
 *
 * Browse library by albums.
 */

import { useLibraryStore } from "@sonantica/media-library";
import { useSortable, useAlphabetNav } from "@sonantica/shared";
import { AlbumCard } from "../components/AlbumCard";
import { IconDisc, IconSearch } from "@tabler/icons-react";
import { LibraryPageHeader, VirtualizedGrid, useUIStore } from "@sonantica/ui";
import { useLocation } from "wouter";
import { useSelectionStore } from "../../../stores/selectionStore";
import { SelectionActionBar } from "../../../components/SelectionActionBar";

export function AlbumsPage() {
  const { stats, searchQuery, getFilteredAlbums } = useLibraryStore();
  const isCramped = useUIStore((state) => state.isCramped);
  const [, setLocation] = useLocation();

  const filteredAlbums = getFilteredAlbums();

  const {
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    sortedItems: sortedAlbums,
  } = useSortable(filteredAlbums, {
    initialField: "title",
    getValue: (item: any, field: string) => {
      switch (field) {
        case "title":
          return item.title;
        case "artist":
          return item.artist;
        case "year":
          return item.year || 0;
        case "trackCount":
          return item.trackCount || 0;
        default:
          return 0;
      }
    },
  });

  const { scrollToLetter } = useAlphabetNav({
    idPrefix: "album",
    headerOffset: 120,
  });

  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectAll,
    clearSelection,
    selectedIds,
    itemType,
  } = useSelectionStore();

  const handleAlbumClick = (album: any) => {
    setLocation(`/album/${album.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pb-32">
      <LibraryPageHeader
        title="Albums"
        subtitle={
          stats.totalAlbums > 0
            ? `${stats.totalAlbums} album${
                stats.totalAlbums !== 1 ? "s" : ""
              } in library`
            : undefined
        }
        sortOptions={[
          { value: "title", label: "Name" },
          { value: "artist", label: "Artist" },
          { value: "year", label: "Year" },
          { value: "trackCount", label: "Track Count" },
        ]}
        sortValue={sortField}
        sortDirection={sortOrder}
        onSortChange={(val: string) => setSortField(val)}
        onSortDirectionChange={setSortOrder}
        enableMultiSelect
        isSelectionMode={isSelectionMode && itemType === "album"}
        onEnterSelectionMode={() => enterSelectionMode("album")}
        onExitSelectionMode={exitSelectionMode}
        enableSelectAll
        allSelected={
          selectedIds.size === sortedAlbums.length && sortedAlbums.length > 0
        }
        onSelectAll={() => selectAll(sortedAlbums.map((a: any) => a.id))}
        onDeselectAll={clearSelection}
      />

      <VirtualizedGrid
        items={sortedAlbums}
        keyExtractor={(album: any) => album.id}
        idPrefix="album"
        renderItem={(album: any) => (
          <AlbumCard album={album} onClick={() => handleAlbumClick(album)} />
        )}
        emptyState={{
          icon: <IconDisc size={40} className="text-text-muted/30" />,
          title: "Library Empty",
          description: "No albums in your library.",
        }}
        noResultsState={{
          icon: <IconSearch size={40} className="text-text-muted/30" />,
          title: "No results found",
          description: `No albums found matching "${searchQuery}"`,
        }}
        isFiltered={!!searchQuery}
        alphabetNav={{
          enabled: true,
          onLetterClick: scrollToLetter,
          forceScrollOnly: isCramped,
          getLetterItem: (a: any) => ({
            name: sortField === "title" ? a.title : a.artist,
          }),
        }}
      />

      <SelectionActionBar />
    </div>
  );
}
