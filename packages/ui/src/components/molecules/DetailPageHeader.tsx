/**
 * DetailPageHeader Molecule
 *
 * A reusable header for detail pages (Artist, Album, Playlist).
 * Displays a large image, type label, title, and metadata/stats.
 *
 * @package @sonantica/ui
 * @category Molecules
 */

import { ReactNode } from "react";
import { cn } from "../../utils";

export interface DetailPageHeaderProps {
  /** Type label (e.g., "Artist", "Album", "Playlist") */
  type: string;

  /** Main title */
  title: string;

  /** Large image component (ArtistImage, CoverArt, etc.) */
  image: ReactNode;

  /** Subtitle/Metadata section */
  subtitle: ReactNode;

  /** Action buttons (e.g., Play, Shuffle) */
  actions?: ReactNode;

  /** Additional className */
  className?: string;
}

export function DetailPageHeader({
  type,
  title,
  image,
  subtitle,
  actions,
  className,
}: DetailPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row gap-8 mb-12 items-end",
        className
      )}
    >
      <div className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0 animate-in fade-in zoom-in-95 duration-500 pointer-events-none select-none">
        {image}
      </div>

      <div className="flex flex-col justify-end flex-1 min-w-0">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <span className="text-accent font-semibold tracking-wider text-sm uppercase mb-2 block">
            {type}
          </span>
          <h1
            className="text-4xl md:text-6xl font-bold mb-4 tracking-tight truncate py-1"
            title={title}
          >
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-lg text-text-muted">
            {subtitle}
          </div>

          {actions && <div className="mt-8 flex gap-4">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
