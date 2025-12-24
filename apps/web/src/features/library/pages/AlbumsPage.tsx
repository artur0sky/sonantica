/**
 * Albums Page
 *
 * Browse library by albums.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { AlbumCard } from "../components/AlbumCard";
import { IconDisc, IconSearch } from "@tabler/icons-react";
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

const ITEMS_PER_PAGE = 20;

export function AlbumsPage() {
  const { stats, searchQuery, selectAlbum, getFilteredAlbums } =
    useLibraryStore();

  const filteredAlbums = getFilteredAlbums();

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
  }, [filteredAlbums.length]);

  const visibleAlbums = useMemo(
    () => filteredAlbums.slice(0, displayedCount),
    [filteredAlbums, displayedCount]
  );

  const handleAlbumClick = (album: any) => {
    selectAlbum(album);
    // TODO: Navigate to album detail view or show tracks
  };

  return (
    <div className="max-w-6xl mx-auto p-6 pb-32">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2 tracking-tight">Albums</h1>
        {stats.totalAlbums > 0 && (
          <p className="text-sm text-text-muted mb-6">
            {stats.totalAlbums} album{stats.totalAlbums !== 1 ? "s" : ""} in
            library
          </p>
        )}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {filteredAlbums.length === 0 ? (
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
            {visibleAlbums.map((album: any) => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={() => handleAlbumClick(album)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sentinel for Infinite Scroll */}
      {displayedCount < filteredAlbums.length && (
        <div
          ref={observerTarget}
          className="py-8 text-center text-text-muted/50 text-sm"
        >
          Loading more albums...
        </div>
      )}
    </div>
  );
}
