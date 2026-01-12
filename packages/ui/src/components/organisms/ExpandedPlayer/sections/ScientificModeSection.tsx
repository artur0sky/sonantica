/**
 * Scientific Mode Section
 *
 * Provides advanced audio analysis visualizations:
 * - Goniometer (Stereo Scope)
 * - Correlation Meter
 * - Dynamic Range Meter
 * - Real-time Spectrum
 */

import {
  Goniometer,
  CorrelationMeter,
  DynamicRangeMeter,
  BackgroundSpectrum,
} from "../../../molecules";
import { useAnalyzerStore } from "@sonantica/audio-analyzer";

export function ScientificModeSection() {
  const { spectrum } = useAnalyzerStore();
  const bands = spectrum?.bands?.map((b) => b.amplitude) || [];

  return (
    <div className="relative w-full h-full bg-surface-elevated/40 rounded-[2.5rem] overflow-hidden border border-white/5 backdrop-blur-2xl grid grid-rows-[1fr_auto] p-8 gap-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left: Spatial Analysis */}
        <div className="flex flex-col gap-4 min-h-0">
          <header className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-black">
              Spatial Field (Goniometer)
            </span>
          </header>
          <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-4 flex items-center justify-center">
            <Goniometer className="w-full h-full max-h-[400px]" />
          </div>
        </div>

        {/* Right: Level & Phase Analysis */}
        <div className="grid grid-rows-2 gap-8">
          <div className="flex flex-col gap-4">
            <header className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-black">
                Phase Correlation
              </span>
            </header>
            <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-6 flex flex-col justify-center">
              <CorrelationMeter />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <header className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-black">
                Dynamic Energy
              </span>
            </header>
            <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-6 flex flex-col justify-center">
              <DynamicRangeMeter />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Frequency Distribution */}
      <div className="h-40 xl:h-48 relative flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-black">
            Spectral Distribution (Live)
          </span>
        </header>
        <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
          <BackgroundSpectrum
            enabled={true}
            bands={bands}
            className="w-full h-full opacity-80"
          />
        </div>
      </div>
    </div>
  );
}
