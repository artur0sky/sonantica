/**
 * Slider Atom
 *
 * Range input for volume and timeline.
 */

import { cn } from "../../utils/cn";

interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  buffered?: number; // End of single buffer range (e.g. for simple progress)
}

export function Slider({
  className,
  value,
  min = 0,
  max = 100,
  step = 1,
  buffered = 0,
  ...props
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const bufferPercentage = ((buffered - min) / (max - min)) * 100;

  return (
    <div
      className={cn("relative w-full h-4 flex items-center group", className)}
    >
      {/* Background Track */}
      <div className="absolute w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        {/* Buffer Indicator */}
        <div
          className="absolute h-full bg-white/20 transition-all duration-300"
          style={{ width: `${clamp(bufferPercentage, 0, 100)}%` }}
        />
        {/* Progress Track */}
        <div
          className="absolute h-full bg-accent transition-all duration-75"
          style={{ width: `${clamp(percentage, 0, 100)}%` }}
        />
      </div>

      {/* Hidden Native Input for interaction */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className={cn(
          "absolute w-full h-full opacity-0 cursor-pointer z-10",
          "disabled:cursor-not-allowed"
        )}
        {...props}
      />

      {/* Thumb (Always visible but non-interactive to native, z-index lower than input) */}
      <div
        className={cn(
          "absolute w-4 h-4 bg-white rounded-full shadow-lg pointer-events-none transition-transform group-hover:scale-110",
          "border-2 border-accent"
        )}
        style={{ left: `calc(${clamp(percentage, 0, 100)}% - 8px)` }}
      />
    </div>
  );
}

// Utility for internal usage if not imported
function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}
