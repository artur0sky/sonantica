/**
 * Info Section (Molecule)
 * Track metadata display with rating and actions
 * Responsive typography and layout
 * No external animation library dependencies
 */

import { TrackRating } from "../../../molecules";
import type { InfoSectionProps } from "../types";

export function InfoSection({
  title,
  artist,
  album,
  trackId,
  actionButtons,
}: InfoSectionProps) {
  return (
    <div className="flex flex-col justify-between border border-white/5 bg-white/[0.02] rounded-lg p-6 xl:p-8">
      <div>
        <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-black tracking-tight line-clamp-3">
          {title}
        </h1>
        <p className="text-xl xl:text-2xl 2xl:text-3xl text-text-muted font-bold mt-2 xl:mt-3">
          {artist}
        </p>
        {album && (
          <p className="text-sm xl:text-base text-text-muted/60 mt-2 font-medium">
            {album}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <TrackRating trackId={trackId} mode="both" size={24} compact />
        {actionButtons && (
          <>
            <div className="w-px h-5 bg-white/10" />
            {actionButtons}
          </>
        )}
      </div>
    </div>
  );
}
