import React from "react";
import { motion } from "framer-motion";
import {
  IconPlaylist,
  IconPlayerPlay,
  IconCircleCheckFilled,
} from "@tabler/icons-react";
import { cn } from "@sonantica/shared";
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
  contextMenuProps?: any; // For spread
  selected?: boolean;
  isInSelectionMode?: boolean;
  onSelectionToggle?: (id: string) => void;
}

export const PlaylistCard = React.forwardRef<HTMLDivElement, PlaylistCardProps>(
  (
    {
      playlist,
      onClick,
      onPlay,
      className,
      contextMenuProps,
      selected,
      isInSelectionMode,
      onSelectionToggle,
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
      <motion.div
        ref={ref}
        layout
        whileHover={{ translateY: -4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group relative flex flex-col gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors cursor-pointer",
          selected &&
            "bg-accent/10 ring-2 ring-accent ring-offset-2 ring-offset-bg",
          className
        )}
        onClick={handleClick}
        {...contextMenuProps}
      >
        {/* Selection Checkbox Overlay */}
        {isInSelectionMode && (
          <div
            className={cn(
              "absolute top-2 right-2 z-20 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
              selected
                ? "bg-accent border-accent"
                : "bg-bg/80 backdrop-blur-sm border-white/30"
            )}
          >
            {selected && (
              <IconCircleCheckFilled size={20} className="text-white" />
            )}
          </div>
        )}

        {/* Cover Art Container */}
        <div className="relative aspect-square w-full overflow-hidden rounded-md shadow-sm bg-surface-base">
          {hasGrid ? (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
              {coverArts.slice(0, 4).map((art, i) => (
                <div
                  key={i}
                  className="w-full h-full relative overflow-hidden text-[0]"
                >
                  <CoverArt
                    src={art}
                    alt=""
                    className="w-full h-full object-cover rounded-none"
                    iconSize={16}
                  />
                </div>
              ))}
            </div>
          ) : (
            <CoverArt
              src={coverArts[0]}
              alt={playlist.name}
              className="w-full h-full text-text-muted"
              iconSize={48}
              fallbackIcon={IconPlaylist}
            />
          )}

          {/* Hover Play Button */}
          {!isInSelectionMode && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay?.();
                }}
                className="p-3 rounded-full bg-accent text-white shadow-xl hover:bg-accent-light"
              >
                <IconPlayerPlay className="fill-current" size={24} />
              </motion.button>
            </div>
          )}

          {/* Type Badge (if special) */}
          {playlist.type === "SMART" && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/80 text-white backdrop-blur-sm">
              SMART
            </div>
          )}
          {playlist.type === "GENERATED" && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/80 text-white backdrop-blur-sm">
              MIX
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-0.5">
          <h3 className="font-medium text-text truncate group-hover:text-accent transition-colors">
            {playlist.name}
          </h3>
          <div className="flex items-center text-xs text-text-muted">
            {playlist.type === "HISTORY_SNAPSHOT" ? (
              <span>
                History •{" "}
                {new Date(playlist.description || "").toLocaleDateString()}
              </span>
            ) : (
              <span>{playlist.trackCount || 0} tracks</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

PlaylistCard.displayName = "PlaylistCard";
