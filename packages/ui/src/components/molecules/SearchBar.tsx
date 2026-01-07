/**
 * Global Search Bar
 *
 * Searches across all metadata: artists, albums, tracks, genres, years.
 * Positioned in the navbar for global access.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconSearch, IconX } from "@tabler/icons-react";
import { cn } from "../../utils";
import { useLibraryStore } from "@sonantica/media-library";
import { formatArtists } from "@sonantica/shared";
import type { Track, Artist, Album } from "@sonantica/media-library";

interface SearchResult {
  type: "track" | "artist" | "album" | "genre" | "year";
  id: string;
  title: string;
  subtitle?: string;
  coverArt?: string;
  data: any;
}

interface GlobalSearchBarProps {
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
}

export function SearchBar({ onResultSelect, className }: GlobalSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { tracks, albums, artists } = useLibraryStore();

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const foundResults: SearchResult[] = [];

    // Search tracks
    tracks.forEach((track: Track) => {
      const title = track.title?.toLowerCase() || "";
      const artist = formatArtists(track.artist).toLowerCase();
      const album = track.album?.toLowerCase() || "";
      const genre = Array.isArray(track.genre)
        ? track.genre.join(", ").toLowerCase()
        : track.genre?.toLowerCase() || "";
      const year = track.year?.toString() || "";

      if (
        title.includes(searchTerm) ||
        artist.includes(searchTerm) ||
        album.includes(searchTerm) ||
        genre.includes(searchTerm) ||
        year.includes(searchTerm)
      ) {
        foundResults.push({
          type: "track",
          id: track.id,
          title: track.title || "Unknown",
          subtitle: formatArtists(track.artist),
          coverArt: track.coverArt,
          data: track,
        });
      }
    });

    // Search artists
    artists.forEach((artist: Artist) => {
      if (artist.name.toLowerCase().includes(searchTerm)) {
        foundResults.push({
          type: "artist",
          id: artist.id,
          title: artist.name,
          subtitle: `${artist.trackCount} track${
            artist.trackCount !== 1 ? "s" : ""
          }`,
          coverArt: undefined, // Artist no longer has albums array
          data: artist,
        });
      }
    });

    // Search albums
    albums.forEach((album: Album) => {
      if (
        album.title.toLowerCase().includes(searchTerm) ||
        album.artist.toLowerCase().includes(searchTerm)
      ) {
        foundResults.push({
          type: "album",
          id: album.id,
          title: album.title,
          subtitle: album.artist,
          coverArt: album.coverArt,
          data: album,
        });
      }
    });

    // Limit results
    setResults(foundResults.slice(0, 20));
    setSelectedIndex(0);
  }, [query, tracks]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setQuery("");
          inputRef.current?.blur();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Click outside or scroll to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };

    const handleScroll = (e: Event) => {
      // Close dropdown on scroll if it's not scrolling inside the dropdown itself
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result);
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      track: "🎵",
      artist: "👤",
      album: "💿",
      genre: "🎸",
      year: "📅",
    };
    return icons[type] || "🔍";
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <IconSearch
          size={20}
          className="absolute left-3 sm:left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          stroke={1.5}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search tracks, artists, albums..."
          className={cn(
            "w-full pl-10 pr-10 py-2.5 sm:py-2 bg-surface-elevated border border-border rounded-lg",
            "text-base sm:text-sm text-text placeholder:text-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent",
            "transition-all"
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
          >
            <IconX size={18} stroke={1.5} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-surface-elevated border border-border rounded-lg shadow-2xl overflow-hidden z-50 max-h-[60vh] sm:max-h-96 overflow-y-auto custom-scrollbar"
          >
            {results.map((result, index) => (
              <motion.button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "w-full flex items-center gap-3 sm:gap-3 px-4 py-3 sm:py-2.5 text-left transition-colors",
                  index === selectedIndex
                    ? "bg-accent/10 text-text"
                    : "hover:bg-white/5 text-text-muted"
                )}
              >
                {/* Cover Art or Icon */}
                <div className="w-12 h-12 sm:w-10 sm:h-10 flex-shrink-0 rounded-md overflow-hidden bg-surface flex items-center justify-center text-xl sm:text-lg">
                  {result.coverArt ? (
                    <img
                      src={result.coverArt}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getTypeIcon(result.type)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-base sm:text-sm truncate">
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div className="text-sm sm:text-xs text-text-muted truncate">
                      {result.subtitle}
                    </div>
                  )}
                </div>

                {/* Type Badge */}
                <div className="text-[11px] sm:text-[10px] text-text-muted/50 uppercase tracking-wider">
                  {result.type}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
