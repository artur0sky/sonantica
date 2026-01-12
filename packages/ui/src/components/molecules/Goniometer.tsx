import React, { useRef, useEffect } from "react";
import { useAnalyzerStore } from "@sonantica/audio-analyzer";

interface GoniometerProps {
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
  drawGrid?: boolean;
  className?: string;
}

/**
 * Goniometer (Vectorscope)
 *
 * Visualization of stereo field (Left vs Right).
 * Rotated 45 degrees so Vertical = Mono (Mid), Horizontal = Anti-phase (Side).
 */
export const Goniometer: React.FC<GoniometerProps> = ({
  width = 200,
  height = 200,
  color = "#4ade80", // Green-ish default
  opacity = 0.8,
  drawGrid = true,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isConnected, stereoWaveform, updateStereo } = useAnalyzerStore();

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      // 1. Trigger update in store (pull from analyzer node)
      // Note: In a real app with multiple consumers, we might want a central ticker
      // preventing multiple calls. But store handles some throttling/caching usually.
      if (isConnected) {
        updateStereo();
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const w2 = w / 2;
      const h2 = h / 2;

      // 2. Fade effect (Phosphor persistence)
      ctx.fillStyle = "rgba(23, 23, 33, 0.35)"; // Dark background with fade
      ctx.fillRect(0, 0, w, h);

      // 3. Draw Grid (Optional)
      if (drawGrid) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Diagonal X (L=R and L=-R)
        ctx.moveTo(0, 0);
        ctx.lineTo(w, h); // L only? No, these are just diagonal guides
        ctx.moveTo(w, 0);
        ctx.lineTo(0, h);
        // Center cross
        ctx.moveTo(w2, 0);
        ctx.lineTo(w2, h);
        ctx.moveTo(0, h2);
        ctx.lineTo(w, h2);
        ctx.stroke();
      }

      // 4. Draw Stereo Data
      // Vectorscope: x = (L - R), y = (L + R)    [Mid/Side]
      // Need to grab current waveform from store logic
      // Note: accessing store state directly inside loop via hook might be stale closure
      // without using the transient 'getState' or ensuring dependency update.
      // Zustand `useAnalyzerStore.getState()` is better for loops.
      const state = useAnalyzerStore.getState();
      const waveform = state.stereoWaveform;

      if (waveform && waveform.length > 0) {
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        // Use a lighter version of the color for the beam
        ctx.strokeStyle = color;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.globalAlpha = opacity;

        const len = waveform.length;
        // Optimization: Don't draw every single sample if not needed,
        // but for vectorscope "cloud" look, more points is better.
        // Step depending on performance vs quality.
        const step = 2;

        // Scale factor: Fit -1..1 range into canvas
        // Diagonal length is roughly sqrt(2) * 1.0 (since L,R are 1.0 max)
        const scale = Math.min(w2, h2) * 0.9;

        let hasStarted = false;

        for (let i = 0; i < len; i += step) {
          const l = waveform.left[i];
          const r = waveform.right[i];

          // M/S Transform (Rotated 45deg)
          // Side (Horizontal) = L - R
          // Mid (Vertical) = L + R
          // Note: In Canvas Y is down. Standard Goniometer: Up is +Mid.

          const x = w2 + (l - r) * scale * 0.707; // 1/sqrt(2) normalization
          const y = h2 - (l + r) * scale * 0.707; // Minus because Y is down

          if (!hasStarted) {
            ctx.moveTo(x, y);
            hasStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isConnected, width, height, color, opacity, drawGrid, updateStereo]); // Dependencies

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ width, height }} // CSS sizing
    />
  );
};
