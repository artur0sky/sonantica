import { useState, useEffect, useRef } from "react";
import { usePlayerStore } from "@sonantica/player-core";
import { LRCParser } from "@sonantica/lyrics";

export function useLyricsDisplayLogic() {
  const { currentTrack, currentTime, seek } = usePlayerStore();
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const lyrics = currentTrack?.metadata?.lyrics;

  // Comprehensive logging
  useEffect(() => {
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
  }, [currentTrack, lyrics]);


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

  // Detect user interaction with the lyrics container
  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (!container) return;

    const startUserInteraction = () => {
      setIsUserScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsUserScrolling(false);
      }, 5000); // 5 seconds of no interaction to resume auto-scroll
    };

    // Events that definitely indicate user intent to scroll/move
    container.addEventListener("wheel", startUserInteraction, { passive: true });
    container.addEventListener("touchmove", startUserInteraction, { passive: true });
    container.addEventListener("mousedown", startUserInteraction, { passive: true });

    return () => {
      container.removeEventListener("wheel", startUserInteraction);
      container.removeEventListener("touchmove", startUserInteraction);
      container.removeEventListener("mousedown", startUserInteraction);
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
    scrollToCurrentLine();
  };

  const scrollToCurrentLine = () => {
    setIsUserScrolling(false);
    if (currentLineRef.current && lyricsContainerRef.current) {
      currentLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };
  
    return {
        currentTrack,
        lyrics,
        currentLineIndex,
        isUserScrolling,
        lyricsContainerRef,
        currentLineRef,
        handleLineClick,
        scrollToCurrentLine,
    };
}
