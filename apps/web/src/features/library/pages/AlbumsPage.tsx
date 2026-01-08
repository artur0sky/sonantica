/**
 * Albums Page
 *
 * Browse library by albums.
 */

import { useState, useMemo } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { AlbumCard } from "../components/AlbumCard";
import { IconDisc, IconSearch } from "@tabler/icons-react";
import { LibraryPageHeader, VirtualizedGrid, useUIStore } from "@sonantica/ui";
import { useLocation } from "wouter";
import { useSelectionStore } from "../../../stores/selectionStore";
import { SelectionActionBar } from "../../../components/SelectionActionBar";

type SortField = "title" | "artist" | "year" | "trackCount";
type SortOrder = "asc" | "desc";

export function AlbumsPage() {
  const { stats, searchQuery, getFilteredAlbums } = useLibraryStore();
  const isCramped = useUIStore((state) => state.isCramped);
  const [, setLocation] = useLocation();

  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectAll,
    clearSelection,
    selectedIds,
    itemType,
  } = useSelectionStore();

  const filteredAlbums = getFilteredAlbums();

  // Sort albums
  const sortedAlbums = useMemo(() => {
    const albums = [...filteredAlbums];

    albums.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "title":
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case "artist":
          aVal = a.artist.toLowerCase();
          bVal = b.artist.toLowerCase();
          break;
        case "year":
          aVal = a.year || 0;
          bVal = b.year || 0;
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

    return albums;
  }, [filteredAlbums, sortField, sortOrder]);

  const handleAlbumClick = (album: any) => {
    setLocation(`/album/${album.id}`);
  };

  const handleLetterClick = (index: number, _letter: string) => {
    const element = document.getElementById(`album-${index}`);
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
        onSortChange={(val: string) => setSortField(val as SortField)}
        onSortDirectionChange={setSortOrder}
        enableMultiSelect
        isSelectionMode={isSelectionMode && itemType === "album"}
        onEnterSelectionMode={() => enterSelectionMode("album")}
        onExitSelectionMode={exitSelectionMode}
        enableSelectAll
        allSelected={
          selectedIds.size === sortedAlbums.length && sortedAlbums.length > 0
        }
        onSelectAll={() => selectAll(sortedAlbums.map((a) => a.id))}
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
          onLetterClick: handleLetterClick,
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
