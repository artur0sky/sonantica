/**
 * EQControls Component
 *
 * Professional EQ interface for Sonántica.
 * "Adjust. Listen. Decide."
 */

import { useState } from "react";
import { useDSPStore } from "@sonantica/dsp";
import type { IEQBand } from "@sonantica/dsp";

export function EQControls() {
  const {
    config,
    presets,
    isInitialized,
    applyPreset,
    updateBand,
    setPreamp,
    setEnabled,
    reset,
  } = useDSPStore();

  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isInitialized) {
    return (
      <div className="bg-surface rounded-lg p-6 text-center opacity-60 max-w-2xl mx-auto">
        <p className="text-sm text-text-secondary m-0">
          DSP engine not initialized. Load a track to enable audio processing.
        </p>
      </div>
    );
  }

  const currentBands = getCurrentBands();
  const currentPreset = presets.find((p: any) => p.id === config.currentPreset);

  function getCurrentBands(): IEQBand[] {
    if (config.customBands) {
      return config.customBands;
    }
    if (currentPreset) {
      return currentPreset.bands;
    }
    return [];
  }

  function handlePresetChange(presetId: string) {
    if (presetId === "reset") {
      reset();
    } else {
      applyPreset(presetId);
    }
  }

  function handleBandChange(
    bandId: string,
    property: keyof IEQBand,
    value: number | boolean
  ) {
    updateBand(bandId, { [property]: value });
  }

  function handlePreampChange(value: number) {
    setPreamp(value);
  }

  return (
    <div className="bg-surface rounded-lg p-6 text-text max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
        <h3 className="m-0 text-xl font-semibold text-text">Equalizer</h3>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="cursor-pointer"
          />
          <span>Enable DSP</span>
        </label>
      </div>

      {/* Preset Selector */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-text mb-2">
          Preset
        </label>
        <select
          className="w-full p-3 bg-background border border-border rounded-md text-text text-base cursor-pointer transition-colors hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
          value={config.currentPreset || "custom"}
          onChange={(e) => handlePresetChange(e.target.value)}
          disabled={!config.enabled}
        >
          <option value="custom">Custom</option>
          {presets.map((preset: any) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        {currentPreset && (
          <p className="mt-2 text-sm text-text-secondary italic">
            {currentPreset.description}
          </p>
        )}
      </div>

      {/* Preamp */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-text mb-2">
          Preamp: {config.preamp.toFixed(1)} dB
        </label>
        <input
          type="range"
          className="w-full h-1.5 bg-background rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-4.5 [&::-moz-range-thumb]:h-4.5 [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
          min="-20"
          max="20"
          step="0.5"
          value={config.preamp}
          onChange={(e) => handlePreampChange(parseFloat(e.target.value))}
          disabled={!config.enabled}
        />
      </div>

      {/* Advanced Controls Toggle */}
      <button
        className="w-full p-3 bg-transparent border border-border rounded-md text-text text-sm cursor-pointer transition-all text-left mb-4 hover:bg-background hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => setShowAdvanced(!showAdvanced)}
        disabled={!config.enabled}
      >
        {showAdvanced ? "▼" : "▶"} Advanced EQ Controls
      </button>

      {/* Band Controls */}
      {showAdvanced && config.enabled && (
        <div className="grid gap-4 max-h-96 overflow-y-auto p-4 bg-background rounded-md">
          {currentBands.map((band) => (
            <div
              key={band.id}
              className="p-3 bg-surface rounded-md border border-border"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-text font-mono">
                  {band.frequency >= 1000
                    ? `${(band.frequency / 1000).toFixed(1)}k Hz`
                    : `${band.frequency} Hz`}
                </span>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={band.enabled}
                    onChange={(e) =>
                      handleBandChange(band.id, "enabled", e.target.checked)
                    }
                    className="cursor-pointer"
                  />
                </label>
              </div>

              <div className="mb-2">
                <label className="block text-xs text-text-secondary mb-1">
                  Gain: {band.gain.toFixed(1)} dB
                </label>
                <input
                  type="range"
                  className="w-full h-1.5 bg-background rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-4.5 [&::-moz-range-thumb]:h-4.5 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
                  min="-20"
                  max="20"
                  step="0.5"
                  value={band.gain}
                  onChange={(e) =>
                    handleBandChange(
                      band.id,
                      "gain",
                      parseFloat(e.target.value)
                    )
                  }
                  disabled={!band.enabled}
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  Q: {band.q.toFixed(2)}
                </label>
                <input
                  type="range"
                  className="w-full h-1.5 bg-background rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-4.5 [&::-moz-range-thumb]:h-4.5 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={band.q}
                  onChange={(e) =>
                    handleBandChange(band.id, "q", parseFloat(e.target.value))
                  }
                  disabled={!band.enabled}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reset Button */}
      <div className="mt-5 pt-4 border-t border-border">
        <button
          className="w-full p-3 bg-transparent border border-border rounded-md text-text text-sm cursor-pointer transition-all hover:bg-red-500 hover:border-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => reset()}
          disabled={!config.enabled}
        >
          Reset to Flat
        </button>
      </div>
    </div>
  );
}
