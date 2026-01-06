import { useDSPStore, type IEQBand } from "@sonantica/dsp";
import { useState } from "react";

export function useEQLogic() {
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

  return {
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
  };
}
