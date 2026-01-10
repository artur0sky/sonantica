/**
 * Cover Art Section (Molecule)
 * Pure, gallery-style album art display
 * Desktop: No overlays, clean presentation
 * Mobile: Interactive with native gestures
 * No external animation library dependencies
 */

import {
  IconPlaylist,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
} from "@tabler/icons-react";
import { CoverArt } from "../../../atoms/CoverArt";
import type { CoverArtSectionProps } from "../types";
import { useExpandedPlayerGestures } from "../hooks/useExpandedPlayerGestures";

interface CoverArtSectionInternalProps extends CoverArtSectionProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

export function CoverArtSection({
  coverArt,
  trackTitle,
  enableGestures = false,
  onLongPress,
  onNext,
  onPrevious,
}: CoverArtSectionInternalProps) {
  const gestures = useExpandedPlayerGestures({
    onNext: onNext || (() => {}),
    onPrevious: onPrevious || (() => {}),
    onLongPress,
  });

  // Desktop: Pure gallery style (no interactions)
  if (!enableGestures) {
    return (
      <div className="flex items-center justify-center h-full max-h-full min-h-0 overflow-hidden">
        <div className="relative aspect-square w-full h-full max-h-full max-w-full transition-transform duration-300 ease-out hover:scale-[1.005]">
          {/* Subtle glow behind */}
          <div className="absolute inset-0 bg-accent/15 blur-[100px] opacity-0 hover:opacity-100 transition-opacity duration-700 -z-10" />

          {/* Pure Cover Art */}
          <CoverArt
            src={coverArt}
            alt={trackTitle}
            className="w-full h-full"
            iconSize={120}
            shadow={true}
          />
        </div>
      </div>
    );
  }

  // Mobile: Interactive with gestures
  return (
    <div className="flex-1 flex items-start justify-center w-full min-h-0">
      <div
        className={`relative group aspect-square w-full transition-transform duration-300 ease-out hover:scale-[1.005] ${
          gestures.longPressActive ? "scale-95" : "scale-100"
        }`}
        onPointerDown={gestures.handlePointerDown}
        onPointerMove={gestures.handlePointerMove}
        onPointerUp={gestures.handlePointerUp}
        onPointerCancel={gestures.handlePointerCancel}
        onPointerLeave={gestures.handlePointerCancel}
        style={{ touchAction: "none" }}
      >
        <div className="absolute inset-0 bg-accent/20 blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
        <CoverArt
          src={coverArt}
          alt={trackTitle}
          className="w-full h-full"
          iconSize={120}
          shadow={true}
        />

        {/* Overlays / Interaction Feedbacks */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Drag Direction Feedback */}
          {gestures.dragDirection && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
              {gestures.dragDirection === "right" ? (
                <div className="flex items-center gap-4">
                  <IconPlayerSkipBack
                    size={64}
                    className="text-white drop-shadow-lg"
                  />
                  <span className="text-white font-bold text-xl">Previous</span>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-white font-bold text-xl">Next</span>
                  <IconPlayerSkipForward
                    size={64}
                    className="text-white drop-shadow-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Long Press Feedback */}
          {gestures.longPressActive && (
            <div className="absolute inset-0 bg-accent/20 flex items-center justify-center backdrop-blur-sm z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
              <IconPlaylist size={64} className="text-white drop-shadow-lg" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
