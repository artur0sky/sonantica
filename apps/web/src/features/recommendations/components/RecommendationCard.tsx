import { cn, CoverArt } from "@sonantica/ui";
import { IconPlayerPlay, IconMicrophone } from "@tabler/icons-react";
import { TrackItem } from "../../library/components/TrackItem";
import { useLibraryStore } from "@sonantica/media-library";

export interface RecommendationCardProps {
  type: "track" | "album" | "artist";
  item: any;
  score?: number;
  reasons?: Array<{ description: string }>;
  onClick?: () => void;
  className?: string;
  index?: number;
}

export function RecommendationCard({
  type,
  item,
  score,
  reasons = [],
  onClick,
  className,
}: RecommendationCardProps) {
  // --- TRACK VARIANT ---
  if (type === "track") {
    return (
      <div className={cn("relative group", className)}>
        <TrackItem track={item} onClick={onClick || (() => {})} />
        {/* Reason badge */}
        {reasons.length > 0 && (
          <div className="absolute top-1 right-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] bg-surface-elevated/90 backdrop-blur px-1.5 py-0.5 rounded border border-border/50 text-text-muted">
              {reasons[0].description}
            </span>
          </div>
        )}
      </div>
    );
  }

  // --- ALBUM VARIANT ---
  if (type === "album") {
    // Fallback logic for cover art if needed, similar to RecommendationsSidebar
    // In a real app, item.coverArt should probably be populated, but we keep the fallback logic.
    // However, hooks cannot be used conditionally inside a component easily if we want to follow rules of hooks.
    // But useLibraryStore.getState() is fine.

    const coverSrc =
      item.coverArt ||
      useLibraryStore.getState().albums.find((a: any) => a.id === item.id)
        ?.coverArt;

    return (
      <div
        className={cn(
          "p-2 hover:bg-surface-elevated transition-colors cursor-pointer group",
          className
        )}
        onClick={onClick}
      >
        <div className="aspect-square overflow-hidden mb-2 relative">
          <CoverArt
            src={coverSrc}
            alt={item.title}
            className="w-full h-full"
            iconSize={24}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <IconPlayerPlay className="text-white drop-shadow-md" size={24} />
          </div>
        </div>
        <h4 className="text-xs font-medium truncate">{item.title}</h4>
        <p className="text-[10px] text-text-muted truncate">{item.artist}</p>
      </div>
    );
  }

  // --- ARTIST VARIANT ---
  if (type === "artist") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-2 hover:bg-surface-elevated transition-colors cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center overflow-hidden">
          {/* Future: If artist has image, show it here. For now, consistently show icon as per original code */}
          <IconMicrophone size={16} className="text-text-muted/50" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium truncate">{item.name}</h4>
          <p className="text-[10px] text-text-muted">
            {item.albumCount || 0} albums
          </p>
        </div>
        {score !== undefined && (
          <div className="text-[9px] text-text-muted/50">
            {Math.round(score * 100)}% match
          </div>
        )}
      </div>
    );
  }

  return null;
}
