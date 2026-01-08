import React from "react";
import { cn } from "../../utils/cn";

export interface EQPreset {
  id: string;
  name: string;
  description?: string;
}

export interface EQPresetSelectorProps {
  presets: EQPreset[];
  currentValue: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  title?: string;
}

export function EQPresetSelector({
  presets,
  currentValue,
  onChange,
  disabled,
  className,
  compact = false,
  title = "Change Preset",
}: EQPresetSelectorProps) {
  const currentPreset = presets.find((p) => p.id === currentValue);

  if (compact) {
    return (
      <div className={cn("relative w-full px-2", className)}>
        <select
          className="w-full h-8 bg-surface-elevated border border-border rounded text-[10px] text-center appearance-none cursor-pointer focus:border-accent focus:ring-1 focus:ring-accent truncated"
          value={currentValue || "custom"}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          title={title}
        >
          <option value="custom">Custom</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
          <svg width="6" height="4" viewBox="0 0 6 4" fill="none">
            <path d="M3 4L0 0H6L3 4Z" fill="currentColor" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-semibold text-text">Preset</label>
      <select
        className="w-full p-3 bg-surface border border-border rounded-lg text-text text-sm cursor-pointer transition-colors hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
        value={currentValue || "custom"}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="custom">Custom</option>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>
      {currentPreset?.description && (
        <p className="text-xs text-text-muted italic px-1 animate-in fade-in slide-in-from-top-1 duration-500">
          {currentPreset.description}
        </p>
      )}
    </div>
  );
}
