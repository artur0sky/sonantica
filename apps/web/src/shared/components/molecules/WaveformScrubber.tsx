/**
 * Waveform Scrubber Component
 *
 * Replaces the standard progress bar.
 * visualizes the track's waveform (simulated or real) on hover.
 * Allows for precise seeking ("drop detection").
 */

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils";
import { useWaveformStore } from "../../store/waveformStore";

interface WaveformScrubberProps {
  trackId?: string;
  progress: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
}

export function WaveformScrubber({
  trackId,
  progress,
  duration,
  onSeek,
  className,
}: WaveformScrubberProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const storedWaveform = useWaveformStore((state) =>
    trackId ? state.getWaveform(trackId) : null
  );

  // Generate simulated waveform (fallback) or use real data
  const waveformBars = useMemo(() => {
    const desiredBarCount = 120; // Consistent bar count for UI

    if (storedWaveform && storedWaveform.length > 0) {
      // If we have more peaks than desired, downsample
      if (storedWaveform.length > desiredBarCount) {
        const factor = Math.floor(storedWaveform.length / desiredBarCount);
        return storedWaveform
          .filter((_, i) => i % factor === 0)
          .slice(0, desiredBarCount);
      }
      return storedWaveform;
    }

    if (!duration) return [];

    // Fallback simulation (consistent 120 bars)
    const bars = [];
    for (let i = 0; i < desiredBarCount; i++) {
      const x = i / desiredBarCount;
      const val =
        (Math.sin(x * 12) + Math.sin(x * 25) + Math.sin(x * 7) + 3) / 6;
      const noise = Math.random() * 0.2;
      bars.push(Math.max(0.1, Math.min(1.0, val + noise)));
    }
    return bars;
  }, [duration, storedWaveform]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    setHoverPosition(percent);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setHoverPosition(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !duration) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percent * duration);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-1 hover:h-12 w-full transition-all duration-300 group cursor-pointer",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Base Progress Bar (Always visible) */}
      <div className="absolute inset-0 flex items-end">
        <div className="w-full h-1 bg-white/10 relative overflow-hidden group-hover:opacity-0 transition-opacity">
          <div
            className="absolute top-0 left-0 h-full bg-accent shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Waveform Visualization (On Hover) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            className="absolute inset-0 flex items-end gap-[2px] px-[2px] bg-bg/80 backdrop-blur-md rounded-sm overflow-hidden border border-white/5"
            style={{ transformOrigin: "bottom" }}
          >
            {waveformBars.map((height, i) => {
              const barPercent = (i / waveformBars.length) * 100;
              const isPlayed = barPercent <= progress;
              const isHovering =
                hoverPosition !== null && barPercent <= hoverPosition * 100;

              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 min-w-[1px] rounded-t-[2px] transition-all duration-150",
                    isPlayed
                      ? "bg-accent"
                      : isHovering
                      ? "bg-white/40"
                      : "bg-white/10"
                  )}
                  style={{
                    height: `${Math.max(4, height * 100)}%`,
                    opacity: isPlayed ? 1 : 0.6,
                  }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
