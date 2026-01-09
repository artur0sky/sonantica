/**
 * GraphicEQGrid Component
 *
 * Visual grid for graphic equalizer display showing dB scale lines.
 * Pure presentational component for audio visualization.
 *
 * @example
 * ```tsx
 * <GraphicEQGrid />
 * ```
 */

export interface GraphicEQGridProps {
  /** Additional CSS classes */
  className?: string;
}

export function GraphicEQGrid({ className }: GraphicEQGridProps) {
  return (
    <div
      className={`absolute inset-0 p-4 pointer-events-none flex flex-col justify-between text-[9px] text-text-muted/30 font-sans select-none ${
        className || ""
      }`}
    >
      {/* +12dB Line */}
      <div className="w-full border-t border-border/30 flex items-center">
        <span className="-mt-3">+12dB</span>
      </div>

      {/* +6dB Line (dashed) */}
      <div className="w-full border-t border-dashed border-border/20"></div>

      {/* 0dB Line (accent) */}
      <div className="w-full border-t border-accent/20 flex items-center">
        <span className="-mt-3 text-accent/50">0dB</span>
      </div>

      {/* -6dB Line (dashed) */}
      <div className="w-full border-t border-dashed border-border/20"></div>

      {/* -12dB Line */}
      <div className="w-full border-t border-border/30 flex items-center">
        <span className="-mt-3">-12dB</span>
      </div>
    </div>
  );
}
