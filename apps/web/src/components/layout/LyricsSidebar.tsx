/**
 * Lyrics Sidebar
 *
 * "Sound is a form of language."
 *
 * Displays synchronized or unsynchronized lyrics for the current track.
 * Follows the same design pattern as RightSidebar (Queue).
 */

import { IconX, IconMicrophone, IconClock } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { Badge } from "@sonantica/ui";
import { cn } from "@sonantica/shared";
import { useLyricsLogic } from "../../hooks/useLyricsLogic";

const itemVariants: Variants = {
  hidden: { x: 20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    x: -20,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

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
    lyricsContainerRef,
    currentLineRef,
    handleLineClick,
  } = useLyricsLogic();

  if (!lyricsOpen) return null;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className="flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div
        className={cn(
          "p-4 border-b border-border flex items-center justify-between transition-all",
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
            <Badge
              variant={lyrics.isSynchronized ? "accent" : "default"}
              className="text-[10px] px-2 py-0.5 font-sans"
            >
              {lyrics.isSynchronized ? (
                <>
                  <IconClock size={12} className="mr-1" stroke={1.5} />
                  Synced
                </>
              ) : (
                "Text"
              )}
            </Badge>
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
          "flex-1 overflow-y-auto custom-scrollbar transition-all",
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
          <div className="space-y-3">
            <AnimatePresence mode="sync">
              {lyrics.synced.map((line, index) => (
                <motion.div
                  key={`${line.time}-${index}`}
                  ref={index === currentLineIndex ? currentLineRef : null}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onClick={() => handleLineClick(line.time)}
                  className={cn(
                    "transition-all duration-300 py-3 px-4 rounded-lg text-center cursor-pointer",
                    index === currentLineIndex
                      ? "bg-accent/10 text-accent font-bold text-base scale-105 shadow-lg"
                      : "text-text-muted text-sm opacity-60 hover:opacity-100 hover:bg-surface-elevated hover:scale-102"
                  )}
                >
                  <div className="leading-relaxed">{line.text}</div>
                </motion.div>
              ))}
            </AnimatePresence>
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
