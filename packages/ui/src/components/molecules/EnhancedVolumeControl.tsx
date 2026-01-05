/**
 * Enhanced Volume Control
 *
 * Volume slider with real-time Hz display, restored safely.
 * Includes glitch protection via AudioAnalyzer fix.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconVolume,
  IconVolume2,
  IconVolume3,
  IconVolumeOff,
} from "@tabler/icons-react";
import { Slider } from "../atoms";
import { cn } from "../../utils";

interface EnhancedVolumeControlProps {
  volume: number;
  onVolumeChange: (vol: number) => void;
  peakHz?: number;
  className?: string;
  size?: "sm" | "md";
}

export function EnhancedVolumeControl({
  volume,
  onVolumeChange,
  peakHz = 0,
  className,
  size = "md",
}: EnhancedVolumeControlProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Audio analysis logic removed (moved to parent)

  const getVolumeIcon = () => {
    if (volume === 0) return IconVolumeOff;
    if (volume < 0.3) return IconVolume3;
    if (volume < 0.7) return IconVolume2;
    return IconVolume;
  };

  const VolumeIcon = getVolumeIcon();

  /* const peakHz = spectrum ? Math.round(spectrum.peakFrequency) : 0; */ // Removed

  return (
    <div
      className={cn(
        "flex items-center gap-2 w-32 group/vol relative",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        onClick={() => onVolumeChange(volume > 0 ? 0 : 0.7)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="text-text-muted hover:text-text transition-colors relative z-20"
        aria-label={volume > 0 ? "Mute" : "Unmute"}
      >
        <VolumeIcon size={18} stroke={1.5} />
      </motion.button>

      <div className="flex-1 h-8 flex items-center relative">
        <Slider
          value={volume}
          min={0}
          max={1}
          step={0.01}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onVolumeChange(parseFloat(e.target.value))
          }
          className="relative z-10 opacity-70 group-hover/vol:opacity-100 transition-opacity"
        />

        {/* Hz Display Overlay */}
        <AnimatePresence>
          {isHovered && peakHz > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 -top-4 text-center pointer-events-none"
            >
              <span className="text-[10px] font-mono text-accent bg-surface/80 px-1 rounded">
                {peakHz} Hz
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
