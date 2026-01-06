/**
 * Background Spectrum Visualizer
 *
 * Full-width spectrum visualization for the bottom of the screen.
 * Toggleable, elegant, subtle - enhances the listening experience
 * without being distracting.
 *
 * "Subtle micro-animations for enhanced user experience"
 */

import { motion, AnimatePresence } from "framer-motion";
import { SpectrumVisualizer } from "../atoms/SpectrumVisualizer";
import { cn } from "../../utils";

interface BackgroundSpectrumProps {
  /** Audio frequency bands */
  bands?: number[];
  /** Whether visualization is enabled */
  enabled: boolean;
  /** Height of the visualization */
  height?: number;
  /** Additional CSS classes */
  className?: string;
}
/**
 * Background Spectrum Visualizer
 *
 * Renders at the bottom of the screen, behind other content.
 * Provides ambient visual feedback of the audio.
 */
export function BackgroundSpectrum({
  bands,
  enabled,
  height = 120,
  className,
}: BackgroundSpectrumProps) {
  return (
    <AnimatePresence>
      {enabled && bands && bands.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "pointer-events-none absolute inset-0 z-0", // Absolute positioning for container
            "opacity-20", // Significant transparency as requested
            className
          )}
          style={{ height: `${height}px` }}
        >
          {/* Spectrum */}
          <div className="absolute inset-x-0 bottom-0 h-full opacity-60">
            <SpectrumVisualizer
              bands={
                bands?.map((amp, i) => ({ frequency: i, amplitude: amp })) || []
              }
              height={height}
              color="#FFFFFF"
              gap={2}
              minBarHeight={2}
            />
          </div>

          {/* Subtle gradient overlay to blend top */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-bg" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
