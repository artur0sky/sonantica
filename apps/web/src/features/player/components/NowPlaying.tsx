/**
 * Now Playing Component
 *
 * Displays current track information with album art.
 * On mobile: Swipe up on cover art to view lyrics.
 */

import { useState } from "react";
import { Badge, Button } from "@sonantica/ui";
import { usePlayerStore } from "@sonantica/player-core";
import { formatArtists, cn } from "@sonantica/shared";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconMusic,
  IconChevronUp,
  IconChevronDown,
  IconMicrophone,
  IconInfoCircle,
} from "@tabler/icons-react";
import { LyricsDisplay } from "./LyricsDisplay";
import { PlayerControls } from "./PlayerControls";
import { Timeline } from "./Timeline";
import { VolumeControl } from "./VolumeControl";

export function NowPlaying() {
  const { currentTrack, state, loadTrack } = usePlayerStore();
  const [showLyrics, setShowLyrics] = useState(false);
  const [activeTab, setActiveTab] = useState<"player" | "lyrics" | "info">(
    "player"
  );

  if (!currentTrack) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted italic text-lg">
          "Every file has an intention."
        </p>
        <p className="text-text-muted text-sm mt-2">
          Load a track from the library or use the demo
        </p>
      </div>
    );
  }

  const hasLyrics = currentTrack.metadata?.lyrics;

  const handleLoadDemo = async () => {
    try {
      await loadTrack({
        id: "demo-1",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        mimeType: "audio/mpeg",
        metadata: {
          title: "SoundHelix Song #1",
          artist: "SoundHelix",
          album: "Demo Album",
        },
      });
    } catch (error) {
      console.error("Failed to load demo:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-surface-elevated rounded-lg overflow-hidden">
        {/* Desktop/Tablet View - Traditional Layout */}
        <div className="hidden md:block p-6 text-center">
          <Badge variant="accent" className="mb-4">
            {state}
          </Badge>

          <h2 className="text-2xl font-bold mb-2">
            {currentTrack.metadata?.title || "Unknown Title"}
          </h2>

          <p className="text-lg text-text-muted mb-1">
            {formatArtists(currentTrack.metadata?.artist)}
          </p>

          <p className="text-sm text-text-muted">
            {currentTrack.metadata?.album || "Unknown Album"}
          </p>
        </div>

        {/* Mobile View - Swipeable Cover Art */}
        <div className="md:hidden">
          <AnimatePresence mode="wait">
            {!showLyrics ? (
              <motion.div
                key="cover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                {/* Album Art with Swipe Indicator */}
                <motion.div
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.y < -50 && hasLyrics) {
                      setShowLyrics(true);
                    }
                  }}
                  className="relative cursor-grab active:cursor-grabbing"
                >
                  {/* Cover Art */}
                  <div className="aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden shadow-2xl bg-surface border border-border relative">
                    {currentTrack.metadata?.coverArt ? (
                      <img
                        src={currentTrack.metadata.coverArt}
                        alt="Album Cover"
                        className="w-full h-full object-cover"
                        draggable="false"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IconMusic
                          size={80}
                          className="text-text-muted/30"
                          stroke={1.5}
                        />
                      </div>
                    )}

                    {/* Swipe Up Indicator */}
                    {hasLyrics && (
                      <motion.div
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1 text-white drop-shadow-lg"
                      >
                        <IconChevronUp size={24} stroke={2} />
                        <span className="text-xs font-medium">
                          Swipe up for lyrics
                        </span>
                      </motion.div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="mt-6 text-center">
                    <Badge variant="accent" className="mb-3">
                      {state}
                    </Badge>

                    <h2 className="text-xl font-bold mb-2">
                      {currentTrack.metadata?.title || "Unknown Title"}
                    </h2>

                    <p className="text-base text-text-muted mb-1">
                      {formatArtists(currentTrack.metadata?.artist)}
                    </p>

                    <p className="text-sm text-text-muted">
                      {currentTrack.metadata?.album || "Unknown Album"}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="lyrics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="relative"
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowLyrics(false)}
                  className="absolute top-4 right-4 z-10 bg-surface-elevated/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-surface transition-colors"
                >
                  <IconChevronDown size={24} stroke={1.5} />
                </button>

                {/* Lyrics Display */}
                <div className="p-6 min-h-[500px]">
                  <LyricsDisplay />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tabs - Integrated from PlayerPage (Desktop primarily) */}
      <div className="hidden md:block bg-surface border border-border rounded-lg overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-border bg-surface-elevated">
          <button
            onClick={() => setActiveTab("player")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
              activeTab === "player"
                ? "bg-surface text-accent border-b-2 border-accent"
                : "text-text-muted hover:text-text hover:bg-surface/50"
            )}
          >
            <IconMusic size={18} stroke={1.5} />
            Player
          </button>
          <button
            onClick={() => setActiveTab("lyrics")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
              activeTab === "lyrics"
                ? "bg-surface text-accent border-b-2 border-accent"
                : "text-text-muted hover:text-text hover:bg-surface/50"
            )}
          >
            <IconMicrophone size={18} stroke={1.5} />
            Lyrics
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
              activeTab === "info"
                ? "bg-surface text-accent border-b-2 border-accent"
                : "text-text-muted hover:text-text hover:bg-surface/50"
            )}
          >
            <IconInfoCircle size={18} stroke={1.5} />
            Info
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "player" && (
            <div className="space-y-6">
              <PlayerControls />
              <Timeline />
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button onClick={handleLoadDemo} variant="ghost" size="sm">
                  🎵 Load Demo Track
                </Button>
                <VolumeControl />
              </div>
            </div>
          )}

          {activeTab === "lyrics" && (
            <div className="min-h-[400px]">
              <LyricsDisplay />
            </div>
          )}

          {activeTab === "info" && (
            <div>
              <h3 className="font-semibold mb-3">About Sonántica</h3>
              <p className="text-sm text-text-muted mb-4">
                Navigate your music library or load a demo track to start
                listening.
              </p>
              <ul className="text-sm text-text-muted space-y-2">
                <li>
                  •{" "}
                  <span className="text-accent font-mono">
                    @sonantica/player-core
                  </span>{" "}
                  - Audio engine
                </li>
                <li>
                  •{" "}
                  <span className="text-accent font-mono">
                    @sonantica/media-library
                  </span>{" "}
                  - Library indexing
                </li>
                <li>
                  •{" "}
                  <span className="text-accent font-mono">
                    @sonantica/lyrics
                  </span>{" "}
                  - Lyrics extraction
                </li>
                <li>
                  •{" "}
                  <span className="text-accent font-mono">@sonantica/web</span>{" "}
                  - This PWA
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
