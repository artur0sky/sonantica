/**
 * Cover Art Section (Molecule)
 * Pure, gallery-style album art display
 * Desktop: No overlays, clean presentation
 * Mobile: Interactive with gestures
 */

import { motion, AnimatePresence } from "framer-motion";
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
        <motion.div
          layoutId="player-artwork-desktop"
          className="relative aspect-square w-full h-full max-h-full max-w-full"
          whileHover={{ scale: 1.005 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
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
        </motion.div>
      </div>
    );
  }

  // Mobile: Interactive with gestures
  return (
    <div className="flex-1 flex items-start justify-center w-full min-h-0">
      <motion.div
        layoutId="player-artwork-mobile"
        className="relative group aspect-square w-full"
        whileHover={{ scale: 1.005 }}
        animate={gestures.longPressActive ? { scale: 0.95 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onPointerDown={gestures.handlePointerDown}
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
          <AnimatePresence>
            {gestures.dragDirection && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                {gestures.dragDirection === "right" ? (
                  <div className="flex items-center gap-4">
                    <IconPlayerSkipBack
                      size={64}
                      className="text-white drop-shadow-lg"
                    />
                    <span className="text-white font-bold text-xl">
                      Previous
                    </span>
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Long Press Feedback */}
          <AnimatePresence>
            {gestures.longPressActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-accent/20 flex items-center justify-center backdrop-blur-sm z-20 pointer-events-none"
              >
                <IconPlaylist size={64} className="text-white drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
