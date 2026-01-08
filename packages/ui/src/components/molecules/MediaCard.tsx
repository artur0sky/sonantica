import React, { HTMLAttributes, ReactNode } from "react";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import { cn } from "../../utils";

export interface MediaCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Title of the card */
  title: string;

  /** Subtitle content (e.g., artist name or track count) */
  subtitle?: ReactNode;

  /** Image content (CoverArt, ArtistImage, or custom node) */
  image: ReactNode;

  /** Whether the card is currently selected */
  selected?: boolean;

  /** Whether the parent UI is in selection mode */
  isSelectionMode?: boolean;

  /** Shape of the image container */
  imageShape?: "square" | "circle";

  /** Optional overlay shown on hover */
  hoverOverlay?: ReactNode;

  /** Optional badge shown on top of the image */
  badge?: ReactNode;

  /** Whether to animate in on mount */
  animate?: boolean;
}

export const MediaCard = React.forwardRef<HTMLDivElement, MediaCardProps>(
  (
    {
      title,
      subtitle,
      image,
      selected = false,
      isSelectionMode = false,
      imageShape = "square",
      hoverOverlay,
      badge,
      className,
      animate = true,
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "group relative cursor-pointer p-4 rounded-xl",
          "gpu-accelerated smooth-interaction transition-all duration-300",
          "hover:bg-surface-elevated hover:-translate-y-2 hover:scale-[1.02]",
          "active:scale-[0.98]",
          selected &&
            "bg-accent/10 ring-2 ring-accent ring-offset-2 ring-offset-bg",
          animate && "animate-in fade-in zoom-in-95 duration-300",
          className
        )}
        style={{ transform: "translateZ(0)" }}
        {...props}
      >
        {/* Selection Checkbox Overlay */}
        {isSelectionMode && (
          <div
            className={cn(
              "absolute top-6 right-6 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
              selected
                ? "bg-accent border-accent scale-110 shadow-lg"
                : "bg-bg/80 backdrop-blur-sm border-white/30"
            )}
          >
            {selected && (
              <IconCircleCheckFilled size={20} className="text-white" />
            )}
          </div>
        )}

        {/* Image Container */}
        <div
          className={cn(
            "aspect-square mb-4 relative overflow-hidden select-none",
            imageShape === "circle" ? "rounded-full" : "rounded-lg shadow-lg"
          )}
        >
          <div className="w-full h-full transform transition-transform duration-500 group-hover:scale-110">
            {image}
          </div>

          {badge && (
            <div className="absolute top-2 left-2 z-10 pointer-events-none">
              {badge}
            </div>
          )}

          {/* Hover Overlay */}
          {hoverOverlay && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
              {hoverOverlay}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="text-center transition-all duration-300">
          <h3
            className={cn(
              "font-semibold text-base truncate mb-1 transition-colors duration-300",
              "group-hover:text-accent"
            )}
            title={title}
          >
            {title}
          </h3>
          {subtitle && (
            <div className="text-sm text-text-muted truncate">{subtitle}</div>
          )}
        </div>
      </div>
    );
  }
);

MediaCard.displayName = "MediaCard";
