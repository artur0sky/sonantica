import { cn } from "../../utils/cn";
import { Slider } from "../atoms/Slider";
import { Toggle } from "../atoms/Toggle";

interface BandControlProps {
  frequency: number;
  gain: number;
  q: number;
  enabled: boolean;
  onGainChange: (value: number) => void;
  onQChange: (value: number) => void;
  onEnabledChange: (enabled: boolean) => void;
  className?: string;
}

export function BandControl({
  frequency,
  gain,
  q,
  enabled,
  onGainChange,
  onQChange,
  onEnabledChange,
  className,
}: BandControlProps) {
  const formatFrequency = (freq: number) => {
    return freq >= 1000 ? `${(freq / 1000).toFixed(1)}k Hz` : `${freq} Hz`;
  };

  return (
    <div
      className={cn(
        "p-3 bg-surface rounded-md border border-border",
        className
      )}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-text font-mono">
          {formatFrequency(frequency)}
        </span>
        <Toggle
          checked={enabled}
          onCheckedChange={onEnabledChange}
          aria-label={`Enable ${formatFrequency(frequency)} band`}
        />
      </div>

      <div className="mb-2">
        <label className="block text-xs text-text-secondary mb-1">
          Gain: {gain.toFixed(1)} dB
        </label>
        <Slider
          min={-20}
          max={20}
          step={0.5}
          value={gain}
          onChange={(e) => onGainChange(parseFloat(e.target.value))}
          disabled={!enabled}
          className={!enabled ? "opacity-50" : ""}
        />
      </div>

      <div>
        <label className="block text-xs text-text-secondary mb-1">
          Q: {q.toFixed(2)}
        </label>
        <Slider
          min={0.1}
          max={10}
          step={0.1}
          value={q}
          onChange={(e) => onQChange(parseFloat(e.target.value))}
          disabled={!enabled}
          className={!enabled ? "opacity-50" : ""}
        />
      </div>
    </div>
  );
}
