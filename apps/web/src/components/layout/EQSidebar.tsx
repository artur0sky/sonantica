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

import { Button, Badge, SidebarContainer } from "@sonantica/ui";
import { useEQSidebarLogic } from "../../hooks/useEQSidebarLogic";

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
  } = useEQSidebarLogic();

  if (!eqOpen) return null;

  return (
    <SidebarContainer
      title="Equalizer"
      isCollapsed={isCollapsed}
      onClose={toggleEQ}
      headerActions={
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
              className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5"
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
          <div className="flex justify-between text-[10px] text-text-muted font-mono px-1">
            <span>-20</span>
            <span>0</span>
            <span>+20</span>
          </div>
        </motion.div>

        {/* ReplayGain / Normalization (Placeholder/Manual) */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg"
        >
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
                <div className="flex justify-between items-end h-64 p-4 bg-surface-elevated rounded-xl border border-border overflow-x-auto gap-2">
                  {currentBands.map((band) => (
                    <div
                      key={band.id}
                      className="flex flex-col items-center h-full gap-2 min-w-[32px]"
                    >
                      {/* Gain Value */}
                      <span className="text-[10px] font-mono text-accent h-4">
                        {band.gain > 0
                          ? `+${Math.round(band.gain)}`
                          : Math.round(band.gain)}
                      </span>

                      {/* Vertical Slider */}
                      <div className="relative flex-1 w-8 flex items-center justify-center bg-surface-elevated/50 rounded-full py-2">
                        {/* Central axis line */}
                        <div className="absolute top-2 bottom-2 w-[1px] bg-border z-0"></div>

                        <input
                          type="range"
                          className="absolute h-full w-full rotate-270 appearance-none bg-transparent cursor-pointer z-10
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-[1px] [&::-webkit-slider-thumb]:border-surface
                                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full"
                          style={{
                            width: "256px", // Fixed width needed when rotated to match container height approx
                            height: "8px",
                            borderRadius: "4px",
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%) rotate(-90deg)", // Explicit transform for better control
                            background: `linear-gradient(to right, var(--color-accent, #818cf8) 0%, var(--color-accent, #818cf8) ${
                              ((band.gain + 12) / 24) * 100
                            }%, var(--color-surface-elevated, #3f3f46) ${
                              ((band.gain + 12) / 24) * 100
                            }%, var(--color-surface-elevated, #3f3f46) 100%)`,
                          }}
                          min="-12"
                          max="12"
                          step="0.5"
                          value={band.gain}
                          onChange={(e) =>
                            handleBandChange(
                              band.id,
                              "gain",
                              parseFloat(e.target.value)
                            )
                          }
                          title={`${band.frequency}Hz: ${band.gain}dB`}
                        />
                        {/* Fill bar simulated? Hard with rotated input. Rely on thumb position. */}
                      </div>

                      {/* Frequency Label */}
                      <span className="text-[9px] text-text-muted font-mono transform -rotate-45 origin-top-left mt-2 whitespace-nowrap">
                        {band.frequency >= 1000
                          ? `${(band.frequency / 1000).toFixed(1)}k`
                          : `${band.frequency}`}
                      </span>
                    </div>
                  ))}
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
                        <span className="text-xs font-semibold text-text font-mono w-16">
                          {band.frequency >= 1000
                            ? `${(band.frequency / 1000).toFixed(1)}kHz`
                            : `${band.frequency}Hz`}
                        </span>
                        <input
                          type="range"
                          className="flex-1 mx-3 h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:scale-110 transition-all [&::-moz-range-thumb]:bg-white"
                          min="-12"
                          max="12"
                          step="0.5"
                          value={band.gain}
                          onChange={(e) =>
                            handleBandChange(
                              band.id,
                              "gain",
                              parseFloat(e.target.value)
                            )
                          }
                          style={{
                            background: `linear-gradient(to right, var(--color-accent, #818cf8) 0%, var(--color-accent, #818cf8) ${
                              ((band.gain + 12) / 24) * 100
                            }%, var(--color-surface-elevated, #3f3f46) ${
                              ((band.gain + 12) / 24) * 100
                            }%, var(--color-surface-elevated, #3f3f46) 100%)`,
                          }}
                        />
                        <span className="text-xs font-mono text-accent w-10 text-right">
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
    </SidebarContainer>
  );
}
