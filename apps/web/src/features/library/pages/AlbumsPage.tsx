/**
 * Albums Page
 *
 * Browse library by albums.
 */

import { useState, useEffect, useMemo } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { AlbumCard } from "../components/AlbumCard";
import {
  IconDisc,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import { AlphabetNavigator, Button, useUIStore } from "@sonantica/ui";
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

type SortField = "title" | "artist" | "year" | "trackCount";
type SortOrder = "asc" | "desc";

export function AlbumsPage() {
  const { stats, searchQuery, getFilteredAlbums } = useLibraryStore();
  const isCramped = useUIStore((state) => state.isCramped);
  const [, setLocation] = useLocation();

  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const { scanServer } = useMultiServerLibrary();
  const { isSelectionMode, enterSelectionMode, exitSelectionMode } =
    useSelectionStore();

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

  // Reload from server when sort changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      import("../../../services/LibraryService").then(
        ({ getServersConfig }) => {
          const config = getServersConfig();
          config.servers.forEach((s) => {
            scanServer(s.id, false, "albums", 0, {
              sort: sortField,
              order: sortOrder,
            });
          });
        }
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [sortField, sortOrder, scanServer]);

  const handleAlbumClick = (album: any) => {
    setLocation(`/album/${album.id}`);
  };

  const handleLetterClick = (index: number, _letter: string) => {
    // Local navigation - we have all data loaded
    const element = document.getElementById(`album-${index}`);
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
      {/* Sticky Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-30 bg-bg/95 backdrop-blur-md border-b border-border/50 -mx-6 px-6 py-4 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Albums</h1>
            {stats.totalAlbums > 0 && (
              <p className="text-sm text-text-muted mt-1">
                {stats.totalAlbums} album{stats.totalAlbums !== 1 ? "s" : ""} in
                library
              </p>
            )}
          </div>

          {/* Sort Controls */}
          {stats.totalAlbums > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="title">Name</option>
                <option value="artist">Artist</option>
                <option value="year">Year</option>
                <option value="trackCount">Track Count</option>
              </select>

              <Button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                {sortOrder === "asc" ? (
                  <IconSortAscending size={18} />
                ) : (
                  <IconSortDescending size={18} />
                )}
              </Button>

              {/* Multi-Select Button */}
              <Button
                onClick={() =>
                  isSelectionMode
                    ? exitSelectionMode()
                    : enterSelectionMode("album")
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
            </div>
          )}
        </div>
      </motion.div>

      {/* Selection Action Bar */}
      <SelectionActionBar />

      {/* Content */}
      <AnimatePresence mode="wait">
        {filteredAlbums.length === 0 && searchQuery ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <IconSearch size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted">
              No albums found matching "{searchQuery}"
            </p>
          </motion.div>
        ) : filteredAlbums.length === 0 ? (
          <motion.div
            key="empty-library"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <IconDisc size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted">No albums in library</p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {sortedAlbums.map((album: any, index: number) => (
              <div key={album.id} id={`album-${index}`}>
                <AlbumCard
                  album={album}
                  onClick={() => handleAlbumClick(album)}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigator */}
      {sortedAlbums.length > 50 &&
        (sortField === "title" || sortField === "artist") && (
          <AlphabetNavigator
            items={sortedAlbums.map((a) => ({
              name: sortField === "title" ? a.title : a.artist,
            }))}
            onLetterClick={handleLetterClick}
            forceScrollOnly={isCramped}
            mode="local"
          />
        )}
    </div>
  );
}
