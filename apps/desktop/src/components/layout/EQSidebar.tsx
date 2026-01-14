import React from "react";
import { IconWaveSquare } from "@tabler/icons-react";
import {
  Badge,
  SidebarContainer,
  EQCollapsedView,
  EQExpandedView,
} from "@sonantica/ui";
import { useEQSidebarLogic } from "../../hooks/useEQSidebarLogic";
import { VocalModeControl } from "../dsp/VocalModeControl";

interface EQSidebarProps {
  isCollapsed?: boolean;
}

export const EQSidebar: React.FC<EQSidebarProps> = ({
  isCollapsed = false,
}) => {
  const {
    config,
    presets,
    isInitialized,
    eqOpen,
    toggleEQ,
    eqSidebarWidth,
    currentBands,
    setEnabled,
    reset,
    handlePresetChange,
    handleBandChange,
    handlePreampChange,
    handleBandReset,
    crossfadeDuration,
    setCrossfadeDuration,
    fadeOutDuration,
    setFadeOutDuration,
  } = useEQSidebarLogic();

  if (!eqOpen) return null;

  return (
    <SidebarContainer
      title="Equalizer"
      isCollapsed={isCollapsed}
      onClose={toggleEQ}
      headerActions={
        !isCollapsed &&
        isInitialized && (
          <Badge
            variant={config.enabled ? "accent" : "default"}
            className="text-[10px] px-2 py-0.5"
          >
            {config.enabled ? (
              <>
                <IconWaveSquare size={12} className="mr-1" stroke={1.5} />
                DSP On
              </>
            ) : (
              "Flat"
            )}
          </Badge>
        )
      }
    >
      {isCollapsed ? (
        <EQCollapsedView
          enabled={config.enabled}
          setEnabled={setEnabled}
          currentPreset={config.currentPreset || "custom"}
          onPresetChange={handlePresetChange}
          presets={presets}
          preamp={config.preamp}
          onPreampChange={handlePreampChange}
          onReset={reset}
        />
      ) : (
        <EQExpandedView
          enabled={config.enabled}
          setEnabled={setEnabled}
          currentPreset={config.currentPreset || "custom"}
          onPresetChange={handlePresetChange}
          presets={presets}
          preamp={config.preamp}
          onPreampChange={handlePreampChange}
          crossfadeDuration={crossfadeDuration}
          onCrossfadeChange={setCrossfadeDuration}
          fadeOutDuration={fadeOutDuration}
          onFadeOutChange={setFadeOutDuration}
          bands={currentBands}
          onBandChange={(id, field, value) =>
            handleBandChange(id, field as any, value)
          }
          onBandReset={handleBandReset}
          onReset={reset}
          viewWidth={eqSidebarWidth}
          vocalModeControl={<VocalModeControl />}
        />
      )}
    </SidebarContainer>
  );
};
