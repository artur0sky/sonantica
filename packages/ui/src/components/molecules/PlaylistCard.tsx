import React from "react";
import { IconPlaylist, IconPlayerPlay } from "@tabler/icons-react";
import { MediaCard } from "./MediaCard";
import { CoverArt } from "../atoms/CoverArt";

export interface PlaylistCardProps {
  playlist: {
    id: string;
    name: string;
    type: string; // 'MANUAL' | 'SMART' | 'GENERATED' | 'HISTORY_SNAPSHOT'
    coverArts?: string[];
    trackCount?: number;
    description?: string;
  };
  onClick?: () => void;
  onPlay?: () => void;
  className?: string;
  selected?: boolean;
  isInSelectionMode?: boolean;
  onSelectionToggle?: (id: string) => void;
  /** Rest props for context menu, etc. */
  [key: string]: any;
}

export const PlaylistCard = React.forwardRef<HTMLDivElement, PlaylistCardProps>(
  (
    {
      playlist,
      onClick,
      onPlay,
      className,
      selected = false,
      isInSelectionMode = false,
      onSelectionToggle,
      ...props
    },
    ref
  ) => {
    // Determine grid vs single cover
    const hasGrid = playlist.coverArts && playlist.coverArts.length >= 4;
    const coverArts = playlist.coverArts || [];

    const handleClick = (e: React.MouseEvent) => {
      if (isInSelectionMode && onSelectionToggle) {
        e.preventDefault();
        e.stopPropagation();
        onSelectionToggle(playlist.id);
      } else {
        onClick?.();
      }
    };

    return (
      <MediaCard
        ref={ref}
        title={playlist.name}
        subtitle={
          <div className="flex items-center text-xs text-text-muted mt-1 uppercase tracking-wider font-medium opacity-60">
            {playlist.type === "HISTORY_SNAPSHOT" ? (
              <span>History Snapshot</span>
            ) : (
              <span>
                {playlist.trackCount || 0} track
                {playlist.trackCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        }
        image={
          hasGrid ? (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full rounded-md overflow-hidden shadow-2xl">
              {coverArts.slice(0, 4).map((art: string, i: number) => (
                <CoverArt
                  key={i}
                  src={art}
                  alt=""
                  className="w-full h-full object-cover rounded-none"
                  iconSize={16}
                />
              ))}
            </div>
          ) : (
            <CoverArt
              src={coverArts[0]}
              alt={playlist.name}
              className="w-full h-full shadow-2xl"
              iconSize={48}
              fallbackIcon={IconPlaylist}
            />
          )
        }
        badge={
          <div className="flex gap-1">
            {playlist.type === "SMART" && (
              <div className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/80 text-white backdrop-blur-sm">
                SMART
              </div>
            )}
            {playlist.type === "GENERATED" && (
              <div className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/80 text-white backdrop-blur-sm">
                MIX
              </div>
            )}
          </div>
        }
        hoverOverlay={
          !isInSelectionMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay?.();
              }}
              className="p-3 rounded-full bg-accent text-white shadow-xl hover:bg-accent-light transform transition-transform hover:scale-110 active:scale-95"
            >
              <IconPlayerPlay className="fill-current" size={24} />
            </button>
          )
        }
        onClick={handleClick}
        selected={selected}
        isSelectionMode={isInSelectionMode}
        className={className}
        {...props}
      />
    );
  }
);

PlaylistCard.displayName = "PlaylistCard";
