/**
 * Spectrum Visualizer Component (Atom)
 *
 * Renders frequency spectrum as elegant, minimalist bars.
 * "Subtle, functional, never the main focus" - Sonántica design principle.
 */

import { useEffect, useRef } from "react";
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
 */
export function SpectrumVisualizer({
  bands,
  height = 100,
  color = "var(--color-accent)",
  minBarHeight = 2,
  gap = 2,
  className,
}: SpectrumVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size (accounting for device pixel ratio)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate bar dimensions
    const barCount = bands.length;
    const totalGap = gap * (barCount - 1);
    const barWidth = (rect.width - totalGap) / barCount;

    // Draw bars
    ctx.fillStyle = color;
    bands.forEach((band, index) => {
      const x = index * (barWidth + gap);
      const barHeight = Math.max(minBarHeight, band.amplitude * rect.height);
      const y = rect.height - barHeight;

      // Draw rectangle (no rounded corners - minimalist)
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  }, [bands, height, color, minBarHeight, gap]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("w-full", className)}
      style={{ height: `${height}px` }}
      aria-label="Audio spectrum visualization"
    />
  );
}
