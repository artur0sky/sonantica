import { useState, useRef, useEffect } from "react";
import { usePlayerStore } from "@sonantica/player-core";
import { useUIStore } from "@sonantica/ui";
import { LRCParser } from "@sonantica/lyrics";

export function useLyricsLogic() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const seek = usePlayerStore((s) => s.seek);
  const { lyricsOpen, toggleLyrics } = useUIStore();
  
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const lyrics = currentTrack?.metadata?.lyrics;

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
    }
  }, [currentTime, lyrics?.synced]);

  // Auto-scroll to keep current line centered (only if user is not scrolling)
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
    lyricsOpen,
    toggleLyrics,
    currentTrack,
    lyrics,
    currentLineIndex,
    lyricsContainerRef,
    currentLineRef,
    handleLineClick,
  };
}
