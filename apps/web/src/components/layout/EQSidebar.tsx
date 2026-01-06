/**
 * EQ Sidebar
 *
 * "If a function alters the sound, it must be optional, explainable, and reversible."
 *
 * Professional equalizer interface for Sonántica.
 * Follows the same design pattern as RightSidebar (Queue) and LyricsSidebar.
 */

import { IconWaveSquare, IconRefresh } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";

import { Button, Badge, SidebarContainer, EQSlider } from "@sonantica/ui";
import { useEQSidebarLogic } from "../../hooks/useEQSidebarLogic";
import { VocalModeControl } from "../dsp/VocalModeControl";

const itemVariants: Variants = {
  hidden: { x: 20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    x: -20,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

interface EQSidebarProps {
  isCollapsed?: boolean;
}

export function EQSidebar({ isCollapsed }: EQSidebarProps) {
  const {
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
    handleBandReset,
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
        /* XS VIEW (Collapsed) - width ~80px */
        <div className="flex flex-col items-center h-full gap-4 pt-2 pb-4">
          {/* DSP Toggle (Vertical/Compact) */}
          <div className="flex flex-col items-center gap-1">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface border-2 border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent peer-checked:border-accent"></div>
            </label>
            <span className="text-[9px] font-sans text-text-muted opacity-80 uppercase tracking-widest">
              {config.enabled ? "ON" : "OFF"}
            </span>
          </div>

          {/* Preset Selector (Compact) */}
          <div className="relative w-full px-2">
            <select
              className="w-full h-8 bg-surface-elevated border border-border rounded text-[10px] text-center appearance-none cursor-pointer focus:border-accent focus:ring-1 focus:ring-accent truncated"
              value={config.currentPreset || "custom"}
              onChange={(e) => handlePresetChange(e.target.value)}
              disabled={!config.enabled}
              title="Change Preset"
            >
              <option value="custom">Custom</option>
              {presets.map((preset: any) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            {/* Tiny indicator to show it's a dropdown */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
              <svg width="6" height="4" viewBox="0 0 6 4" fill="none">
                <path d="M3 4L0 0H6L3 4Z" fill="currentColor" />
              </svg>
            </div>
          </div>

          <div className="w-full h-[1px] bg-border my-1"></div>

          {/* Vertical Preamp Slider taking most space */}
          <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 relative">
            <span className="text-[9px] text-text-muted font-sans mb-2">
              PRE
            </span>
            <EQSlider
              orientation="vertical"
              min={-20}
              max={20}
              step={0.5}
              value={config.preamp}
              trackLength="100%"
              onChange={(e) => handlePreampChange(parseFloat(e.target.value))}
              onDoubleClick={() => handlePreampChange(0)}
              disabled={!config.enabled}
              title={`Preamp: ${config.preamp}dB`}
              className="flex-1 py-4"
            />
            <span className="text-[9px] text-accent font-sans mt-2">
              {config.preamp > 0 ? `+${config.preamp}` : config.preamp}
            </span>
          </div>

          <div className="w-full h-[1px] bg-border my-1"></div>

          {/* Reset Button (Small) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => reset()}
            disabled={!config.enabled}
            className="w-10 h-10 p-0 rounded-full text-red-500 hover:bg-red-500/10"
            title="Reset to Flat"
          >
            <IconRefresh size={18} stroke={1.5} />
          </Button>
        </div>
      ) : (
        /* STANDARD VIEW (Expanded) */
        <div className="space-y-5">
          {/* Enable/Disable Toggle */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl border border-border"
          >
            <div className="flex flex-col">
              <span className="text-sm font-semibold">DSP Processing</span>
              <span className="text-xs text-text-muted">
                {config.enabled ? "Enabled" : "Bypassed"}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface border-2 border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent peer-checked:border-accent"></div>
            </label>
          </motion.div>

          {/* Preset Selector */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            <label className="block text-sm font-semibold text-text">
              Preset
            </label>
            <select
              className="w-full p-3 bg-surface border border-border rounded-lg text-text text-sm cursor-pointer transition-colors hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-text-muted italic px-1"
              >
                {currentPreset.description}
              </motion.p>
            )}
          </motion.div>

          {/* Preamp Control */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-text">
                Preamp
              </label>
              <Badge
                variant="custom"
                className="text-xs font-sans bg-accent/10 text-accent px-2 py-0.5"
              >
                {config.preamp.toFixed(1)} dB
              </Badge>
            </div>
            <input
              type="range"
              className="w-full h-2 bg-surface rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              min="-20"
              max="20"
              step="0.5"
              value={config.preamp}
              onChange={(e) => handlePreampChange(parseFloat(e.target.value))}
              disabled={!config.enabled}
            />
            <div className="flex justify-between text-[10px] text-text-muted font-sans px-1">
              <span>-20</span>
              <span>0</span>
              <span>+20</span>
            </div>
          </motion.div>

          {/* Vocal Mode Control */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <VocalModeControl />
          </motion.div>

          {/* ReplayGain / Normalization (Placeholder/Manual) */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold">
                Volume Normalization
              </span>
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
          </motion.div>

          {/* Band Controls - Responsive Layout */}
          <AnimatePresence>
            {config.enabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Frequency Bands</span>
                  {/* View Mode Indicator (Debug/Info) */}
                  <span className="text-[10px] text-text-muted uppercase tracking-wider">
                    {eqSidebarWidth >= 480 ? "Graphic Mode" : "List Mode"}
                  </span>
                </div>

                {eqSidebarWidth >= 480 ? (
                  /* EXPANDED: Vertical Sliders (Graphic EQ Style) */
                  <div className="relative h-64 p-4 bg-surface-elevated rounded-xl border border-border">
                    {/* Grid Lines/Axis */}
                    <div className="absolute inset-0 p-4 pointer-events-none flex flex-col justify-between text-[9px] text-text-muted/30 font-sans select-none">
                      <div className="w-full border-t border-border/30 flex items-center">
                        <span className="-mt-3">+12dB</span>
                      </div>
                      <div className="w-full border-t border-dashed border-border/20"></div>
                      <div className="w-full border-t border-accent/20 flex items-center">
                        <span className="-mt-3 text-accent/50">0dB</span>
                      </div>
                      <div className="w-full border-t border-dashed border-border/20"></div>
                      <div className="w-full border-t border-border/30 flex items-center">
                        <span className="-mt-3">-12dB</span>
                      </div>
                    </div>

                    {/* Sliders Container */}
                    <div className="relative h-full flex justify-between items-end z-10 mx-6">
                      {currentBands.map((band) => (
                        <div
                          key={band.id}
                          className="flex flex-col items-center h-full justify-between pb-1 gap-1 min-w-[32px] group"
                        >
                          {/* Gain Value (Hidden by default, shown on hover/active) */}
                          <span
                            className={`text-[9px] font-sans transition-opacity ${
                              band.gain === 0
                                ? "opacity-0 group-hover:opacity-100"
                                : "opacity-100 text-accent"
                            }`}
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
                                handleBandChange(
                                  band.id,
                                  "gain",
                                  parseFloat(e.target.value)
                                )
                              }
                              onDoubleClick={() => handleBandReset(band.id)}
                              title={`${band.frequency}Hz: ${band.gain}dB`}
                              className="h-full"
                            />
                          </div>

                          {/* Frequency Label */}
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
                    {currentBands.map((band) => (
                      <motion.div
                        key={band.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-surface border border-border rounded-lg space-y-2"
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
                              handleBandChange(
                                band.id,
                                "gain",
                                parseFloat(e.target.value)
                              )
                            }
                            onDoubleClick={() => handleBandReset(band.id)}
                            className="flex-1 mx-3"
                          />
                          <span className="text-xs font-sans text-accent w-10 text-right">
                            {band.gain > 0
                              ? `+${band.gain.toFixed(1)}`
                              : band.gain.toFixed(1)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reset Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => reset()}
            disabled={!config.enabled}
            className="w-full text-red-500 hover:bg-red-500/10 hover:border-red-500 border-red-500/30"
          >
            <IconRefresh size={16} stroke={1.5} className="mr-2" />
            Reset to Flat
          </Button>
        </div>
      )}
    </SidebarContainer>
  );
}
