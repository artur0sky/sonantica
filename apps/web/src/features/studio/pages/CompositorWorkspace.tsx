import React, { useState, useEffect, useMemo } from "react";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconPlayerRecord,
  IconScissors,
  IconCopy,
  IconClipboard,
  IconTrash,
  IconVolume,
  IconWaveSquare,
  IconMicrophone,
  IconActivity as IconAnalyze,
  IconSettings,
  IconDownload,
  IconPlus,
} from "@tabler/icons-react";
import { cn, type AudioDevice } from "@sonantica/shared";
import { FileExplorer, Button } from "@sonantica/ui";
import { motion } from "framer-motion";
import { createTauriFileProvider } from "../../../utils/tauriFileProvider";

export const CompositorWorkspace: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [devices, setDevices] = useState<AudioDevice[]>([]);

  const fileProvider = useMemo(() => {
    const isTauri =
      typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__;
    return isTauri ? createTauriFileProvider() : undefined;
  }, []);

  useEffect(() => {
    const isTauri =
      typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__;
    if (isTauri) {
      const loadDevices = async () => {
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          const res = await invoke("get_audio_devices");
          setDevices(res as AudioDevice[]);
        } catch (err) {
          console.error("Failed to get audio devices", err);
        }
      };
      loadDevices();
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-surface-base text-text animate-in fade-in duration-500 overflow-hidden">
      {/* Dynamic Action Bar (Personalizada) */}
      <div className="h-14 border-b border-border/40 bg-surface-elevated/40 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-0.5 bg-surface rounded-lg border border-border/40 p-0.5">
            <ActionButton icon={IconScissors} label="Cut" />
            <ActionButton icon={IconCopy} label="Copy" />
            <ActionButton icon={IconClipboard} label="Paste" />
            <div className="w-[1px] h-4 bg-border/40 mx-1" />
            <ActionButton icon={IconTrash} label="Silence" variant="danger" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
              Tools
            </span>
            <div className="flex items-center gap-1">
              <ToolButton icon={IconWaveSquare} active />
              <ToolButton icon={IconAnalyze} />
              <ToolButton icon={IconVolume} />
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
          <div className="flex items-center gap-1 bg-black/40 px-4 py-2 rounded-xl border border-border/20 font-mono text-xl text-accent-light tracking-tighter shadow-lg">
            <span className="opacity-50 text-sm mr-2 uppercase tracking-widest font-sans">
              Time
            </span>
            00:01:23.42
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" className="bg-surface/50">
            <IconDownload size={18} className="mr-2" />
            Export
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <IconSettings size={20} className="text-text-muted" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: File Explorer */}
        <div className="w-72 border-r border-border/40 flex flex-col p-4 space-y-4">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-2">
            Assets
          </h3>
          <FileExplorer provider={fileProvider} className="flex-1" />
        </div>

        {/* Main Content: Waveform Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black/10">
          <div className="flex-1 relative overflow-auto custom-scrollbar p-8">
            <div className="space-y-6">
              <TrackItem label="Vocal" color="accent" height={200} />
              <TrackItem label="Backing" color="emerald" height={120} />
              <TrackItem label="Ambient" color="purple" height={80} />
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] z-10 pointer-events-none"
              style={{ left: "35%" }}
            />
          </div>

          {/* Transport Controls (Modernized) */}
          <div className="h-20 bg-surface-elevated/80 border-t border-border/40 backdrop-blur-md flex items-center justify-center gap-6 px-8 select-none">
            <div className="flex-1 flex items-center gap-4 max-w-sm">
              <IconVolume size={18} className="text-text-muted" />
              <div className="h-1 bg-border/40 rounded-full flex-1 overflow-hidden">
                <div className="h-full bg-accent w-3/4 rounded-full" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <TransportButton icon={IconPlayerStop} size="lg" />
              <TransportButton
                icon={isPlaying ? IconPlayerPause : IconPlayerPlay}
                onClick={() => setIsPlaying(!isPlaying)}
                primary
                size="xl"
              />
              <TransportButton
                icon={IconPlayerRecord}
                variant="danger"
                active={isRecording}
                onClick={() => setIsRecording(!isRecording)}
                size="lg"
              />
            </div>

            <div className="flex-1 flex justify-end gap-2 text-xs font-mono text-text-muted">
              <span className="truncate max-w-[100px]">
                {devices.find((d) => d.is_default && d.kind !== "Input")
                  ?.name || "Output"}
              </span>
              <div className="w-24 h-4 bg-black/40 rounded overflow-hidden flex flex-col gap-[1px] p-[1px]">
                <div className="h-full bg-emerald-500/60 w-4/5 rounded-sm" />
                <div className="h-full bg-emerald-500/60 w-3/4 rounded-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Effects/Properties */}
        <div className="w-80 border-l border-border/40 bg-surface-elevated/20 p-6 flex flex-col space-y-8 overflow-y-auto">
          <section>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">
              Properties
            </h3>
            <div className="space-y-4">
              <PropertyItem label="Format" value="WAV (IEEE Float)" />
              <PropertyItem label="Sample Rate" value="48000 Hz" />
              <PropertyItem label="Channels" value="Stereo" />
              <PropertyItem label="Bit Depth" value="32-bit" />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex justify-between items-center">
              Effects Chain
              <IconPlus
                size={14}
                className="cursor-pointer hover:text-accent"
              />
            </h3>
            <div className="space-y-2">
              <EffectItem name="Parametric EQ" active />
              <EffectItem name="Dynamics" active />
              <EffectItem name="Reverb" />
              <EffectItem name="De-Esser" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({
  icon: Icon,
  label,
  variant,
}: {
  icon: any;
  label: string;
  variant?: "danger";
}) => (
  <button
    className={cn(
      "p-2 hover:bg-surface-elevated rounded-md transition-all group relative",
      variant === "danger" ? "hover:text-red-400" : "hover:text-accent"
    )}
    title={label}
  >
    <Icon size={18} stroke={1.5} />
  </button>
);

const ToolButton = ({
  icon: Icon,
  active,
}: {
  icon: any;
  active?: boolean;
}) => (
  <button
    className={cn(
      "p-2 rounded-lg transition-all",
      active
        ? "bg-accent/20 text-accent ring-1 ring-accent/30"
        : "hover:bg-surface-elevated text-text-muted"
    )}
  >
    <Icon size={18} stroke={1.5} />
  </button>
);

const TransportButton = ({
  icon: Icon,
  primary,
  active,
  variant,
  onClick,
  size,
}: any) => {
  const isDanger = variant === "danger";
  const sizeClass = size === "xl" ? "p-4" : size === "lg" ? "p-3" : "p-2";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "rounded-full transition-all flex items-center justify-center",
        primary &&
          "bg-accent text-white shadow-lg shadow-accent/20 hover:bg-accent-hover",
        isDanger &&
          (active
            ? "bg-red-500 text-white animate-pulse"
            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"),
        !primary &&
          !isDanger &&
          "bg-surface text-text-muted hover:bg-surface-elevated hover:text-text border border-border/40",
        sizeClass
      )}
    >
      <Icon
        size={size === "xl" ? 24 : 20}
        fill={active || primary ? "currentColor" : "none"}
      />
    </motion.button>
  );
};

const TrackItem = ({
  label,
  color,
  height,
}: {
  label: string;
  color: string;
  height: number;
}) => (
  <div className="relative group">
    <div
      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
      style={{ backgroundColor: `var(--${color})`, opacity: 0.5 }}
    />
    <div
      className="bg-surface/40 border border-border/20 rounded-md p-4"
      style={{ height }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconMicrophone size={14} className="text-text-muted" />
          <IconSettings size={14} className="text-text-muted" />
        </div>
      </div>

      {/* Mock Waveform */}
      <div className="flex-1 flex items-center h-2/3">
        <div className="w-full flex items-center gap-[1px]">
          {Array.from({ length: 120 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-accent/40 rounded-full"
              style={{
                height: `${Math.sin(i * 0.2) * 50 + 50}%`,
                backgroundColor: i % 15 === 0 ? `var(--${color})` : undefined,
                opacity: i % 15 === 0 ? 0.8 : 0.4,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const PropertyItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-text-muted">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const EffectItem = ({ name, active }: { name: string; active?: boolean }) => (
  <div
    className={cn(
      "p-3 rounded-lg border flex items-center justify-between transition-all cursor-pointer",
      active
        ? "bg-accent/10 border-accent/20 text-text"
        : "bg-surface border-border/40 text-text-muted hover:border-border hover:bg-surface-elevated"
    )}
  >
    <span className="text-xs font-semibold">{name}</span>
    <div
      className={cn(
        "w-2 h-2 rounded-full",
        active
          ? "bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]"
          : "bg-text-muted/30"
      )}
    />
  </div>
);
