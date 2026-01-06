/**
 * Artists Page
 *
 * Browse library by artists.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { ArtistCard } from "../components/ArtistCard";
import { IconMicrophone, IconSearch } from "@tabler/icons-react";
import {
  AlphabetNavigator,
  PageHeader,
  SortControl,
  EmptyState,
  useUIStore,
} from "@sonantica/ui";
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
  const isCramped = useUIStore((state) => state.isCramped);
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
        const main = document.getElementById("main-content");
        if (element && main) {
          const top = element.offsetTop - 100; // Account for grid gap and sticky header
          main.scrollTo({ top, behavior: "smooth" });
        }
      });
    });
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
          sortedArtists.length > 0 && (
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
          )
        }
      />

      {/* Content */}
      <AnimatePresence mode="wait">
        {sortedArtists.length === 0 ? (
          searchQuery ? (
            <EmptyState
              icon={IconSearch}
              title="No results found"
              description={`No artists found matching "${searchQuery}"`}
            />
          ) : (
            <EmptyState
              icon={IconMicrophone}
              title="Library Empty"
              description="No artists in your library."
            />
          )
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
          forceScrollOnly={isCramped}
        />
      )}
    </div>
  );
}
