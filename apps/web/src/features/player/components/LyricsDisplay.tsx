import { Button, Badge } from "@sonantica/ui";
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
      <div className="flex items-center justify-center mb-4 relative z-10 bg-bg/50 backdrop-blur-sm p-2 rounded-full mx-auto">
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
              "text-xs px-4 py-1.5 transition-all",
              isUserScrolling && lyrics.isSynchronized
                ? "bg-accent text-white shadow-lg scale-110 hover:bg-accent-hover active:scale-95"
                : "opacity-80"
            )}
          >
            {lyrics.isSynchronized ? (
              <>
                <IconClock
                  size={14}
                  className={cn("mr-1", isUserScrolling && "animate-pulse")}
                  stroke={1.5}
                />
                {isUserScrolling ? "Sync Now" : "Synchronized Lyrics"}
              </>
            ) : (
              "Unsynchronized Lyrics"
            )}
          </Badge>
        </button>
      </div>

      {/* Lyrics content */}
      <div
        ref={lyricsContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar px-4 relative"
      >
        {lyrics.isSynchronized && lyrics.synced ? (
          <div className="space-y-4 pt-4 pb-[50dvh]">
            {lyrics.synced.map((line: any, index: number) => (
              <div
                key={`${line.time}-${index}`}
                ref={index === currentLineIndex ? currentLineRef : null}
                onClick={() => handleLineClick(line.time)}
                className={cn(
                  "transition-all duration-300 py-4 px-6 rounded-2xl text-center cursor-pointer select-none",
                  index === currentLineIndex
                    ? "bg-accent/20 text-accent font-bold text-2xl scale-110 shadow-xl blur-0"
                    : "text-text-muted text-lg opacity-30 hover:opacity-60 hover:bg-surface-elevated blur-[1px] hover:blur-0 scale-95"
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
