/**
 * Tracks Page
 *
 * Displays all tracks in the library with sorting and filtering.
 * Supports virtual scrolling for large libraries.
 */

import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@sonantica/ui";
import { useLibraryStore } from "@sonantica/media-library";
import { useUIStore } from "@sonantica/ui";
import { TrackItem } from "../components/TrackItem";
import {
  IconMusic,
  IconSearch,
  IconPlayerPlay,
  IconArrowsShuffle,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import { AlphabetNavigator } from "@sonantica/ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  playFromContext,
  playAll,
  playAllShuffled,
} from "../../../utils/playContext";
import { trackToMediaSource } from "../../../utils/streamingUrl";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

// PERFORMANCE: Virtual scrolling threshold
const VIRTUAL_SCROLL_THRESHOLD = 100;

type SortField = "title" | "artist" | "album" | "year" | "duration" | "genre";
type SortOrder = "asc" | "desc";

export function TracksPage() {
  const { stats, searchQuery, getFilteredTracks } = useLibraryStore();
  const isCramped = useUIStore((state) => state.isCramped);

  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const filteredTracks = getFilteredTracks();

  // Sort tracks
  const sortedTracks = useMemo(() => {
    const tracksToSort = [...filteredTracks];

    tracksToSort.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "title":
          aVal = a.title?.toLowerCase() || "";
          bVal = b.title?.toLowerCase() || "";
          break;
        case "artist":
          aVal = a.artist?.toLowerCase() || "";
          bVal = b.artist?.toLowerCase() || "";
          break;
        case "album":
          aVal = a.album?.toLowerCase() || "";
          bVal = b.album?.toLowerCase() || "";
          break;
        case "year":
          aVal = a.year || 0;
          bVal = b.year || 0;
          break;
        case "duration":
          aVal = a.duration || 0;
          bVal = b.duration || 0;
          break;
        case "genre":
          aVal = a.genre?.toLowerCase() || "";
          bVal = b.genre?.toLowerCase() || "";
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return tracksToSort;
  }, [filteredTracks, sortField, sortOrder]);

  // PERFORMANCE: Virtual scrolling for large lists
  const useVirtualScroll = sortedTracks.length > VIRTUAL_SCROLL_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: sortedTracks.length,
    getScrollElement: () =>
      document.getElementById("main-content") as HTMLDivElement,
    estimateSize: () => 76, // Estimated height of TrackItem
    overscan: 10, // Increased overscan for smoother scrolling on mobile
    enabled: useVirtualScroll,
  });

  const handleTrackClick = async (_track: any, index: number) => {
    try {
      // Create context from ALL sorted tracks (not just visible ones)
      const mediaSources = sortedTracks.map(trackToMediaSource);

      // Play from context with all tracks, starting at clicked track
      await playFromContext(mediaSources, index);
    } catch (error) {
      console.error("Failed to play track:", error);
    }
  };

  const handleLetterClick = (index: number) => {
    const main = document.getElementById("main-content");
    if (!main) return;

    if (useVirtualScroll) {
      // For virtual scrolling, use the virtualizer's scrollToIndex method
      // This automatically handles rendering the necessary items
      virtualizer.scrollToIndex(index, {
        align: "start",
        behavior: "smooth",
      });
    } else {
      // For regular scrolling, ensure element is rendered first
      scrollToTrack(index, main);
    }
  };

  const scrollToTrack = (index: number, main: HTMLElement) => {
    // Try multiple times with increasing delays to ensure element is rendered
    let attempts = 0;
    const maxAttempts = 5;

    const tryScroll = () => {
      const element = document.getElementById(`track-${index}`);

      if (element) {
        // Element found, scroll to it
        const top = element.offsetTop - 80; // Account for sticky header
        main.scrollTo({ top, behavior: "smooth" });
      } else if (attempts < maxAttempts) {
        // Element not found yet, try again
        attempts++;
        setTimeout(tryScroll, 50 * attempts); // Exponential backoff
      } else {
        // Fallback: estimate scroll position based on track item height
        const trackHeight = 76; // Height of TrackItem
        const estimatedTop = index * trackHeight;
        main.scrollTo({ top: estimatedTop, behavior: "smooth" });
      }
    };

    // Start scrolling attempt
    requestAnimationFrame(() => {
      requestAnimationFrame(tryScroll);
    });
  };

  const handlePlayAll = async () => {
    try {
      const mediaSources = sortedTracks.map(trackToMediaSource);
      await playAll(mediaSources);
    } catch (error) {
      console.error("Failed to play all:", error);
    }
  };

  const handleShuffle = async () => {
    try {
      const mediaSources = sortedTracks.map(trackToMediaSource);
      await playAllShuffled(mediaSources);
    } catch (error) {
      console.error("Failed to shuffle:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pb-24 sm:pb-32">
      {/* Sticky Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-30 bg-bg/95 backdrop-blur-md border-b border-border/50 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 py-4 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Tracks
            </h1>
            <AnimatePresence>
              {stats.totalTracks > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-text-muted mt-1"
                >
                  {stats.totalTracks} track{stats.totalTracks !== 1 ? "s" : ""}{" "}
                  in library
                  {useVirtualScroll && (
                    <span className="ml-2 text-xs text-accent">
                      (Virtual Scrolling Active)
                    </span>
                  )}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Sort Controls */}
            {sortedTracks.length > 0 && (
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="flex-1 sm:flex-initial px-2 sm:px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="title">Title</option>
                  <option value="artist">Artist</option>
                  <option value="album">Album</option>
                  <option value="year">Year</option>
                  <option value="duration">Duration</option>
                  <option value="genre">Genre</option>
                </select>

                <Button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 flex-shrink-0"
                >
                  {sortOrder === "asc" ? (
                    <IconSortAscending size={18} />
                  ) : (
                    <IconSortDescending size={18} />
                  )}
                </Button>
              </div>
            )}

            {/* Play All Button */}
            {sortedTracks.length > 0 && (
              <>
                <Button
                  onClick={handlePlayAll}
                  variant="secondary"
                  className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
                >
                  <IconPlayerPlay size={18} />
                  <span className="hidden sm:inline">Play All</span>
                </Button>

                <Button
                  onClick={handleShuffle}
                  variant="secondary"
                  className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
                >
                  <IconArrowsShuffle size={18} />
                  <span className="hidden sm:inline">Shuffle</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {stats.totalTracks === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-16 sm:py-24 bg-surface/50 border border-border/50 rounded-2xl border-dashed"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center p-4 sm:p-6 bg-surface-elevated rounded-full mb-4 sm:mb-6 text-accent"
            >
              <IconMusic size={40} stroke={1.5} className="sm:w-12 sm:h-12" />
            </motion.div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 px-4">
              No music found
            </h2>
            <p className="text-sm sm:text-base text-text-muted mb-6 sm:mb-8 max-w-md mx-auto px-4">
              Your library is empty. Go to settings to add music folders.
            </p>
            <Link href="/settings">
              <Button variant="primary">Configure Library</Button>
            </Link>
          </motion.div>
        ) : filteredTracks.length === 0 ? (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 sm:py-20"
          >
            <IconSearch
              size={40}
              className="mx-auto text-text-muted/30 mb-4 sm:w-12 sm:h-12"
            />
            <p className="text-sm sm:text-base text-text-muted px-4">
              No tracks found matching "{searchQuery}"
            </p>
          </motion.div>
        ) : useVirtualScroll ? (
          // PERFORMANCE: Virtual scrolling for large lists - Using main container for scrolling
          <>
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
                contain: "strict",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const track = sortedTracks[virtualItem.index];
                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <TrackItem
                      track={track}
                      onClick={() => handleTrackClick(track, virtualItem.index)}
                    />
                  </div>
                );
              })}
            </div>
            <div className="py-3 sm:py-4 text-center text-xs text-text-muted/30">
              Showing {sortedTracks.length} tracks (Virtual Scrolling)
            </div>
          </>
        ) : (
          // Standard rendering for small lists
          <motion.div
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-1"
          >
            {sortedTracks.map((track: any, index: number) => (
              <div key={track.id} id={`track-${index}`}>
                <TrackItem
                  track={track}
                  onClick={() => handleTrackClick(track, index)}
                />
              </div>
            ))}

            <div className="py-3 sm:py-4 text-center text-xs text-text-muted/30">
              Showing {sortedTracks.length} tracks
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alphabet Navigator */}
      {sortedTracks.length > 50 &&
        (sortField === "title" ||
          sortField === "artist" ||
          sortField === "album") && (
          <AlphabetNavigator
            items={sortedTracks.map((t) => ({
              name:
                sortField === "title"
                  ? t.title
                  : sortField === "artist"
                  ? t.artist
                  : t.album,
            }))}
            onLetterClick={handleLetterClick}
            forceScrollOnly={isCramped}
          />
        )}
    </div>
  );
}
