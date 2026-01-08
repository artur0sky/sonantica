import React, { useRef, useEffect } from "react";
import { cn } from "../../utils";
import { IconMicrophone, IconClock } from "@tabler/icons-react";
import { Lyrics } from "@sonantica/shared";

export interface LyricsViewProps {
  lyrics?: Lyrics;
  currentTrackTitle?: string;
  currentLineIndex?: number;
  isUserScrolling?: boolean;
  onLineClick?: (time: number) => void;
  onReturnToCurrent?: () => void;
  onSynchronize?: () => void;
}

/**
 * LyricsView Organism
 *
 * Displays lyrics with support for synchronization and user interaction.
 * Refactored to use CSS transitions for high performance and zero Framer Motion.
 * Uses shared domain types.
 */
export function LyricsView({
  lyrics,
  currentTrackTitle,
  currentLineIndex = -1,
  isUserScrolling = false,
  onLineClick,
  onReturnToCurrent,
  onSynchronize,
}: LyricsViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current line if not user scrolling
  useEffect(() => {
    if (
      !isUserScrolling &&
      currentLineIndex >= 0 &&
      currentLineRef.current &&
      containerRef.current
    ) {
      currentLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentLineIndex, isUserScrolling]);

  if (!lyrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-in fade-in duration-500">
        <IconMicrophone
          size={48}
          className="text-text-muted/20 mb-6"
          stroke={1.5}
        />
        <p className="text-text-muted italic opacity-60">
          "Every word has its moment."
        </p>
        <p className="text-text-muted text-xs mt-3 uppercase tracking-widest font-bold">
          Waiting for track...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden group/lyrics">
      {/* Scroll indicator overlay */}
      <div
        className={cn(
          "absolute top-6 left-0 right-0 flex items-center justify-center z-20 transition-all duration-300 pointer-events-none",
          isUserScrolling
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReturnToCurrent?.();
          }}
          className="bg-accent text-white px-6 py-2.5 rounded-full shadow-2xl shadow-accent/40 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all pointer-events-auto"
        >
          <IconClock size={16} stroke={3} />
          Return to Sync
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 md:px-12 relative scroll-smooth thin-scrollbar"
      >
        {lyrics.isSynchronized && lyrics.synced ? (
          <div className="space-y-4 pt-[35dvh] pb-[50dvh]">
            {lyrics.synced.map((line, index) => {
              const isActive = index === currentLineIndex;
              return (
                <div
                  key={`${line.time}-${index}`}
                  ref={isActive ? currentLineRef : null}
                  onClick={() =>
                    line.time !== undefined && onLineClick?.(line.time)
                  }
                  className={cn(
                    "transition-all duration-700 py-6 px-10 rounded-[2rem] text-center cursor-pointer select-none group",
                    isActive
                      ? "text-white scale-105 bg-accent/5 backdrop-blur-sm"
                      : "text-text-muted/40 hover:text-text-muted hover:opacity-100"
                  )}
                >
                  <div
                    className={cn(
                      "leading-snug font-black transition-all duration-700",
                      isActive
                        ? "text-3xl md:text-5xl drop-shadow-sm"
                        : "text-2xl md:text-3xl opacity-60"
                    )}
                  >
                    {line.text}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-xl mx-auto py-10 space-y-8 text-center animate-in fade-in duration-500">
            <div className="whitespace-pre-wrap text-lg md:text-xl text-text-muted/80 leading-relaxed font-medium italic">
              {lyrics.text || "No lyrics content found."}
            </div>
            {onSynchronize && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={onSynchronize}
                  className="px-6 py-3 rounded-xl border border-border/20 text-text-muted hover:text-accent hover:border-accent/40 transition-all text-sm font-bold uppercase tracking-[0.2em]"
                >
                  <IconClock
                    size={18}
                    className="inline-block mr-3"
                    stroke={1.5}
                  />
                  Synchronize Mode
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
