/**
 * Lyrics Display Component
 *
 * "Sound is a form of language."
 *
 * Displays synchronized or unsynchronized lyrics for the current track.
 */

import { Button, Badge } from "@sonantica/ui";
import { cn } from "@sonantica/shared";
import { IconMicrophone, IconClock } from "@tabler/icons-react";
import { useLyricsDisplayLogic } from "../../../hooks/useLyricsDisplayLogic";

export function LyricsDisplay() {
  const {
    currentTrack,
    lyrics,
    currentLineIndex,
    lyricsContainerRef,
    currentLineRef,
    handleLineClick,
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
            {lyrics.synced.map((line: any, index: number) => (
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
