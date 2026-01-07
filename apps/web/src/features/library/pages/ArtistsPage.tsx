/**
 * Artists Page
 *
 * Browse library by artists.
 */

import { useState, useEffect, useMemo } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { ArtistCard } from "../components/ArtistCard";
import { IconMicrophone, IconSearch } from "@tabler/icons-react";
import {
  AlphabetNavigator,
  PageHeader,
  SortControl,
  EmptyState,
  useUIStore,
  Button,
} from "@sonantica/ui";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useMultiServerLibrary } from "../../../hooks/useMultiServerLibrary";
import { useSelectionStore } from "../../../stores/selectionStore";
import { SelectionActionBar } from "../../../components/SelectionActionBar";
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

type SortField = "name" | "trackCount";
type SortOrder = "asc" | "desc";

export function ArtistsPage() {
  const { stats, searchQuery, getFilteredArtists } = useLibraryStore();
  const isCramped = useUIStore((state) => state.isCramped);
  const [, setLocation] = useLocation();

  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const { scanServer } = useMultiServerLibrary();
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

  // Reload from server when sort changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      import("../../../services/LibraryService").then(
        ({ getServersConfig }) => {
          const config = getServersConfig();
          config.servers.forEach((s) => {
            scanServer(s.id, false, "artists", 0, {
              sort: sortField,
              order: sortOrder,
            });
          });
        }
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [sortField, sortOrder, scanServer]);

  const handleArtistClick = (artist: any) => {
    setLocation(`/artist/${artist.id}`);
  };

  const handleLetterClick = (index: number, _letter: string) => {
    // Local navigation - we have all data loaded
    const element = document.getElementById(`artist-${index}`);
    const container = document.getElementById("main-content");

    if (element && container) {
      // Calculate exact position accounting for sticky header
      const elementTop = element.offsetTop;
      const headerOffset = 120; // Adjust based on your header height
      const scrollPosition = elementTop - headerOffset;

      // Scroll directly to position
      container.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      });
    } else if (element) {
      // Fallback to scrollIntoView
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pb-32">
      <PageHeader
        title="Artists"
        subtitle={
          stats.totalArtists > 0 &&
          `${stats.totalArtists} artist${
            stats.totalArtists !== 1 ? "s" : ""
          } in library`
        }
        actions={
          stats.totalArtists > 0 && (
            <div className="flex items-center gap-2">
              <SortControl
                value={sortField}
                options={[
                  { value: "name", label: "Name" },
                  { value: "trackCount", label: "Track Count" },
                ]}
                onValueChange={(val) => setSortField(val as SortField)}
                direction={sortOrder}
                onDirectionChange={setSortOrder}
              />
              <Button
                onClick={() =>
                  isSelectionMode
                    ? exitSelectionMode()
                    : enterSelectionMode("artist")
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
              {isSelectionMode && (
                <Button
                  onClick={() => {
                    if (selectedIds.size === sortedArtists.length) {
                      clearSelection();
                    } else {
                      selectAll(sortedArtists.map((a) => a.id));
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  {selectedIds.size === sortedArtists.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              )}
            </div>
          )
        }
      />

      {/* Content */}
      <AnimatePresence mode="wait">
        {filteredArtists.length === 0 && searchQuery ? (
          <EmptyState
            icon={IconSearch}
            title="No results found"
            description={`No artists found matching "${searchQuery}"`}
          />
        ) : filteredArtists.length === 0 ? (
          <EmptyState
            icon={IconMicrophone}
            title="Library Empty"
            description="No artists in your library."
          />
        ) : (
          <motion.div
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {sortedArtists.map((artist: any, index: number) => (
              <div key={artist.id} id={`artist-${index}`}>
                <ArtistCard
                  artist={artist}
                  onClick={() => handleArtistClick(artist)}
                  selected={
                    isSelectionMode &&
                    itemType === "artist" &&
                    isSelected(artist.id)
                  }
                  isInSelectionMode={isSelectionMode && itemType === "artist"}
                  onSelectionToggle={toggleSelection}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Action Bar */}
      <SelectionActionBar />

      {/* Navigator */}
      {sortedArtists.length > 50 && (
        <AlphabetNavigator
          items={sortedArtists}
          onLetterClick={handleLetterClick}
          forceScrollOnly={isCramped}
          mode="local"
        />
      )}
    </div>
  );
}
