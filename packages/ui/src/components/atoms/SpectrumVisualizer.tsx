/**
 * Spectrum Visualizer Component (Atom)
 *
 * Renders frequency spectrum as elegant, minimalist bars.
 * "Subtle, functional, never the main focus" - Sonántica design principle.
 * 
 * PERFORMANCE: Memoized and optimized for 60fps rendering
 */

import { useEffect, useRef, memo } from "react";
import { cn } from "@sonantica/shared";

interface FrequencyBand {
  frequency: number; // Center frequency
  amplitude: number; // 0.0 to 1.0
  label?: string; // E.g. "Bass", "Mids"
}

interface SpectrumVisualizerProps {
  /** Frequency bands to visualize */
  bands: FrequencyBand[];
  /** Height of the visualizer in pixels */
  height?: number;
  /** Color of the bars (CSS color) */
  color?: string;
  /** Minimum height for bars (prevents invisible bars) */
  minBarHeight?: number;
  /** Gap between bars in pixels */
  gap?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Spectrum Visualizer
 *
 * Pure presentational component - receives data, renders bars.
 * No business logic, no state management.
 * 
 * PERFORMANCE: Memoized to prevent re-renders when props haven't changed
 */
export const SpectrumVisualizer = memo(function SpectrumVisualizer({
  bands,
  height = 100,
  color = "var(--color-accent)",
  minBarHeight = 2,
  gap = 2,
  className,
}: SpectrumVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const dprRef = useRef<number>(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // PERFORMANCE: Reuse context instead of getting it every frame
    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext("2d", {
        // Performance hints
        alpha: false, // No transparency needed
        desynchronized: true, // Allow async rendering
      });
    }

    const ctx = ctxRef.current;
    if (!ctx) return;

    // Set canvas size (accounting for device pixel ratio)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // PERFORMANCE: Only resize if DPR or size changed
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      dprRef.current = dpr;
      ctx.scale(dpr, dpr);
    }

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate bar dimensions
    const barCount = bands.length;
    const totalGap = gap * (barCount - 1);
    const barWidth = (rect.width - totalGap) / barCount;

    // Draw bars
    ctx.fillStyle = color;
    
    // PERFORMANCE: Use batch rendering
    for (let i = 0; i < barCount; i++) {
      const band = bands[i];
      const x = i * (barWidth + gap);
      const barHeight = Math.max(minBarHeight, band.amplitude * rect.height);
      const y = rect.height - barHeight;

      // Draw rectangle (no rounded corners - minimalist)
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [bands, height, color, minBarHeight, gap]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("w-full", className)}
      style={{ height: `${height}px` }}
      aria-label="Audio spectrum visualization"
    />
  );
});
