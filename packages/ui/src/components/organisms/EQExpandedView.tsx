import React from "react";
import { IconRefresh } from "@tabler/icons-react";
import { Button } from "../atoms/Button";
import { Badge } from "../atoms/Badge";
import { EQSlider } from "../atoms/EQSlider";
import { GraphicEQGrid } from "../atoms/GraphicEQGrid";
import { EQPresetSelector, EQPreset } from "../molecules/EQPresetSelector";
import { EQControlGroup } from "../molecules/EQControlGroup";
import { cn } from "../../utils/cn";

export interface EQBand {
  id: string;
  frequency: number;
  gain: number;
}

export interface EQExpandedViewProps {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  currentPreset: string;
  onPresetChange: (id: string) => void;
  presets: EQPreset[];
  preamp: number;
  onPreampChange: (value: number) => void;
  crossfadeDuration: number;
  onCrossfadeChange: (value: number) => void;
  fadeOutDuration: number;
  onFadeOutChange: (value: number) => void;
  bands: EQBand[];
  onBandChange: (id: string, field: string, value: number) => void;
  onBandReset: (id: string) => void;
  onReset: () => void;
  viewWidth: number;
  vocalModeControl?: React.ReactNode;
}

export function EQExpandedView({
  enabled,
  setEnabled,
  currentPreset,
  onPresetChange,
  presets,
  preamp,
  onPreampChange,
  crossfadeDuration,
  onCrossfadeChange,
  fadeOutDuration,
  onFadeOutChange,
  bands,
  onBandChange,
  onBandReset,
  onReset,
  viewWidth,
  vocalModeControl,
}: EQExpandedViewProps) {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl border border-border">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">DSP Processing</span>
          <span className="text-xs text-text-muted">
            {enabled ? "Enabled" : "Bypassed"}
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-surface border-2 border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent peer-checked:border-accent"></div>
        </label>
      </div>

      {/* Preset Selector */}
      <EQPresetSelector
        presets={presets}
        currentValue={currentPreset}
        onChange={onPresetChange}
        disabled={!enabled}
      />

      {/* Preamp Control */}
      <EQControlGroup
        label="Preamp"
        value={preamp}
        unit="dB"
        min={-20}
        max={20}
        onChange={onPreampChange}
        disabled={!enabled}
        labelsText={{ min: "-20", mid: "0", max: "+20" }}
      />

      {/* Crossfade Control */}
      <EQControlGroup
        label="Crossfade"
        value={crossfadeDuration}
        unit="s"
        min={0}
        max={10}
        onChange={onCrossfadeChange}
        disabled={!enabled}
        labelsText={{ min: "0s (Off)", mid: "5s", max: "10s" }}
      />

      {/* Fade-Out Control */}
      <EQControlGroup
        label="Fade-Out (End of Track)"
        value={fadeOutDuration}
        unit="s"
        min={0}
        max={10}
        onChange={onFadeOutChange}
        disabled={!enabled}
        labelsText={{ min: "0s (Off)", mid: "5s", max: "10s" }}
      />

      {/* Vocal Mode Control Injection */}
      {vocalModeControl}

      {/* Volume Normalization Placeholder */}
      <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
        <div className="flex flex-col">
          <span className="text-xs font-semibold">Volume Normalization</span>
          <span className="text-[10px] text-text-muted">
            Use Preamp to avoid clipping
          </span>
        </div>
        <Badge
          variant="default"
          className="text-[10px] bg-surface-elevated text-text-muted border-border"
        >
          Manual
        </Badge>
      </div>

      {/* Band Controls */}
      {enabled && (
        <div className="space-y-4 animate-in fade-in duration-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Frequency Bands</span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider">
              {viewWidth >= 480 ? "Graphic Mode" : "List Mode"}
            </span>
          </div>

          {viewWidth >= 480 ? (
            /* EXPANDED: Vertical Sliders (Graphic EQ Style) */
            <div className="relative h-64 p-4 bg-surface-elevated rounded-xl border border-border">
              <GraphicEQGrid />
              <div className="relative h-full flex justify-between items-end z-10 mx-6">
                {bands.map((band) => (
                  <div
                    key={band.id}
                    className="flex flex-col items-center h-full justify-between pb-1 gap-1 min-w-[32px] group"
                  >
                    <span
                      className={cn(
                        "text-[9px] font-sans transition-opacity",
                        band.gain === 0
                          ? "opacity-0 group-hover:opacity-100"
                          : "opacity-100 text-accent"
                      )}
                    >
                      {band.gain > 0
                        ? `+${Math.round(band.gain)}`
                        : Math.round(band.gain)}
                    </span>

                    <div className="flex-1 flex items-center justify-center py-2 h-full">
                      <EQSlider
                        orientation="vertical"
                        min={-12}
                        max={12}
                        step={0.5}
                        value={band.gain}
                        trackLength="160px"
                        onChange={(e) =>
                          onBandChange(
                            band.id,
                            "gain",
                            parseFloat(e.target.value)
                          )
                        }
                        onDoubleClick={() => onBandReset(band.id)}
                        title={`${band.frequency}Hz: ${band.gain}dB`}
                        className="h-full"
                      />
                    </div>
                    <span className="text-[9px] text-text-muted font-sans whitespace-nowrap">
                      {band.frequency >= 1000
                        ? `${(band.frequency / 1000).toFixed(1)}k`
                        : `${band.frequency}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* COMPACT: Horizontal Sliders (List Style) */
            <div className="space-y-3">
              {bands.map((band) => (
                <div
                  key={band.id}
                  className="p-3 bg-surface border border-border rounded-lg space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-text font-sans w-16">
                      {band.frequency >= 1000
                        ? `${(band.frequency / 1000).toFixed(1)}kHz`
                        : `${band.frequency}Hz`}
                    </span>
                    <EQSlider
                      min={-12}
                      max={12}
                      step={0.5}
                      value={band.gain}
                      onChange={(e) =>
                        onBandChange(
                          band.id,
                          "gain",
                          parseFloat(e.target.value)
                        )
                      }
                      onDoubleClick={() => onBandReset(band.id)}
                      className="flex-1 mx-3"
                    />
                    <span className="text-xs font-sans text-accent w-10 text-right">
                      {band.gain > 0
                        ? `+${band.gain.toFixed(1)}`
                        : band.gain.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reset Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        disabled={!enabled}
        className="w-full text-red-500 hover:bg-red-500/10 hover:border-red-500 border-red-500/30"
      >
        <IconRefresh size={16} stroke={1.5} className="mr-2" />
        Reset to Flat
      </Button>
    </div>
  );
}
