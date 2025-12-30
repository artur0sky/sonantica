import { useState } from "react";
import { useLocation } from "wouter";
import { Tabs, type Tab, Button } from "@sonantica/ui";
import {
  IconMusic,
  IconBooks,
  IconServer,
  IconInfoCircle,
  IconPalette,
  IconCloudDownload,
} from "@tabler/icons-react";

// Sub-pages
import { AudioSettings } from "../components/AudioSettings";
import { LibrarySettings } from "../components/LibrarySettings";
import { InterfaceSettings } from "../components/InterfaceSettings";
import { OfflineSettings } from "../components/OfflineSettings";
import { ServersSection } from "../../library/components/ServersSection";

export function SettingsPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("general"); // Default to General/Interface

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
      id: "offline",
      label: "Offline",
      icon: IconCloudDownload,
    },
    {
      id: "servers",
      label: "Servers",
      icon: IconServer,
    },
    {
      id: "info",
      label: "About",
      icon: IconInfoCircle,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 pb-32 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Settings</h1>
          <p className="text-text-muted">
            Customize your listening experience.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setLocation("/")}>
          Back to Player
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-8"
      />

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === "general" && <InterfaceSettings />}
        {activeTab === "audio" && <AudioSettings />}
        {activeTab === "library" && <LibrarySettings />}
        {activeTab === "offline" && <OfflineSettings />}

        {activeTab === "servers" && (
          <div className="bg-surface-elevated border border-border rounded-lg p-6 animate-in fade-in duration-500">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-1">Media Servers</h2>
              <p className="text-sm text-text-muted">
                Manage your connections to Sonántica API servers.
              </p>
            </div>
            <ServersSection />
          </div>
        )}

        {activeTab === "info" && (
          <div className="bg-surface-elevated border border-border rounded-lg p-6 space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-xl font-semibold mb-4">About Sonántica</h2>
              <div className="prose prose-invert max-w-none text-text-muted">
                <p className="mb-4">
                  <strong>The Wise Craftsman.</strong> Sonántica is an
                  open-source multimedia player designed for audio fidelity and
                  user autonomy.
                </p>
                <p>"Sound is not noise, but language."</p>
              </div>
            </div>

            <div className="pt-6 border-t border-border grid grid-cols-2 gap-4 text-sm text-text-muted">
              <div>
                <p className="font-medium text-text-primary">Version</p>
                <p>0.1.0 Alpha</p>
              </div>
              <div>
                <p className="font-medium text-text-primary">Core Engine</p>
                <p>@sonantica/player-core v1.0</p>
              </div>
              <div>
                <p className="font-medium text-text-primary">License</p>
                <p>Apache-2.0</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
