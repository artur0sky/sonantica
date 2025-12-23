/**
 * Artists Page
 *
 * Browse library by artists.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { SearchBar } from "../../../shared/components/molecules";
import { useLibraryStore } from "../../../shared/store/libraryStore";
import { ArtistCard } from "../components/ArtistCard";
import { IconMicrophone, IconSearch } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

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

export function ArtistsPage() {
  const {
    stats,
    searchQuery,
    setSearchQuery,
    selectArtist,
    getFilteredArtists,
  } = useLibraryStore();

  const filteredArtists = getFilteredArtists();

  // Infinite Scroll State
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [searchQuery]); // Only reset on search query change

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
  }, [filteredArtists.length]);

  const visibleArtists = useMemo(
    () => filteredArtists.slice(0, displayedCount),
    [filteredArtists, displayedCount]
  );

  const handleArtistClick = (artist: any) => {
    selectArtist(artist);
    // TODO: Navigate to artist detail view or show albums
  };

  return (
    <div className="max-w-6xl mx-auto p-6 pb-32">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2 tracking-tight">Artists</h1>
        {stats.totalArtists > 0 && (
          <p className="text-sm text-text-muted mb-6">
            {stats.totalArtists} artist{stats.totalArtists !== 1 ? "s" : ""} in
            library
          </p>
        )}

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search artists..."
        />
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {filteredArtists.length === 0 ? (
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
            {visibleArtists.map((artist: any) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onClick={() => handleArtistClick(artist)}
              />
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
      {displayedCount < filteredArtists.length && (
        <div
          ref={observerTarget}
          className="py-8 text-center text-text-muted/50 text-sm"
        >
          Loading more artists...
        </div>
      )}
    </div>
  );
}
