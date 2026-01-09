import type { MediaMetadata } from "@sonantica/shared";
import { IconX, IconMusic } from "@tabler/icons-react";
import { formatArtists, formatGenres, cn } from "@sonantica/shared";

export interface MetadataPanelProps {
  metadata: MediaMetadata;
  onClose: () => void;
  className?: string;
}

/**
 * MetadataPanel Component
 *
 * Displays detailed information about a track.
 * Refactored to remove Framer Motion and support CSS animations.
 */
export function MetadataPanel({
  metadata,
  onClose,
  className,
}: MetadataPanelProps) {
  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-full w-80 md:w-96 bg-surface border-l border-border shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300",
        className
      )}
    >
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black uppercase tracking-widest text-text/80">
            Track Details
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-accent p-2 rounded-full hover:bg-accent/10 transition-all active:scale-90"
          >
            <IconX size={24} stroke={2.5} />
          </button>
        </div>

        {/* Artwork */}
        <div className="aspect-square bg-surface-elevated/40 rounded-2xl mb-8 flex items-center justify-center border border-border/10 overflow-hidden shadow-inner group">
          {metadata.coverArt ? (
            <img
              src={metadata.coverArt}
              alt="Cover"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <IconMusic size={80} className="text-text-muted/10" stroke={1} />
          )}
        </div>

        {/* Fields */}
        <dl className="space-y-6">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
            <dt className="text-[10px] text-text-muted/60 uppercase tracking-[0.2em] font-bold mb-1.5">
              Composition
            </dt>
            <dd className="font-extrabold text-xl leading-tight text-text">
              {metadata.title || "Unknown Masterpiece"}
            </dd>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-both">
              <dt className="text-[10px] text-text-muted/60 uppercase tracking-[0.2em] font-bold mb-1.5">
                Interpreter
                {Array.isArray(metadata.artist) && metadata.artist.length > 1
                  ? "s"
                  : ""}
              </dt>
              <dd className="font-bold text-text/90">
                {formatArtists(metadata.artist)}
              </dd>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
              <dt className="text-[10px] text-text-muted/60 uppercase tracking-[0.2em] font-bold mb-1.5">
                Collection
              </dt>
              <dd className="font-bold text-text/90 whitespace-nowrap overflow-hidden text-ellipsis">
                {metadata.album || "Unknown Anthology"}
              </dd>
            </div>
          </div>

          {metadata.albumArtist && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400 fill-mode-both">
              <dt className="text-[10px] text-text-muted/60 uppercase tracking-[0.2em] font-bold mb-1.5">
                Primary Artist
              </dt>
              <dd className="font-bold text-text/90">{metadata.albumArtist}</dd>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500 fill-mode-both">
              <dt className="text-[10px] text-text-muted/60 uppercase tracking-[0.2em] font-bold mb-1.5">
                Timeline
              </dt>
              <dd className="font-mono font-black text-accent">
                {metadata.year || "----"}
              </dd>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-600 fill-mode-both">
              <dt className="text-[10px] text-text-muted/60 uppercase tracking-[0.2em] font-bold mb-1.5">
                Sequence
              </dt>
              <dd className="font-mono font-black text-accent">
                {metadata.trackNumber || "--"}
              </dd>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-700 fill-mode-both">
            <dt className="text-[10px] text-text-muted/60 uppercase tracking-[0.2em] font-bold mb-1.5">
              Sonic Landscapes
            </dt>
            <dd className="text-sm font-bold text-text/80">
              {formatGenres(metadata.genre) || "Atmospheric"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
