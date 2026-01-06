/**
 * Lyrics Sidebar
 *
 * "Sound is a form of language."
 *
 * Displays synchronized or unsynchronized lyrics for the current track.
 * Follows the same design pattern as RightSidebar (Queue).
 */

import { IconX, IconMicrophone, IconClock } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Badge } from "@sonantica/ui";
import { cn } from "@sonantica/shared";
import { useLyricsLogic } from "../../hooks/useLyricsLogic";

interface LyricsSidebarProps {
  isCollapsed?: boolean;
}

export function LyricsSidebar({ isCollapsed }: LyricsSidebarProps) {
  const {
    lyricsOpen,
    toggleLyrics,
    currentTrack,
    lyrics,
    currentLineIndex,
    isUserScrolling,
    lyricsContainerRef,
    currentLineRef,
    handleLineClick,
    scrollToCurrentLine,
  } = useLyricsLogic();

  if (!lyricsOpen) return null;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className="flex flex-col h-full overflow-hidden relative"
    >
      {/* Header */}
      <div
        className={cn(
          "p-4 border-b border-border flex items-center justify-between transition-all relative z-10 bg-surface",
          isCollapsed && "flex-col gap-4 px-2"
        )}
      >
        {!isCollapsed && (
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold truncate tracking-tight">
              Lyrics
            </h2>
            {currentTrack && (
              <span className="text-[10px] text-text-muted font-sans uppercase tracking-wider">
                {currentTrack.metadata?.title || "Unknown Title"}
              </span>
            )}
          </div>
        )}
        <div
          className={cn("flex items-center gap-2", isCollapsed && "flex-col")}
        >
          {lyrics && (
            <button
              onClick={scrollToCurrentLine}
              disabled={!isUserScrolling}
              className={cn(
                "transition-all duration-300",
                !isUserScrolling && "pointer-events-none"
              )}
            >
              <Badge
                variant={lyrics.isSynchronized ? "accent" : "default"}
                className={cn(
                  "text-[10px] px-2 py-0.5 font-sans transition-all",
                  isUserScrolling && lyrics.isSynchronized
                    ? "bg-accent text-white shadow-lg scale-110 hover:bg-accent-hover active:scale-95"
                    : "opacity-80"
                )}
              >
                {lyrics.isSynchronized ? (
                  <>
                    <IconClock
                      size={12}
                      className={cn("mr-1", isUserScrolling && "animate-pulse")}
                      stroke={1.5}
                    />
                    {isUserScrolling ? "Sync Now" : "Synced"}
                  </>
                ) : (
                  "Text"
                )}
              </Badge>
            </button>
          )}
          <motion.button
            onClick={toggleLyrics}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="text-text-muted hover:text-text p-1 transition-fast"
            aria-label="Close lyrics"
          >
            <IconX size={20} stroke={1.5} />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={lyricsContainerRef}
        className={cn(
          "flex-1 overflow-y-auto custom-scrollbar transition-all relative",
          isCollapsed ? "p-2" : "p-4 lg:p-3"
        )}
      >
        {!currentTrack ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <IconMicrophone
              size={48}
              className="text-text-muted/30 mb-4"
              stroke={1.5}
            />
            <p className="text-text-muted italic text-sm">
              "Every word has its moment."
            </p>
            <p className="text-text-muted text-xs mt-2">
              Load a track to view lyrics
            </p>
          </div>
        ) : !lyrics ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <IconMicrophone
              size={48}
              className="text-text-muted/30 mb-4"
              stroke={1.5}
            />
            <p className="text-text-muted text-sm">No lyrics available</p>
            <p className="text-text-muted text-xs mt-2">
              {currentTrack.metadata?.title || "Unknown Title"}
            </p>
          </div>
        ) : lyrics.isSynchronized && lyrics.synced ? (
          <div className="space-y-4 pt-4 pb-[50dvh]">
            {lyrics.synced.map((line, index) => (
              <div
                key={`${line.time}-${index}`}
                ref={index === currentLineIndex ? currentLineRef : null}
                onClick={() => handleLineClick(line.time)}
                className={cn(
                  "transition-all duration-300 py-4 px-6 rounded-2xl text-center cursor-pointer select-none",
                  index === currentLineIndex
                    ? "bg-accent/20 text-accent font-bold text-xl scale-110 shadow-xl blur-0"
                    : "text-text-muted text-base opacity-30 hover:opacity-60 hover:bg-surface-elevated blur-[0.5px] hover:blur-0 scale-95"
                )}
              >
                <div className="leading-relaxed">{line.text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-text-muted leading-relaxed text-sm">
            {lyrics.text}
          </div>
        )}
      </div>
    </motion.div>
  );
}
