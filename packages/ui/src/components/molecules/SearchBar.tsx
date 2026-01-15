import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconSearch,
  IconX,
  IconPlayerPlay,
  IconPlaylistAdd,
  IconChevronRight,
  IconDotsVertical,
  IconPlus,
} from "@tabler/icons-react";
import { cn } from "../../utils";
import { useLibraryStore } from "@sonantica/media-library";
import { formatArtists } from "@sonantica/shared";
import type { Track, Artist, Album, Playlist } from "@sonantica/media-library";
import { TrackItem } from "./TrackItem";
import { useContextMenu, ContextMenu } from "../ContextMenu";

export interface SearchResult {
  type: "track" | "artist" | "album" | "playlist";
  id: string;
  title: string;
  subtitle?: string;
  coverArt?: string;
  data: any;
  score?: number;
  source?: "local" | "remote";
  sourceName?: string;
}

interface CategorizedResults {
  topMatch?: SearchResult;
  tracks: SearchResult[];
  artists: SearchResult[];
  albums: SearchResult[];
  playlists: SearchResult[];
}

export interface GlobalSearchBarProps {
  onResultSelect?: (result: SearchResult) => void;
  onResultAction?: (
    result: SearchResult,
    action: "playNext" | "addToQueue"
  ) => void;
  className?: string;
}

export function SearchBar({
  onResultSelect,
  onResultAction,
  className,
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [categorizedResults, setCategorizedResults] =
    useState<CategorizedResults>({
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
    });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [contextMenuResult, setContextMenuResult] =
    useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resultContextMenu = useContextMenu("search-result-menu");

  const { tracks, albums, artists, playlists } = useLibraryStore();

  // Unified list of all results for keyboard navigation
  const flatResults = useMemo(() => {
    const list: SearchResult[] = [];
    if (categorizedResults.topMatch) list.push(categorizedResults.topMatch);
    list.push(...categorizedResults.tracks);
    list.push(...categorizedResults.artists);
    list.push(...categorizedResults.albums);
    list.push(...categorizedResults.playlists);
    return list;
  }, [categorizedResults]);

  // Search logic with ranking and grouping
  useEffect(() => {
    if (!query.trim()) {
      setCategorizedResults({
        tracks: [],
        artists: [],
        albums: [],
        playlists: [],
      });
      return;
    }

    const searchTerm = query.toLowerCase();
    const foundTracks: SearchResult[] = [];
    const foundArtists: SearchResult[] = [];
    const foundAlbums: SearchResult[] = [];
    const foundPlaylists: SearchResult[] = [];

    // Search tracks
    tracks.forEach((track: Track) => {
      const title = track.title?.toLowerCase() || "";
      const artistName = formatArtists(track.artist).toLowerCase();
      const albumTitle = track.album?.toLowerCase() || "";

      let score = 0;
      if (title === searchTerm) score += 100;
      else if (title.startsWith(searchTerm)) score += 50;
      else if (title.includes(searchTerm)) score += 10;

      if (artistName.includes(searchTerm)) score += 20;
      if (albumTitle.includes(searchTerm)) score += 5;

      if (score > 0) {
        foundTracks.push({
          type: "track",
          id: track.id,
          title: track.title || "Unknown",
          subtitle: formatArtists(track.artist),
          coverArt: track.coverArt,
          data: track,
          score,
          source: track.source,
          sourceName:
            track.serverName || (track.source === "local" ? "LOCAL" : "SERVER"),
        });
      }
    });

    // Search artists
    artists.forEach((artist: Artist) => {
      let score = 0;
      const name = artist.name.toLowerCase();
      if (name === searchTerm) score += 100;
      else if (name.startsWith(searchTerm)) score += 50;
      else if (name.includes(searchTerm)) score += 20;

      if (score > 0) {
        foundArtists.push({
          type: "artist",
          id: artist.id,
          title: artist.name,
          subtitle: `${artist.trackCount} tracks`,
          coverArt: undefined,
          data: artist,
          score,
        });
      }
    });

    // Search albums
    albums.forEach((album: Album) => {
      let score = 0;
      const title = album.title.toLowerCase();
      const artistName = album.artist.toLowerCase();

      if (title === searchTerm) score += 100;
      else if (title.startsWith(searchTerm)) score += 50;
      else if (title.includes(searchTerm)) score += 20;

      if (artistName.includes(searchTerm)) score += 10;

      if (score > 0) {
        foundAlbums.push({
          type: "album",
          id: album.id,
          title: album.title,
          subtitle: album.artist,
          coverArt: album.coverArt,
          data: album,
          score,
        });
      }
    });

    // Search playlists
    playlists.forEach((playlist: Playlist) => {
      let score = 0;
      const name = playlist.name.toLowerCase();

      if (name === searchTerm) score += 100;
      else if (name.startsWith(searchTerm)) score += 50;
      else if (name.includes(searchTerm)) score += 20;

      if (score > 0) {
        foundPlaylists.push({
          type: "playlist",
          id: playlist.id,
          title: playlist.name,
          subtitle: `${playlist.trackCount || 0} tracks`,
          coverArt: playlist.coverArts?.[0],
          data: playlist,
          score,
        });
      }
    });

    // Sort by score
    const sortByScore = (a: SearchResult, b: SearchResult) =>
      (b.score || 0) - (a.score || 0);
    foundTracks.sort(sortByScore);
    foundArtists.sort(sortByScore);
    foundAlbums.sort(sortByScore);
    foundPlaylists.sort(sortByScore);

    // Identify Top Match
    const allResults = [
      ...foundTracks,
      ...foundArtists,
      ...foundAlbums,
      ...foundPlaylists,
    ];
    allResults.sort(sortByScore);
    const topMatch = allResults[0];

    setCategorizedResults({
      topMatch,
      tracks: foundTracks.slice(0, 5),
      artists: foundArtists.slice(0, 3),
      albums: foundAlbums.slice(0, 3),
      playlists: foundPlaylists.slice(0, 3),
    });
    setSelectedIndex(0);
  }, [query, tracks, albums, artists, playlists]);

  // Section boundaries for Tab navigation
  const sectionStarts = useMemo(() => {
    let current = 0;
    const starts = {
      top: categorizedResults.topMatch ? 0 : -1,
      tracks: -1,
      artists: -1,
      albums: -1,
      playlists: -1,
    };

    if (categorizedResults.topMatch) {
      current = 1;
    }

    if (categorizedResults.tracks.length > 0) {
      starts.tracks = current;
      current += categorizedResults.tracks.length;
    }

    if (categorizedResults.artists.length > 0) {
      starts.artists = current;
      current += categorizedResults.artists.length;
    }

    if (categorizedResults.albums.length > 0) {
      starts.albums = current;
      current += categorizedResults.albums.length;
    }

    if (categorizedResults.playlists.length > 0) {
      starts.playlists = current;
      current += categorizedResults.playlists.length;
    }

    return starts;
  }, [categorizedResults]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || flatResults.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, flatResults.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (flatResults[selectedIndex]) {
            handleResultClick(flatResults[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setQuery("");
          inputRef.current?.blur();
          break;
        case "Tab":
          e.preventDefault();
          const boundaries = [
            sectionStarts.top,
            sectionStarts.tracks,
            sectionStarts.artists,
            sectionStarts.albums,
            sectionStarts.playlists,
          ].filter((b) => b !== -1);

          if (boundaries.length <= 1) break;

          // Find the first boundary that is greater than current index
          let nextBoundary = boundaries.find((b) => b > selectedIndex);

          // Loop back to start if at the end
          if (nextBoundary === undefined) {
            nextBoundary = boundaries[0];
          }

          setSelectedIndex(nextBoundary);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatResults, selectedIndex, sectionStarts]);

  // Click outside or scroll to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = (e: Event) => {
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

  const handleAction = (
    e: React.MouseEvent | { stopPropagation: () => void },
    result: SearchResult,
    action: "playNext" | "addToQueue"
  ) => {
    e.stopPropagation();
    onResultAction?.(result, action);
  };

  const menuItems = useMemo(() => {
    if (!contextMenuResult) return [];

    return [
      {
        id: "play",
        label: "Play",
        icon: <IconPlayerPlay size={16} />,
        onClick: () => handleResultClick(contextMenuResult),
      },
      {
        id: "play-next",
        label: "Play Next",
        icon: <IconPlus size={16} />,
        onClick: () =>
          handleAction(
            { stopPropagation: () => {} },
            contextMenuResult,
            "playNext"
          ),
      },
      {
        id: "add-queue",
        label: "Add to Queue",
        icon: <IconPlaylistAdd size={16} />,
        onClick: () =>
          handleAction(
            { stopPropagation: () => {} },
            contextMenuResult,
            "addToQueue"
          ),
      },
    ];
  }, [contextMenuResult, onResultAction]);

  const renderSection = (
    title: string,
    items: SearchResult[],
    startIndex: number
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-4 last:mb-0">
        <h3 className="px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-bold text-text-muted/60 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-accent/50" />
          {title}
        </h3>
        <div className="space-y-0.5">
          {items.map((result, i) => {
            const index = startIndex + i;
            const isSelected = index === selectedIndex;

            return (
              <div
                key={`${result.type}-${result.id}`}
                onMouseEnter={() => setSelectedIndex(index)}
                onContextMenu={(e) => {
                  setContextMenuResult(result);
                  resultContextMenu.handleContextMenu(e);
                }}
                className="relative group/item"
              >
                <TrackItem
                  title={result.title}
                  artist={result.subtitle}
                  source={result.source}
                  sourceName={result.sourceName}
                  onClick={() => handleResultClick(result)}
                  image={
                    result.coverArt ? (
                      <img
                        src={result.coverArt}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-elevated text-xl">
                        {result.type === "artist"
                          ? "👤"
                          : result.type === "album"
                          ? "💿"
                          : "🎵"}
                      </div>
                    )
                  }
                  className={cn(
                    "mx-2 py-2 rounded-lg transition-all border border-transparent",
                    isSelected
                      ? "bg-accent/10 border-accent/20"
                      : "hover:bg-white/5"
                  )}
                  isActive={isSelected}
                  actions={
                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleAction(e, result, "playNext")}
                        className="p-1.5 hover:bg-white/10 rounded-full text-text-muted hover:text-accent transition-colors"
                        title="Play Next"
                      >
                        <IconPlayerPlay size={16} />
                      </button>
                      <button
                        onClick={(e) => handleAction(e, result, "addToQueue")}
                        className="p-1.5 hover:bg-white/10 rounded-full text-text-muted hover:text-accent transition-colors"
                        title="Add to Queue"
                      >
                        <IconPlus size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenuResult(result);
                          resultContextMenu.handleContextMenu(e);
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-full text-text-muted hover:text-accent transition-colors"
                      >
                        <IconDotsVertical size={16} />
                      </button>
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative group">
        <IconSearch
          size={18}
          className={cn(
            "absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors",
            isOpen
              ? "text-accent"
              : "text-text-muted group-focus-within:text-accent"
          )}
          stroke={2}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search your music..."
          className={cn(
            "w-full pl-11 pr-10 py-2.5 bg-surface-base border border-border/50 rounded-full",
            "text-sm text-text placeholder:text-text-muted/50",
            "focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent/40 focus:bg-surface-elevated",
            "transition-all duration-300 shadow-sm"
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setCategorizedResults({
                tracks: [],
                artists: [],
                albums: [],
                playlists: [],
              });
              inputRef.current?.focus();
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors p-1"
          >
            <IconX size={16} stroke={2} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen &&
          (categorizedResults.tracks.length > 0 ||
            categorizedResults.artists.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "absolute top-full left-0 right-0 mt-3 p-2 bg-surface-elevated/95 backdrop-blur-2xl",
                "border border-white/10 rounded-2xl shadow-2xl z-[9999] overflow-hidden",
                "max-h-[70vh] overflow-y-auto custom-scrollbar overflow-x-hidden"
              )}
            >
              <div className="relative z-10">
                {/* Top Match */}
                {categorizedResults.topMatch && (
                  <div className="mb-6 p-2">
                    <h3 className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] font-bold text-text-muted/60">
                      Top Result
                    </h3>
                    <div
                      onClick={() =>
                        handleResultClick(categorizedResults.topMatch!)
                      }
                      onContextMenu={(e) => {
                        setContextMenuResult(categorizedResults.topMatch!);
                        resultContextMenu.handleContextMenu(e);
                      }}
                      className={cn(
                        "flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl cursor-pointer transition-all",
                        selectedIndex === 0
                          ? "bg-accent/20 border border-accent/20"
                          : "bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-lg overflow-hidden shadow-xl flex-shrink-0 bg-surface">
                        {categorizedResults.topMatch.coverArt ? (
                          <img
                            src={categorizedResults.topMatch.coverArt}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            {categorizedResults.topMatch.type === "artist"
                              ? "👤"
                              : "💿"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left min-w-0">
                        <h2 className="text-xl sm:text-lg font-bold truncate">
                          {categorizedResults.topMatch.title}
                        </h2>
                        <p className="text-sm text-text-muted flex items-center justify-center sm:justify-start gap-2 mt-1">
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] uppercase font-bold tracking-wider">
                            {categorizedResults.topMatch.type}
                          </span>
                          {categorizedResults.topMatch.subtitle}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResultClick(categorizedResults.topMatch!);
                          }}
                          className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all"
                        >
                          <IconPlayerPlay size={24} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sections */}
                {renderSection(
                  "Songs",
                  categorizedResults.tracks,
                  categorizedResults.topMatch ? 1 : 0
                )}
                {renderSection(
                  "Artists",
                  categorizedResults.artists,
                  (categorizedResults.topMatch ? 1 : 0) +
                    categorizedResults.tracks.length
                )}
                {renderSection(
                  "Albums",
                  categorizedResults.albums,
                  (categorizedResults.topMatch ? 1 : 0) +
                    categorizedResults.tracks.length +
                    categorizedResults.artists.length
                )}
                {renderSection(
                  "Playlists",
                  categorizedResults.playlists,
                  (categorizedResults.topMatch ? 1 : 0) +
                    categorizedResults.tracks.length +
                    categorizedResults.artists.length +
                    categorizedResults.albums.length
                )}

                <div className="py-4 border-t border-white/5 mt-2 flex justify-center">
                  <p className="text-[10px] text-text-muted/40 font-medium">
                    SONÁNTICA INTELLIGENT SEARCH
                  </p>
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Result Context Menu */}
      <ContextMenu
        items={menuItems}
        isOpen={resultContextMenu.isOpen}
        position={resultContextMenu.position}
        onClose={resultContextMenu.close}
      />
    </div>
  );
}
