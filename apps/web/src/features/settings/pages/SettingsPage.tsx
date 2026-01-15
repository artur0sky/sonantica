import { useState } from "react";
import { Tabs, type Tab } from "@sonantica/ui";
import {
  IconMusic,
  IconBooks,
  IconInfoCircle,
  IconPalette,
  IconCloudDownload,
  IconChartBar,
  IconPlugConnected,
  IconDeviceDesktop,
} from "@tabler/icons-react";

// Sub-pages
import { AudioSettings } from "../components/AudioSettings";
import { LibrarySettings } from "../components/LibrarySettings";
import { InterfaceSettings } from "../components/InterfaceSettings";
import { OfflineSettings } from "../components/OfflineSettings";
import { AnalyticsSettings } from "../components/AnalyticsSettings";
import { PluginsSettings } from "../components/PluginsSettings";
import { DesktopSettings } from "../components/DesktopSettings";
import { isTauri } from "@sonantica/shared";
import { useSettingsStore } from "../../../stores/settingsStore";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general"); // Default to General/Interface
  const devForceStudio = useSettingsStore((s) => s.devForceStudio);
  const isTauriEnv = isTauri();

  const tabs: Tab[] = [
    {
      id: "general",
      label: "Interface",
      icon: IconPalette,
    },
    {
      id: "audio",
      label: "Audio",
      icon: IconMusic,
    },
    {
      id: "library",
      label: "Library",
      icon: IconBooks,
    },
    {
      id: "plugins",
      label: "Workshop",
      icon: IconPlugConnected,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: IconChartBar,
    },
    {
      id: "offline",
      label: "Offline",
      icon: IconCloudDownload,
    },
    ...(isTauriEnv || devForceStudio
      ? [
          {
            id: "desktop",
            label: "Desktop",
            icon: IconDeviceDesktop,
          },
        ]
      : []),

    {
      id: "info",
      label: "About",
      icon: IconInfoCircle,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 pb-32 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border pb-6 sm:pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-text-muted">
            Configure Sonántica as a sound interpreter.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="-mx-4 sm:mx-0">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-8"
        />
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === "general" && <InterfaceSettings />}
        {activeTab === "audio" && <AudioSettings />}
        {activeTab === "library" && <LibrarySettings />}
        {activeTab === "offline" && <OfflineSettings />}
        {activeTab === "analytics" && <AnalyticsSettings />}
        {activeTab === "plugins" && <PluginsSettings />}
        {activeTab === "desktop" && <DesktopSettings />}

        {activeTab === "info" && (
          <div className="bg-surface-elevated border border-border rounded-xl p-4 sm:p-6 space-y-8 animate-in fade-in duration-500">
            <div>
              <h2 className="text-xl font-semibold mb-4">About Sonántica</h2>
              <div className="prose prose-invert max-w-none text-text-muted text-sm sm:text-base">
                <p className="mb-4 leading-relaxed">
                  <strong className="text-text-primary underline decoration-accent decoration-2 underline-offset-4">
                    The Wise Craftsman.
                  </strong>{" "}
                  Sonántica is a professional multimedia player designed for
                  audio fidelity, user autonomy and contemplative listening.
                </p>
                <div className="italic text-accent/80 border-l-2 border-accent/20 pl-4 py-2 bg-accent/5 rounded-r-lg">
                  "Respect the intention of the sound and the freedom of the
                  listener."
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-border grid grid-cols-1 xs:grid-cols-2 gap-6 text-sm text-text-muted">
              <div className="space-y-1">
                <p className="font-medium text-text-primary uppercase tracking-widest text-[10px]">
                  Version
                </p>
                <p>0.1.0 Alpha (Prototype)</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-text-primary uppercase tracking-widest text-[10px]">
                  Core Architecture
                </p>
                <p className="font-mono text-xs text-accent">
                  Tauri v2 + Web Audio API
                </p>
              </div>
              <div className="space-y-1 border-t border-border/10 pt-4 xs:border-none xs:pt-0">
                <p className="font-medium text-text-primary uppercase tracking-widest text-[10px]">
                  License
                </p>
                <p>Apache-2.0 Open Source</p>
              </div>
              <div className="space-y-1 border-t border-border/10 pt-4 xs:border-none xs:pt-0">
                <p className="font-medium text-text-primary uppercase tracking-widest text-[10px]">
                  Identity
                </p>
                <p>Arturo Sky & Sonántica Team</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
