import React, { useState, useEffect, useMemo } from "react";
import {
  IconAdjustmentsHorizontal,
  IconRoute,
  IconVolume,
  IconVolume2,
  IconMicrophone,
  IconHeadset,
  IconSpeakerphone,
  IconActivity,
  IconSettings,
  IconFolder,
} from "@tabler/icons-react";
import { cn, type AudioDevice } from "@sonantica/shared";
import { Button, FileExplorer } from "@sonantica/ui";
import { createTauriFileProvider } from "../../../utils/tauriFileProvider";

export const OrquestadorWorkspace: React.FC = () => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExplorer, setShowExplorer] = useState(false);

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
          console.error("Failed to fetch audio devices:", err);
        } finally {
          setLoading(false);
        }
      };
      loadDevices();
    } else {
      // Mock for web preview
      setDevices([
        { name: "System Output (Virtual)", kind: "Output", is_default: true },
        {
          name: "Headphones (Realtek High Definition Audio)",
          kind: "Output",
          is_default: false,
        },
        { name: "Built-in Microphone", kind: "Input", is_default: true },
        { name: "Virtual Cable A", kind: "Both", is_default: false },
      ]);
      setLoading(false);
    }
  }, []);

  const inputDevices = useMemo(
    () => devices.filter((d) => d.kind === "Input" || d.kind === "Both"),
    [devices]
  );
  const outputDevices = useMemo(
    () => devices.filter((d) => d.kind === "Output" || d.kind === "Both"),
    [devices]
  );

  return (
    <div className="flex flex-col h-full bg-[#121418] text-text animate-in fade-in duration-500 overflow-hidden">
      {/* VoiceMeeter-style Action Bar */}
      <div className="h-16 border-b border-white/5 bg-[#1a1d23] flex items-center px-6 justify-between shadow-xl z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <IconRoute className="text-accent" size={24} />
            <h1 className="text-lg font-bold tracking-tighter uppercase italic">
              Orquestador
            </h1>
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <nav className="flex items-center gap-1">
            <NavButton label="Main Mixer" active />
            <NavButton label="Virtual Cables" />
            <NavButton label="Network (VBAN)" />
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowExplorer(!showExplorer)}
            className={cn(
              "p-2 rounded-lg transition-all",
              showExplorer
                ? "bg-accent/20 text-accent"
                : "text-text-muted hover:bg-white/5"
            )}
            title="Toggle File Explorer"
          >
            <IconFolder size={20} />
          </button>
          {!loading && (
            <div className="px-3 py-1.5 bg-black/40 rounded border border-white/5 font-mono text-[10px] text-emerald-400">
              ENGINE: 48kHz / 512smp
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/5 border-white/10 hover:bg-white/10"
          >
            <IconSettings size={18} className="mr-2" />
            Menu
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Main Interface */}
        <div className="flex-1 p-6 flex gap-6 overflow-hidden">
          {/* Hardware Inputs */}
          <div className="flex flex-col gap-4 w-1/4 min-w-[300px]">
            <SectionHeader label="Hardware Inputs" icon={IconMicrophone} />
            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {inputDevices.slice(0, 2).map((device, i) => (
                <MixerStrip
                  key={`${device.name}-${i}`}
                  name={device.name}
                  icon={IconMicrophone}
                  color="accent"
                  isDefault={device.is_default}
                />
              ))}
              {inputDevices.length === 0 && !loading && (
                <div className="flex-1 bg-[#1a1d23] rounded-2xl border border-white/5 border-dashed flex items-center justify-center text-text-muted text-xs">
                  No inputs found
                </div>
              )}
            </div>
          </div>

          {/* Virtual Inputs */}
          <div className="flex flex-col gap-4 flex-1">
            <SectionHeader label="Virtual Inputs" icon={IconActivity} />
            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              <MixerStrip
                name="Sonántica Core"
                icon={IconVolume}
                color="emerald"
                wide
                isDefault
              />
              <MixerStrip
                name="System Audio"
                icon={IconVolume2}
                color="blue"
                wide
              />
            </div>
          </div>

          {/* Hardware Outputs (Master Section) */}
          <div className="flex flex-col gap-4 w-1/3 min-w-[350px]">
            <SectionHeader label="Master Outputs" icon={IconSpeakerphone} />
            <div className="flex-1 bg-[#1a1d23] rounded-2xl border border-white/5 p-6 flex flex-col gap-6 shadow-2xl overflow-y-auto custom-scrollbar">
              {outputDevices.slice(0, 3).map((device, i) => (
                <MasterOutputItem
                  key={`${device.name}-${i}`}
                  name={device.name}
                  icon={
                    device.name.toLowerCase().includes("headphone")
                      ? IconHeadset
                      : IconSpeakerphone
                  }
                  bus={`A${i + 1}`}
                  active={device.is_default}
                />
              ))}
              {outputDevices.length === 0 && !loading && (
                <div className="flex-1 flex items-center justify-center text-text-muted text-xs border border-white/5 border-dashed rounded-xl">
                  No outputs found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Optional Right Panel: File Explorer */}
        {showExplorer && (
          <div className="w-80 border-l border-white/5 bg-[#1a1d23]/50 p-4 flex flex-col gap-4 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between">
              <SectionHeader label="Quick Assets" icon={IconFolder} />
              <button
                onClick={() => setShowExplorer(false)}
                className="text-text-muted hover:text-text"
              >
                <IconAdjustmentsHorizontal size={14} />
              </button>
            </div>
            <FileExplorer
              provider={fileProvider}
              className="flex-1 border-white/5 bg-black/20"
            />
          </div>
        )}
      </div>
    </div>
  );
};

const SectionHeader = ({ label, icon: Icon }: any) => (
  <div className="flex items-center gap-2 text-text-muted mb-1">
    <Icon size={16} stroke={1.5} />
    <h2 className="text-[10px] font-bold uppercase tracking-widest">{label}</h2>
  </div>
);

const NavButton = ({ label, active }: any) => (
  <button
    className={cn(
      "px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
      active
        ? "bg-accent/10 text-accent ring-1 ring-accent/30"
        : "text-text-muted hover:bg-white/5 hover:text-text"
    )}
  >
    {label}
  </button>
);

const MixerStrip = ({ name, icon: Icon, color, wide, isDefault }: any) => (
  <div
    className={cn(
      "bg-[#1a1d23] rounded-2xl border border-white/5 flex flex-col p-4 shadow-xl",
      wide ? "flex-1" : "min-w-[120px] max-w-[140px]",
      isDefault && "border-accent/30 shadow-accent/5"
    )}
  >
    <div className="flex flex-col items-center gap-2 mb-6">
      <div
        className={cn(
          "p-2 rounded-xl bg-[#23272e]",
          isDefault && "text-accent"
        )}
      >
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-bold text-center uppercase tracking-tighter truncate w-full px-1">
        {name}
      </span>
    </div>

    <div className="flex-1 flex justify-center gap-3">
      <VUMeter color={color} />
      <VUMeter color={color} />

      <div className="relative w-8 bg-[#121418] rounded-full border border-white/5 flex items-end p-0.5 overflow-hidden group">
        <div
          className={cn(
            "w-full bg-gradient-to-t from-accent to-accent-light rounded-full shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]"
          )}
          style={{ height: "70%" }}
        />
        <div className="absolute inset-x-0 h-4 bg-white/20 border-y border-white/10 top-[30%] cursor-ns-resize shadow-md" />
      </div>
    </div>

    <div className="mt-6 flex flex-col gap-2">
      <div className="flex gap-1 justify-center">
        <MixerToggle label="M" danger />
        <MixerToggle label="S" warning />
      </div>
      <div className="flex flex-wrap gap-1 justify-center">
        {["A1", "A2", "B1"].map((bus) => (
          <MixerToggle
            key={bus}
            label={bus}
            small
            active={bus === "A1" && isDefault}
          />
        ))}
      </div>
    </div>
  </div>
);

const VUMeter = ({ color }: { color: string }) => (
  <div className="relative w-1.5 h-full bg-[#121418] rounded-full overflow-hidden flex flex-col justify-end p-[1px]">
    <div className="h-full bg-gradient-to-t from-emerald-500 via-yellow-500 to-red-500 rounded-full opacity-20" />
    <div
      className={cn(
        "absolute bottom-0 left-[1px] right-[1px] bg-emerald-500 rounded-full animate-pulse"
      )}
      style={{
        height: "60%",
        backgroundColor: color === "accent" ? "var(--accent)" : color,
      }}
    />
  </div>
);

const MixerToggle = ({ label, active, danger, warning, small }: any) => (
  <button
    className={cn(
      "rounded font-bold transition-all border",
      small ? "text-[8px] px-1.5 py-0.5" : "text-[10px] w-7 h-7",
      active
        ? danger
          ? "bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
          : warning
          ? "bg-yellow-500/20 border-yellow-500 text-yellow-500"
          : "bg-accent/20 border-accent text-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]"
        : "bg-[#23272e] border-white/5 text-text-muted hover:border-white/20"
    )}
  >
    {label}
  </button>
);

const MasterOutputItem = ({ name, icon: Icon, bus, active }: any) => (
  <div
    className={cn(
      "flex items-center gap-4 transition-all group",
      !active && "opacity-40 grayscale hover:grayscale-0 hover:opacity-100"
    )}
  >
    <div
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-lg flex-shrink-0",
        active
          ? "bg-accent text-white"
          : "bg-[#23272e] text-text-muted border border-border/10"
      )}
    >
      {bus}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <Icon
          size={14}
          className={active ? "text-accent" : "text-text-muted"}
        />
        <span className="text-xs font-bold uppercase tracking-tight truncate">
          {name}
        </span>
      </div>
      <div className="h-1.5 bg-[#121418] rounded-full overflow-hidden flex items-center">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            active ? "bg-accent w-2/3" : "bg-text-muted/20 w-1/4"
          )}
        />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="text-[10px] font-mono text-emerald-400 font-bold">
        -12.5dB
      </div>
      <IconAdjustmentsHorizontal
        size={18}
        className="text-text-muted hover:text-text cursor-pointer"
      />
    </div>
  </div>
);
