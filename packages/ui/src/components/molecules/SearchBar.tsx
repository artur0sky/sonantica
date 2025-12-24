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

  const { tracks } = useLibraryStore();

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const foundResults: SearchResult[] = [];

    // Search tracks
    tracks.forEach((track) => {
      const title = track.metadata?.title?.toLowerCase() || "";
      const artist = formatArtists(track.metadata?.artist).toLowerCase();
      const album = track.metadata?.album?.toLowerCase() || "";
      const genre = Array.isArray(track.metadata?.genre)
        ? track.metadata.genre.join(", ").toLowerCase()
        : track.metadata?.genre?.toLowerCase() || "";
      const year = track.metadata?.year?.toString() || "";

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
          title: track.metadata?.title || "Unknown",
          subtitle: formatArtists(track.metadata?.artist),
          coverArt: track.metadata?.coverArt,
          data: track,
        });
      }
    });

    // Group by artists
    const artistMap = new Map<string, any[]>();
    tracks.forEach((track: any) => {
      const artist = formatArtists(track.metadata?.artist);
      if (artist.toLowerCase().includes(searchTerm)) {
        if (!artistMap.has(artist)) {
          artistMap.set(artist, []);
        }
        artistMap.get(artist)!.push(track);
      }
    });

    artistMap.forEach((tracks, artist) => {
      foundResults.push({
        type: "artist",
        id: artist,
        title: artist,
        subtitle: `${tracks.length} track${tracks.length > 1 ? "s" : ""}`,
        coverArt: tracks[0]?.metadata?.coverArt,
        data: tracks,
      });
    });

    // Group by albums
    const albumMap = new Map<string, any[]>();
    tracks.forEach((track: any) => {
      const album = track.metadata?.album;
      if (album && album.toLowerCase().includes(searchTerm)) {
        if (!albumMap.has(album)) {
          albumMap.set(album, []);
        }
        albumMap.get(album)!.push(track);
      }
    });

    albumMap.forEach((tracks, album) => {
      foundResults.push({
        type: "album",
        id: album,
        title: album,
        subtitle: formatArtists(tracks[0]?.metadata?.artist),
        coverArt: tracks[0]?.metadata?.coverArt,
        data: tracks,
      });
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

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
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
            "w-full pl-10 pr-10 py-2 bg-surface-elevated border border-border rounded-lg",
            "text-sm text-text placeholder:text-text-muted",
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
            <IconX size={16} stroke={1.5} />
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
            className="absolute top-full left-0 right-0 mt-2 bg-surface-elevated border border-border rounded-lg shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto custom-scrollbar"
          >
            {results.map((result, index) => (
              <motion.button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  index === selectedIndex
                    ? "bg-accent/10 text-text"
                    : "hover:bg-white/5 text-text-muted"
                )}
              >
                {/* Cover Art or Icon */}
                <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-surface flex items-center justify-center text-lg">
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
                  <div className="font-medium text-sm truncate">
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div className="text-xs text-text-muted truncate">
                      {result.subtitle}
                    </div>
                  )}
                </div>

                {/* Type Badge */}
                <div className="text-[10px] text-text-muted/50 uppercase tracking-wider">
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
