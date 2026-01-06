/**
 * EQControls Component
 *
 * Professional EQ interface for Sonántica.
 * "Adjust. Listen. Decide."
 */

import { BandControl, Button, Select, Toggle, Slider } from "@sonantica/ui";
import { useEQLogic } from "../hooks/useEQLogic";

export function EQControls() {
  const {
    config,
    presets,
    isInitialized,
    showAdvanced,
    currentBands,
    currentPreset,
    setEnabled,
    setPreamp,
    setShowAdvanced,
    handlePresetChange,
    handleBandChange,
    reset,
  } = useEQLogic();

  if (!isInitialized) {
    return (
      <div className="bg-surface rounded-lg p-6 text-center opacity-60 max-w-2xl mx-auto">
        <p className="text-sm text-text-secondary m-0">
          DSP engine not initialized. Load a track to enable audio processing.
        </p>
      </div>
    );
  }

  // Transform presets for Select component
  const presetOptions = [
    { value: "custom", label: "Custom" },
    ...presets.map((p: any) => ({ value: p.id, label: p.name })),
  ];

  return (
    <div className="bg-surface rounded-lg p-6 text-text max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
        <h3 className="m-0 text-xl font-semibold text-text">Equalizer</h3>
        <Toggle
          checked={config.enabled}
          onCheckedChange={setEnabled}
          label="Enable DSP"
        />
      </div>

      {/* Preset Selector */}
      <div className="mb-5">
        <Select
          label="Preset"
          options={presetOptions}
          value={config.currentPreset || "custom"}
          onChange={(e) => handlePresetChange(e.target.value)}
          disabled={!config.enabled}
          helperText={currentPreset?.description}
        />
      </div>

      {/* Preamp */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-text mb-2">
          Preamp: {config.preamp.toFixed(1)} dB
        </label>
        <Slider
          min={-20}
          max={20}
          step={0.5}
          value={config.preamp}
          onChange={(e) => setPreamp(parseFloat(e.target.value))}
          disabled={!config.enabled}
        />
      </div>

      {/* Advanced Controls Toggle */}
      <Button
        variant="ghost"
        className="w-full justify-start mb-4 pl-0 hover:bg-transparent hover:text-primary"
        onClick={() => setShowAdvanced(!showAdvanced)}
        disabled={!config.enabled}
      >
        {showAdvanced ? "▼" : "▶"} Advanced EQ Controls
      </Button>

      {/* Band Controls */}
      {showAdvanced && config.enabled && (
        <div className="grid gap-4 max-h-96 overflow-y-auto p-4 bg-background rounded-md">
          {currentBands.map((band) => (
            <BandControl
              key={band.id}
              frequency={band.frequency}
              gain={band.gain}
              q={band.q}
              enabled={band.enabled}
              onGainChange={(val) => handleBandChange(band.id, "gain", val)}
              onQChange={(val) => handleBandChange(band.id, "q", val)}
              onEnabledChange={(val) =>
                handleBandChange(band.id, "enabled", val)
              }
            />
          ))}
        </div>
      )}

      {/* Reset Button */}
      <div className="mt-5 pt-4 border-t border-border">
        <Button
          variant="danger"
          className="w-full"
          onClick={() => reset()}
          disabled={!config.enabled}
        >
          Reset to Flat
        </Button>
      </div>
    </div>
  );
}
