/**
 * Track Card Component
 *
 * Unified, reusable track display component.
 * Used in Queue, Track Lists, Search Results, etc.
 * Adapts behavior based on context (draggable, selectable, etc.)
 */

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "../../utils";
import { formatTime } from "@sonantica/shared";
import { formatArtists } from "@sonantica/shared";
import {
  IconMusic,
  IconPlayerPlay,
  IconGripVertical,
  IconHeart,
  IconHeartFilled,
} from "@tabler/icons-react";
import { Badge } from "../atoms";

interface TrackCardProps {
  track: any;
  onPlay?: () => void;

  // Context variants
  isDraggable?: boolean;
  isActive?: boolean;
  isPlaying?: boolean;

  // Display options
  showDuration?: boolean;
  showExtension?: boolean;
  showRating?: boolean;
  showIndex?: boolean;
  index?: number;

  // Drag controls (for reorderable lists)
  dragControls?: any;

  // Styling
  variant?: "queue" | "list" | "compact";
  className?: string;
}

export function TrackCard({
  track,
  onPlay,
  isDraggable = false,
  isActive = false,
  isPlaying = false,
  showDuration = true,
  showExtension = true,
  showRating = false,
  showIndex = false,
  index,
  dragControls,
  variant = "list",
  className,
}: TrackCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const getExtension = (url: string) => {
    const parts = url.split(".");
    return parts[parts.length - 1]?.toUpperCase() || "MP3";
  };

  const getBadgeClass = (ext: string) => {
    const lossless = ["FLAC", "WAV", "ALAC", "APE", "DSD"];
    const highQuality = ["OGG", "OPUS", "M4A", "AAC"];

    if (lossless.includes(ext)) {
      return "bg-accent/20 text-accent border-accent/30";
    }
    if (highQuality.includes(ext)) {
      return "bg-success/20 text-success border-success/30";
    }
    return "bg-text-muted/10 text-text-muted border-text-muted/20";
  };

  const ext = getExtension(track.url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2 transition-all select-none",
        "hover:bg-white/[0.02]",
        isActive && "bg-accent/5",
        variant === "queue" && "rounded-lg",
        className
      )}
    >
      {/* Drag Handle (Queue only) */}
      {isDraggable && dragControls && (
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="w-5 h-10 flex items-center justify-center text-text-muted/20 group-hover:text-text-muted/60 cursor-grab active:cursor-grabbing transition-colors"
        >
          <IconGripVertical size={16} stroke={1.5} />
        </div>
      )}

      {/* Index or Play Button */}
      <div className="w-8 flex items-center justify-center">
        {isHovered || isPlaying ? (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={onPlay}
            className="w-8 h-8 rounded-full bg-accent/10 hover:bg-accent/20 flex items-center justify-center text-accent transition-colors"
          >
            <IconPlayerPlay size={16} className="fill-current" stroke={0} />
          </motion.button>
        ) : showIndex && index !== undefined ? (
          <span className="text-xs text-text-muted/50 font-mono tabular-nums">
            {index + 1}
          </span>
        ) : null}
      </div>

      {/* Album Art */}
      <div
        className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-surface relative shadow-sm cursor-pointer group/cover"
        onClick={onPlay}
      >
        {track.metadata?.coverArt ? (
          <img
            src={track.metadata.coverArt}
            alt="Cover"
            className="w-full h-full object-cover transition-transform group-hover/cover:scale-110 select-none pointer-events-none"
            draggable="false"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IconMusic size={16} className="text-text-muted/30" stroke={1.5} />
          </div>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity">
          <IconPlayerPlay size={18} className="text-white fill-current" />
        </div>
      </div>

      {/* Track Info */}
      <div className="min-w-0 flex-1 cursor-pointer" onClick={onPlay}>
        <div
          className={cn(
            "font-medium truncate text-sm transition-colors",
            isActive ? "text-accent" : "text-text group-hover:text-accent"
          )}
        >
          {track.metadata?.title || "Unknown Title"}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted truncate">
          <span className="truncate opacity-70">
            {formatArtists(track.metadata?.artist)}
          </span>

          {/* Bitrate on hover */}
          {track.metadata?.bitrate && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                width: isHovered ? "auto" : 0,
              }}
              className="text-[9px] text-accent font-mono bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20 whitespace-nowrap overflow-hidden"
            >
              {track.metadata.bitrate}k
            </motion.span>
          )}
        </div>
      </div>

      {/* Rating (Stars/Heart) */}
      {showRating && (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className="text-text-muted/40 hover:text-error transition-colors"
          >
            {isFavorite ? (
              <IconHeartFilled size={16} className="text-error" />
            ) : (
              <IconHeart size={16} />
            )}
          </button>
        </div>
      )}

      {/* Duration & Extension */}
      <div className="flex items-center gap-2 min-w-fit">
        {showDuration && (
          <span
            className={cn(
              "text-xs text-text-muted tabular-nums font-mono transition-opacity",
              isHovered ? "opacity-100" : "opacity-50"
            )}
          >
            {formatTime(track.metadata?.duration || 0)}
          </span>
        )}

        {showExtension && (
          <Badge
            variant="custom"
            className={cn(
              "text-[8px] px-1.5 py-0.5 transition-all",
              getBadgeClass(ext),
              !["FLAC", "WAV"].includes(ext) && !isHovered && "opacity-0"
            )}
          >
            {ext}
          </Badge>
        )}
      </div>

      {/* Subtle active indicator */}
      {isActive && (
        <motion.div
          layoutId="active-track"
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent rounded-r-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
}
