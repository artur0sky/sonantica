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
    if (storedWaveform && storedWaveform.length > 0) {
      return storedWaveform;
    }

    if (!duration) return [];

    // Fallback simulation
    const count = 100;
    const bars = [];
    for (let i = 0; i < count; i++) {
      const x = i / count;
      const val =
        (Math.sin(x * 10) + Math.sin(x * 23) + Math.sin(x * 5) + 3) / 6;
      const noise = Math.random() * 0.3;
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
        "relative h-1 hover:h-12 w-full transition-all duration-200 group cursor-pointer",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Base Progress Bar (Always visible) */}
      <div className="absolute inset-0 flex items-end">
        <div className="w-full h-1 bg-surface-elevated relative overflow-hidden group-hover:opacity-0 transition-opacity">
          <div
            className="absolute top-0 left-0 h-full bg-accent"
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
            className="absolute inset-0 flex items-end gap-[1px] bg-surface/90 backdrop-blur-sm rounded-md overflow-hidden border border-border/50"
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
                    "flex-1 transition-colors duration-75",
                    isPlayed ? "bg-accent" : "bg-text-muted/30",
                    isHovering && !isPlayed && "bg-text/50"
                  )}
                  style={{ height: `${height * 100}%` }}
                />
              );
            })}

            {/* Hover Time Tooltip could go here */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
