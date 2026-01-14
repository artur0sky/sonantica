/**
 * Lyrics Display Container
 *
 * Connected component that wires the LyricsView organism
 * with the synchronized lyrics logic.
 */

import { LyricsView } from "@sonantica/ui";
import { useLyricsDisplayLogic } from "../../../hooks/useLyricsDisplayLogic";

export function LyricsDisplay() {
  const {
    currentTrack,
    lyrics,
    currentLineIndex,
    isUserScrolling,
    handleLineClick,
    scrollToCurrentLine,
  } = useLyricsDisplayLogic();

  return (
    <LyricsView
      lyrics={lyrics}
      currentTrackTitle={currentTrack?.metadata?.title}
      currentLineIndex={currentLineIndex}
      isUserScrolling={isUserScrolling}
      onLineClick={handleLineClick}
      onReturnToCurrent={scrollToCurrentLine}
      onSynchronize={() => console.log("Sync mode not implemented yet")}
    />
  );
}
