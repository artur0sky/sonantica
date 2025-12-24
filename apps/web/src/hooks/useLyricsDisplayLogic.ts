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
  
    return {
        currentTrack,
        lyrics,
        currentLineIndex,
        lyricsContainerRef,
        currentLineRef,
        handleLineClick,
    };
}
