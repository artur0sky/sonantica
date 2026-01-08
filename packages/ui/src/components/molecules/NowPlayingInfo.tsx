import React from "react";
import { cn } from "../../utils";
import { Badge } from "../atoms/Badge";

export interface NowPlayingInfoProps {
  title: string;
  artist: string | string[];
  album?: string;
  statusBadge?: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg";
}

/**
 * molecule for displaying current track information.
 * Follows Sonántica's minimalist and professional aesthetics.
 */
export function NowPlayingInfo({
  title,
  artist,
  album,
  statusBadge,
  className,
  align = "center",
  size = "md",
}: NowPlayingInfoProps) {
  const formattedArtist = Array.isArray(artist) ? artist.join(", ") : artist;

  const alignments = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  const titleSizes = {
    sm: "text-base font-semibold",
    md: "text-xl md:text-2xl font-bold",
    lg: "text-2xl md:text-3xl font-black tracking-tight",
  };

  const artistSizes = {
    sm: "text-xs",
    md: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
  };

  return (
    <div className={cn("flex flex-col gap-1", alignments[align], className)}>
      {statusBadge && <div className="mb-2">{statusBadge}</div>}

      <h2
        className={cn(
          "text-text leading-tight truncate w-full",
          titleSizes[size]
        )}
        title={title}
      >
        {title || "Unknown Title"}
      </h2>

      <p
        className={cn(
          "text-text-muted truncate w-full leading-relaxed",
          artistSizes[size]
        )}
      >
        {formattedArtist || "Unknown Artist"}
      </p>

      {album && (
        <p className="text-xs md:text-sm text-text-muted/60 truncate w-full tracking-wide">
          {album}
        </p>
      )}
    </div>
  );
}
