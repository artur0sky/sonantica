import React from "react";
import { IconRefresh } from "@tabler/icons-react";
import { Button } from "../atoms/Button";
import { EQSlider } from "../atoms/EQSlider";
import { EQPresetSelector, EQPreset } from "../molecules/EQPresetSelector";

export interface EQCollapsedViewProps {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  currentPreset: string;
  onPresetChange: (id: string) => void;
  presets: EQPreset[];
  preamp: number;
  onPreampChange: (value: number) => void;
  onReset: () => void;
}

export function EQCollapsedView({
  enabled,
  setEnabled,
  currentPreset,
  onPresetChange,
  presets,
  preamp,
  onPreampChange,
  onReset,
}: EQCollapsedViewProps) {
  return (
    <div className="flex flex-col items-center h-full gap-4 pt-2 pb-4 animate-in fade-in duration-500">
      {/* DSP Toggle (Vertical/Compact) */}
      <div className="flex flex-col items-center gap-1">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-surface border-2 border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent peer-checked:border-accent"></div>
        </label>
        <span className="text-[9px] font-sans text-text-muted opacity-80 uppercase tracking-widest">
          {enabled ? "ON" : "OFF"}
        </span>
      </div>

      {/* Preset Selector (Compact) */}
      <EQPresetSelector
        compact
        presets={presets}
        currentValue={currentPreset}
        onChange={onPresetChange}
        disabled={!enabled}
      />

      <div className="w-full h-[1px] bg-border my-1"></div>

      {/* Vertical Preamp Slider */}
      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 relative">
        <span className="text-[9px] text-text-muted font-sans mb-2 uppercase tracking-tighter">
          PRE
        </span>
        <EQSlider
          orientation="vertical"
          min={-20}
          max={20}
          step={0.5}
          value={preamp}
          trackLength="100%"
          onChange={(e) => onPreampChange(parseFloat(e.target.value))}
          onDoubleClick={() => onPreampChange(0)}
          disabled={!enabled}
          title={`Preamp: ${preamp}dB`}
          className="flex-1 py-4"
        />
        <span className="text-[9px] text-accent font-sans mt-2">
          {preamp > 0 ? `+${preamp.toFixed(1)}` : preamp.toFixed(1)}
        </span>
      </div>

      <div className="w-full h-[1px] bg-border my-1"></div>

      {/* Reset Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        disabled={!enabled}
        className="w-10 h-10 p-0 rounded-full text-red-500 hover:bg-red-500/10"
        title="Reset to Flat"
      >
        <IconRefresh size={18} stroke={1.5} />
      </Button>
    </div>
  );
}
