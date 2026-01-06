import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@sonantica/ui";
import { cn } from "@sonantica/shared";
import { IconMicrophone, IconClock } from "@tabler/icons-react";
import { useLyricsDisplayLogic } from "../../../hooks/useLyricsDisplayLogic";

export function LyricsDisplay() {
  const {
    currentTrack,
    lyrics,
    currentLineIndex,
    isUserScrolling,
    lyricsContainerRef,
    currentLineRef,
    handleLineClick,
    scrollToCurrentLine,
  } = useLyricsDisplayLogic();

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <IconMicrophone
          size={48}
          className="text-text-muted/30 mb-4"
          stroke={1.5}
        />
        <p className="text-text-muted italic">"Every word has its moment."</p>
        <p className="text-text-muted text-sm mt-2">
          Load a track to view lyrics
        </p>
      </div>
    );
  }

  if (!lyrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <IconMicrophone
          size={48}
          className="text-text-muted/30 mb-4"
          stroke={1.5}
        />
        <p className="text-text-muted">No lyrics available for this track</p>
        <p className="text-text-muted text-sm mt-2">
          {currentTrack.metadata?.title || "Unknown Title"}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Header with badge */}
      <AnimatePresence>
        {isUserScrolling && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 flex items-center justify-center z-20 pt-4"
          >
            <button
              onClick={scrollToCurrentLine}
              className="bg-accent text-white px-6 py-2 rounded-full shadow-2xl shadow-accent/40 font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
            >
              <IconClock size={16} stroke={2.5} />
              Return to Current
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lyrics content */}
      <div
        ref={lyricsContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-12 relative"
      >
        {lyrics.isSynchronized && lyrics.synced ? (
          <div className="space-y-6 pt-[20dvh] pb-[60dvh]">
            {lyrics.synced.map((line: any, index: number) => (
              <motion.div
                key={`${line.time}-${index}`}
                ref={index === currentLineIndex ? currentLineRef : null}
                onClick={() => handleLineClick(line.time)}
                initial={false}
                animate={{
                  opacity: index === currentLineIndex ? 1 : 0.25,
                  scale: index === currentLineIndex ? 1.05 : 0.95,
                  filter:
                    index === currentLineIndex ? "blur(0px)" : "blur(2px)",
                }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={cn(
                  "transition-colors duration-500 py-6 px-8 rounded-3xl text-center cursor-pointer select-none group",
                  index === currentLineIndex
                    ? "text-white"
                    : "text-text-muted hover:text-text hover:opacity-100 hover:filter-none"
                )}
              >
                <div
                  className={cn(
                    "leading-relaxed font-black transition-all duration-500",
                    index === currentLineIndex
                      ? "text-3xl md:text-5xl"
                      : "text-2xl md:text-3xl opacity-40 group-hover:opacity-80"
                  )}
                >
                  {line.text}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="whitespace-pre-wrap text-text-muted leading-relaxed">
              {lyrics.text}
            </div>
            <div className="flex justify-center pt-4">
              <Button variant="ghost" size="sm">
                <IconClock size={16} className="mr-2" stroke={1.5} />
                Synchronize Lyrics
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
