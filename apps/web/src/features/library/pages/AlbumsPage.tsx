/**
 * Albums Page
 *
 * Browse library by albums.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { AlbumCard } from "../components/AlbumCard";
import {
  IconDisc,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import { AlphabetNavigator, Button } from "@sonantica/ui";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

const ITEMS_PER_PAGE = 20;

type SortField = "name" | "artist" | "year" | "trackCount";
type SortOrder = "asc" | "desc";

export function AlbumsPage() {
  const { stats, searchQuery, getFilteredAlbums } = useLibraryStore();
  const [, setLocation] = useLocation();

  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const filteredAlbums = getFilteredAlbums();

  // Sort albums
  const sortedAlbums = useMemo(() => {
    const albums = [...filteredAlbums];

    albums.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
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
          aVal = a.tracks.length;
          bVal = b.tracks.length;
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

  // Infinite Scroll State
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [searchQuery, sortField, sortOrder]); // Reset on search or sort change

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayedCount((prev) =>
            Math.min(prev + ITEMS_PER_PAGE, filteredAlbums.length)
          );
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [sortedAlbums.length]);

  const visibleAlbums = useMemo(
    () => sortedAlbums.slice(0, displayedCount),
    [sortedAlbums, displayedCount]
  );

  const handleAlbumClick = (album: any) => {
    setLocation(`/album/${album.id}`);
  };

  const handleLetterClick = (index: number) => {
    if (index >= displayedCount) {
      setDisplayedCount(Math.min(index + 50, sortedAlbums.length));
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const element = document.getElementById(`album-${index}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });
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
          {sortedAlbums.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="name">Name</option>
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
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {sortedAlbums.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            {searchQuery ? (
              <>
                <IconSearch
                  size={48}
                  className="mx-auto text-text-muted/30 mb-4"
                />
                <p className="text-text-muted">
                  No albums found matching "{searchQuery}"
                </p>
              </>
            ) : (
              <>
                <IconDisc
                  size={48}
                  className="mx-auto text-text-muted/30 mb-4"
                />
                <p className="text-text-muted">No albums in library</p>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {visibleAlbums.map((album: any, index: number) => (
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

      {/* Sentinel for Infinite Scroll */}
      {displayedCount < sortedAlbums.length && (
        <div
          ref={observerTarget}
          className="py-8 text-center text-text-muted/50 text-sm"
        >
          Loading more albums...
        </div>
      )}
      {/* Navigator */}
      {sortedAlbums.length > 50 && (
        <AlphabetNavigator
          items={sortedAlbums}
          onLetterClick={handleLetterClick}
        />
      )}
    </div>
  );
}
