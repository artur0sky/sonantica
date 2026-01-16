/**
 * TrackItem Molecule
 *
 * A pure UI component for displaying a track row in lists.
 * Handles styling for active, playing, and selection states.
 *
 * @package @sonantica/ui
 * @category Molecules
 */

import React, { HTMLAttributes, ReactNode } from "react";
import {
  IconCircleCheckFilled,
  IconPlayerPlay,
  IconPlayerPause,
  IconCloud,
  IconDeviceDesktop,
} from "@tabler/icons-react";
import { cn } from "../../utils";
import { AudioFormat } from "@sonantica/shared";

export interface TrackItemProps extends HTMLAttributes<HTMLDivElement> {
  /** Track title */
  title: string;

  /** Artist name or formatted artists */
  artist: ReactNode;

  /** Album title */
  album?: string;

  /** Track duration in seconds */
  duration?: number;

  /** Image content (CoverArt) */
  image?: ReactNode;

  /** Whether this track is the one currently loaded in the player */
  isActive?: boolean;

  /** Whether this track is currently playing */
  isPlaying?: boolean;

  /** Whether the parent UI is in selection mode */
  isSelectionMode?: boolean;

  /** Whether this track is selected */
  isSelected?: boolean;

  /** Indicators/icons for status (e.g. offline, downloading) */
  statusIcons?: ReactNode;

  /** Custom actions or buttons on the right side */
  actions?: ReactNode;

  /** Source of track */
  source?: "local" | "remote";

  /** Display name for the source (e.g. Server Name or 'Local') */
  sourceName?: string;

  /** Sources available for this merged track */
  sources?: Array<{
    id: string;
    source: "local" | "remote";
    name?: string;
    color?: string;
    format?: AudioFormat;
  }>;

  /** Format of the primary source */
  format?: AudioFormat;

  /** Whether to show a divider-like border */
  divider?: boolean;
}

/**
 * Format time helper (HH:MM:SS or MM:SS)
 */
function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const TrackItem = React.forwardRef<HTMLDivElement, TrackItemProps>(
  (
    {
      title,
      artist,
      album,
      duration,
      image,
      isActive = false,
      isPlaying = false,
      isSelectionMode = false,
      isSelected = false,
      statusIcons,
      actions,
      source,
      sourceName,
      sources,
      format,
      divider = false,
      className,
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
          "flex items-center gap-4 p-3 rounded-lg cursor-pointer group",
          "gpu-accelerated smooth-interaction transition-all duration-100",
          isActive ? "bg-surface-elevated" : "hover:bg-surface-elevated/50",
          isSelected && "bg-accent/10 border border-accent/30",
          divider && "border-b border-border/10 rounded-none",
          className
        )}
        style={{ transform: "translateZ(0)" }}
        {...props}
      >
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div
            className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
              isSelected
                ? "bg-accent border-accent"
                : "border-border hover:border-accent/50"
            )}
          >
            {isSelected && (
              <IconCircleCheckFilled size={16} className="text-white" />
            )}
          </div>
        )}

        {/* Thumbnail */}
        <div className="w-12 h-12 flex-shrink-0 relative overflow-hidden bg-surface-base rounded shadow-sm">
          {image}

          {/* Player Controls Overlay (Hover) */}
          <div
            className={cn(
              "absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center transition-all duration-200",
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            {isPlaying ? (
              <IconPlayerPause
                size={24}
                className="text-white fill-current drop-shadow-lg scale-90 group-hover:scale-100 transition-transform"
              />
            ) : (
              <IconPlayerPlay
                size={24}
                className="text-white fill-current drop-shadow-lg scale-90 group-hover:scale-100 transition-transform"
              />
            )}
          </div>

          {/* Active Indicator Bar */}
          {isActive && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent animate-in fade-in slide-in-from-bottom-1" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "font-medium truncate transition-colors",
              isActive ? "text-accent" : "text-text"
            )}
          >
            {title}
          </div>
          <div className="text-xs text-text-muted truncate flex items-center gap-2 mt-0.5">
            {statusIcons}
            <span className="truncate">{artist}</span>
            {album && (
              <>
                <span className="opacity-30">•</span>
                <span className="truncate opacity-80">{album}</span>
              </>
            )}
            {/* Audio Quality Badges */}
            {(() => {
              const primaryFormat = format || sources?.[0]?.format;
              if (!primaryFormat?.codec || primaryFormat.codec === "unknown")
                return null;

              const codec = primaryFormat.codec.toUpperCase();
              const isLossless = primaryFormat.lossless;

              // Premium Mineral/Metal Colors
              let badgeStyle =
                "bg-stone-500/10 text-stone-400 border-stone-500/20"; // Iron/Stone (Standard)

              if (isLossless) {
                // Platinum/Diamond (Lossless) - Ultra Premium
                badgeStyle =
                  "bg-sky-400/10 text-sky-200 border-sky-400/30 shadow-[0_0_8px_rgba(56,189,248,0.2)]";
              } else if (
                codec === "OGG" ||
                codec === "AAC" ||
                (primaryFormat.bitrate && primaryFormat.bitrate >= 320)
              ) {
                // Gold/Chrome (HQ Lossy) - High Quality
                badgeStyle =
                  "bg-amber-400/10 text-amber-200 border-amber-400/30";
              }

              return (
                <span
                  className={cn(
                    "text-[8px] px-1.5 py-0.5 rounded-[3px] font-black tracking-[0.05em] border transition-all",
                    badgeStyle
                  )}
                >
                  {codec}
                </span>
              );
            })()}

            {/* Source Icons (Minimalist Stacking) */}
            {sources && sources.length > 0 ? (
              <div className="flex -space-x-1.5 items-center ml-1">
                {sources.slice(0, 3).map((s, idx) => (
                  <div
                    key={s.id}
                    title={s.name}
                    className="relative group/source"
                    style={{ zIndex: 10 - idx }}
                  >
                    <div
                      className={cn(
                        "p-0.5 rounded-full bg-surface-base border border-surface-elevated flex items-center justify-center transition-transform hover:scale-110"
                      )}
                    >
                      {s.source === "local" ? (
                        <IconDeviceDesktop
                          size={10}
                          className="text-blue-400"
                          style={s.color ? { color: s.color } : {}}
                        />
                      ) : (
                        <IconCloud
                          size={10}
                          className="text-accent"
                          style={s.color ? { color: s.color } : {}}
                        />
                      )}
                    </div>
                  </div>
                ))}
                {sources.length > 3 && (
                  <span className="text-[9px] text-text-muted/40 ml-1 font-bold">
                    +{sources.length - 3}
                  </span>
                )}
              </div>
            ) : (
              source && (
                <div className="flex items-center ml-1">
                  {source === "local" ? (
                    <IconDeviceDesktop
                      size={12}
                      className="text-blue-400"
                      title="Local"
                    />
                  ) : (
                    <IconCloud
                      size={12}
                      className="text-accent"
                      title={sourceName}
                    />
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Section: Duration & Actions */}
        <div className="flex items-center gap-3">
          {duration !== undefined && duration > 0 && (
            <div className="text-xs text-text-muted font-mono opacity-60">
              {formatDuration(duration)}
            </div>
          )}
          {actions}
        </div>
      </div>
    );
  }
);

TrackItem.displayName = "TrackItem";
