import { useDSPStore, type IEQBand } from "@sonantica/dsp";
import { useUIStore } from "@sonantica/ui";

export function useEQSidebarLogic() {
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

  const { eqOpen, toggleEQ, eqSidebarWidth } = useUIStore();

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
    handlePreampChange
  };
}
