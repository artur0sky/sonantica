/**
 * Header Component
 *
 * Application header with global search and navigation.
 */

import { Link, useLocation } from "wouter";
import { IconMenu2, IconUser, IconSettings } from "@tabler/icons-react";
import { motion } from "framer-motion";
import {
  Button,
  SearchBar as GlobalSearchBar,
  useUIStore,
} from "@sonantica/ui";
import { useLibraryStore } from "@sonantica/media-library";
import { usePlayerStore, useQueueStore } from "@sonantica/player-core";

export function Header() {
  const { toggleLeftSidebar } = useUIStore();
  const [, setLocation] = useLocation();
  const { loadTrack, play } = usePlayerStore();
  const { setQueue } = useQueueStore();
  const { albums } = useLibraryStore();

  const handleSearchResultSelect = async (result: any) => {
    switch (result.type) {
      case "track": {
        const track = result.data;
        // Find the album this track belongs to to queue the context
        const album = albums.find(
          (a) =>
            a.name === track.metadata.album &&
            a.artist === track.metadata.artist
        );

        if (album) {
          const trackIndex = album.tracks.findIndex((t) => t.id === track.id);
          const tracksAsSources = album.tracks.map((t) => ({
            ...t,
            url: t.path,
          }));
          setQueue(tracksAsSources, trackIndex >= 0 ? trackIndex : 0);
        } else {
          setQueue([{ ...track, url: track.path }], 0);
        }

        await loadTrack({ ...track, url: track.path });
        await play();
        break;
      }

      case "artist":
        setLocation(`/artist/${result.id}`);
        break;

      case "album":
        setLocation(`/album/${result.id}`);
        break;

      case "genre":
      case "year":
        setLocation("/tracks");
        break;
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 border-b border-border bg-surface flex items-center px-4 gap-4 select-none z-30"
    >
      {/* Left: Menu + Logo */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLeftSidebar}
          className="text-text-muted hover:text-text"
        >
          <IconMenu2 size={24} stroke={1.5} />
        </Button>

        <Link href="/">
          <a className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-lg"
            >
              S
            </motion.div>
            <span className="text-xl font-bold tracking-tight group-hover:text-accent transition-colors hidden md:inline">
              Sonántica
            </span>
          </a>
        </Link>
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-2xl mx-auto">
        <GlobalSearchBar onResultSelect={handleSearchResultSelect} />
      </div>

      {/* Right: Settings + User */}
      <div className="flex-1 flex items-center justify-end gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-text-muted hover:text-text"
        >
          <IconSettings size={20} stroke={1.5} />
        </Button>

        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted hover:text-text hover:bg-accent/20 cursor-pointer transition-colors">
          <IconUser size={20} stroke={1.5} />
        </div>
      </div>
    </motion.header>
  );
}
