import { useDSPStore, type IEQBand } from "@sonantica/dsp";
import { useUIStore } from "@sonantica/ui";
import { useAnalytics } from "@sonantica/analytics";

export function useEQSidebarLogic() {
  const {
    config,
    presets,
    isInitialized,
    applyPreset,
    updateBand,
    setPreamp,
    setEnabled: dspSetEnabled,
    reset: dspReset,
  } = useDSPStore();

  const { eqOpen, toggleEQ, eqSidebarWidth } = useUIStore();
  const analytics = useAnalytics();

  const setEnabled = (enabled: boolean) => {
    dspSetEnabled(enabled);
    analytics.trackDSPChange("dsp_toggle", { enabled });
  };

  const reset = () => {
    dspReset();
    analytics.trackDSPChange("dsp_reset", { preset: "flat" });
  };

  const currentPreset = presets.find((p: any) => p.id === config.currentPreset);
  const currentBands = getCurrentBands();

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
      analytics.trackDSPChange("preset_applied", { presetId });
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

  return {
    config,
    presets,
    isInitialized,
    eqOpen,
    toggleEQ,
    eqSidebarWidth,
    currentPreset,
    currentBands,
    setEnabled,
    reset,
    handlePresetChange,
    handleBandChange,
    handlePreampChange,
    handleBandReset: (bandId: string) => {
      // Logic: If on a preset, reset to that preset's original value.
      // If on 'custom' or otherwise, reset to 0.
      
      let targetGain = 0;
      
      if (config.currentPreset && config.currentPreset !== "custom") {
         const originalPreset = presets.find((p: any) => p.id === config.currentPreset);
         if (originalPreset) {
             const originalBand = originalPreset.bands.find((b: { id: string; }) => b.id === bandId);
             if (originalBand) {
                 targetGain = originalBand.gain;
             }
         }
      }

      updateBand(bandId, { gain: targetGain });
    }
  };
}
