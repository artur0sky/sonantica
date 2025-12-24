/**
 * Lyrics Display Component
 *
 * "Sound is a form of language."
 *
 * Displays synchronized or unsynchronized lyrics for the current track.
 */

import { useState, useEffect, useRef } from "react";
import { usePlayerStore } from "@sonantica/player-core";
import { LRCParser } from "@sonantica/lyrics";
import { Button, Badge } from "@sonantica/ui";
import { cn } from "@sonantica/shared";
import { IconMicrophone, IconClock } from "@tabler/icons-react";

export function LyricsDisplay() {
  const { currentTrack, currentTime, seek } = usePlayerStore();
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const lyrics = currentTrack?.metadata?.lyrics;

  // Comprehensive logging
  console.log("🎤 LyricsDisplay rendered");
  console.log("📀 Current track:", currentTrack?.metadata?.title || "None");
  console.log("📝 Lyrics available:", !!lyrics);
  if (lyrics) {
    console.log(
      "🎵 Lyrics type:",
      lyrics.isSynchronized ? "Synchronized" : "Unsynchronized"
    );
    console.log("📊 Lyrics data:", {
      hasText: !!lyrics.text,
      hasSynced: !!lyrics.synced,
      syncedLines: lyrics.synced?.length || 0,
      source: lyrics.source,
      language: lyrics.language,
    });
  }

  // Update current line based on playback time
  useEffect(() => {
    if (!lyrics?.synced || lyrics.synced.length === 0) return;

    const currentTimeMs = currentTime * 1000;
    const currentLine = LRCParser.getCurrentLine(lyrics.synced, currentTimeMs);

    if (currentLine) {
      const index = lyrics.synced.findIndex(
        (line) => line.time === currentLine.time
      );
      setCurrentLineIndex(index);
      console.log("🎯 Current lyrics line:", currentLine.text);
    }
  }, [currentTime, lyrics?.synced]);

  // Auto-scroll to current line (only if user is not scrolling)
  useEffect(() => {
    if (isUserScrolling) return;
    if (currentLineRef.current && lyricsContainerRef.current) {
      currentLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentLineIndex, isUserScrolling]);

  // Detect user scroll and pause auto-scroll
  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // User is scrolling
      setIsUserScrolling(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Resume auto-scroll after 3 seconds of no scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 3000);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Handle click on lyric line to seek
  const handleLineClick = (timeMs: number) => {
    const timeInSeconds = timeMs / 1000;
    seek(timeInSeconds);
    // Resume auto-scroll after seeking
    setIsUserScrolling(false);
  };

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
    <div className="h-full flex flex-col">
      {/* Header with badge */}
      <div className="flex items-center justify-center mb-4">
        <Badge
          variant={lyrics.isSynchronized ? "accent" : "default"}
          className="text-xs"
        >
          {lyrics.isSynchronized ? (
            <>
              <IconClock size={14} className="mr-1" stroke={1.5} />
              Synchronized Lyrics
            </>
          ) : (
            "Unsynchronized Lyrics"
          )}
        </Badge>
      </div>

      {/* Lyrics content */}
      <div
        ref={lyricsContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar px-4"
      >
        {lyrics.isSynchronized && lyrics.synced ? (
          <div className="space-y-4 pb-8">
            {lyrics.synced.map((line, index) => (
              <div
                key={`${line.time}-${index}`}
                ref={index === currentLineIndex ? currentLineRef : null}
                onClick={() => handleLineClick(line.time)}
                className={cn(
                  "transition-all duration-300 py-3 px-4 rounded-lg text-center cursor-pointer",
                  index === currentLineIndex
                    ? "bg-accent/10 text-accent font-bold text-lg scale-105 shadow-lg"
                    : "text-text-muted text-base opacity-60 hover:opacity-100 hover:bg-surface-elevated hover:scale-102"
                )}
              >
                <div className="leading-relaxed">{line.text}</div>
              </div>
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
