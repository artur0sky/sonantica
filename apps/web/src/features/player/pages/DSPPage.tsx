import {
  IconWaveSquare,
  IconSparkles,
  IconMicrophoneOff,
  IconSettings,
  IconAdjustmentsHorizontal,
  IconHistory,
  IconLayersIntersect,
} from "@tabler/icons-react";
import { EQExpandedView, Badge, Button } from "@sonantica/ui";
import { useEQSidebarLogic } from "../../../hooks/useEQSidebarLogic";
import { VocalModeControl } from "../../../components/dsp/VocalModeControl";

export function DSPPage() {
  const {
    config,
    presets,
    isInitialized,
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <IconWaveSquare className="text-accent" size={32} />
            DSP Engine
          </h1>
          <p className="text-text-muted">
            Professional audio processing and AI-enhanced listening.
          </p>
        </div>
        <div className="flex gap-2">
          {isInitialized && (
            <Badge
              variant={config.enabled ? "accent" : "default"}
              className="px-4 py-2 text-sm"
            >
              {config.enabled ? "Processing Active" : "DSP Bypassed"}
            </Badge>
          )}
          <Button variant="secondary" onClick={reset} size="sm">
            <IconHistory size={16} className="mr-2" /> Reset
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: EQ */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl overflow-hidden bg-surface-elevated/30 border border-accent/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <IconAdjustmentsHorizontal size={20} className="text-accent" />
                Parametric Equalizer
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">Master Gain</span>
                  <span className="text-xs font-mono font-bold text-accent">
                    {config.preamp > 0 ? "+" : ""}
                    {config.preamp} dB
                  </span>
                </div>
              </div>
            </div>
            <EQExpandedView
              viewWidth={800} // Placeholder, ideally dynamic
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
            />
          </div>

          {/* AI Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/5 to-transparent border border-accent/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-accent text-white">
                  <IconSparkles size={20} />
                </div>
                <h3 className="font-bold">AI Vocal Extraction</h3>
              </div>
              <p className="text-sm text-text-muted mb-4 leading-relaxed">
                Extract vocals or remove them with high fidelity using neural
                network separation.
              </p>
              <VocalModeControl />
            </div>

            <div className="p-6 rounded-2xl bg-surface-elevated/50 border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-surface text-text">
                  <IconLayersIntersect size={20} />
                </div>
                <h3 className="font-bold">Object-Based EQ</h3>
              </div>
              <p className="text-sm text-text-muted mb-4 leading-relaxed">
                Apply target equalization to specific stems like bass, drums, or
                piano individually.
              </p>
              <Button
                variant="secondary"
                className="w-full grayscale opacity-50 cursor-not-allowed text-xs"
                disabled
              >
                Coming Soon: Stem EQ
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar: Config & Info */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface border border-border/40 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">
              Technical Overview
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Sample Rate</span>
                <span className="font-mono text-accent">48,000 Hz</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Bit Depth</span>
                <span className="font-mono text-accent">32-bit Float</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Latency</span>
                <span className="font-mono text-green-500">~12ms</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <h4 className="text-[10px] font-bold text-text-muted uppercase mb-2">
                DSP Principles
              </h4>
              <ul className="text-[10px] text-text-muted/80 space-y-1 italic">
                <li>• If it alters sound, it must be reversible.</li>
                <li>• Fidelity should be offered, not imposed.</li>
                <li>• Respect the intention of the sound.</li>
              </ul>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border/40 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">
              Plugins
            </h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-surface flex items-center justify-between border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <IconSparkles size={16} className="text-emerald-500" />
                  <span className="text-sm font-medium">Demucs AI</span>
                </div>
                <Badge variant="accent" className="text-[9px]">
                  ACTIVE
                </Badge>
              </div>
              <div className="p-3 rounded-lg bg-surface flex items-center justify-between opacity-50">
                <div className="flex items-center gap-2">
                  <IconMicrophoneOff size={16} />
                  <span className="text-sm font-medium">
                    Loudness Normalizer
                  </span>
                </div>
                <Badge variant="default" className="text-[9px]">
                  DISABLED
                </Badge>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full text-xs"
              onClick={() => (window.location.hash = "/settings")}
            >
              Manage Plugins <IconSettings size={14} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
