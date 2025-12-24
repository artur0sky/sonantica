/**
 * Artists Page
 *
 * Browse library by artists.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { ArtistCard } from "../components/ArtistCard";
import {
  IconMicrophone,
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

const ITEMS_PER_PAGE = 20; // 20 grid items per page

type SortField = "name" | "trackCount";
type SortOrder = "asc" | "desc";

export function ArtistsPage() {
  const { stats, searchQuery, getFilteredArtists } = useLibraryStore();
  const [, setLocation] = useLocation();

  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

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
            Math.min(prev + ITEMS_PER_PAGE, filteredArtists.length)
          );
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [sortedArtists.length]);

  const visibleArtists = useMemo(
    () => sortedArtists.slice(0, displayedCount),
    [sortedArtists, displayedCount]
  );

  const handleArtistClick = (artist: any) => {
    setLocation(`/artist/${artist.id}`);
  };

  const handleLetterClick = (index: number) => {
    // 1. Aggressively ensure enough items are rendered (add buffer for smooth scrolling)
    if (index >= displayedCount) {
      setDisplayedCount(Math.min(index + 50, sortedArtists.length));
    }

    // 2. Use requestAnimationFrame for smoother, faster rendering coordination
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const element = document.getElementById(`artist-${index}`);
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
            <h1 className="text-3xl font-bold tracking-tight">Artists</h1>
            {stats.totalArtists > 0 && (
              <p className="text-sm text-text-muted mt-1">
                {stats.totalArtists} artist{stats.totalArtists !== 1 ? "s" : ""}{" "}
                in library
              </p>
            )}
          </div>

          {/* Sort Controls */}
          {sortedArtists.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="name">Name</option>
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
        {sortedArtists.length === 0 ? (
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
                  No artists found matching "{searchQuery}"
                </p>
              </>
            ) : (
              <>
                <IconMicrophone
                  size={48}
                  className="mx-auto text-text-muted/30 mb-4"
                />
                <p className="text-text-muted">No artists in library</p>
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
            {visibleArtists.map((artist: any, index: number) => (
              <div key={artist.id} id={`artist-${index}`}>
                <ArtistCard
                  artist={artist}
                  onClick={() => handleArtistClick(artist)}
                />
              </div>
            ))}

            {/* Sentinel - placed outside grid or spanning full width if possible, 
                but simple div at end of map works too if layout permits, 
                or better: just append it after the map inside the grid for simplicity if it doesn't break layout too much,
                OR strictly speaking, observer needs to be reachable. 
                For a grid, it's safer to put it after the grid.
            */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sentinel for Infinite Scroll (placed outside AnimatePresence/Grid to ensure visibility) */}
      {displayedCount < sortedArtists.length && (
        <div
          ref={observerTarget}
          className="py-8 text-center text-text-muted/50 text-sm"
        >
          Loading more artists...
        </div>
      )}
      {/* Navigator */}
      {sortedArtists.length > 50 && (
        <AlphabetNavigator
          items={sortedArtists}
          onLetterClick={handleLetterClick}
        />
      )}
    </div>
  );
}
