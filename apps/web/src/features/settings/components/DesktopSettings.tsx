import { useSettingsStore } from "../../../stores/settingsStore";
import {
  IconLayoutNavbar,
  IconDeviceDesktop,
  IconWindow,
  IconTerminal,
} from "@tabler/icons-react";
import { SettingSection, SettingRow, Select, Switch } from "@sonantica/ui";
import { isTauri } from "@sonantica/shared";

export function DesktopSettings() {
  const { desktopCloseAction, setDesktopCloseAction } = useSettingsStore();
  const isDesktop = isTauri();

  if (!isDesktop) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center space-y-4">
        <IconDeviceDesktop size={48} className="opacity-20" />
        <div className="space-y-1">
          <h3 className="font-medium">OS Integration Unavailable</h3>
          <p className="text-sm max-w-xs mx-auto">
            These settings are only available when running Sonántica as a native
            desktop application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Desktop Integration
          </h2>
          <p className="text-text-muted">
            Configure how Sonántica interacts with the Operating System.
          </p>
        </div>
      </div>

      {/* 1. Window Management */}
      <SettingSection
        title="Window Behavior"
        description="Global settings for the application window."
        icon={IconWindow}
      >
        <SettingRow
          label="Close Action"
          description="Define what happens when the window is closed."
        >
          <div className="w-full sm:w-56">
            <Select
              value={desktopCloseAction}
              onChange={(e) => setDesktopCloseAction(e.target.value as any)}
              options={[
                { value: "ask", label: "Always Ask" },
                { value: "minimize", label: "Minimize to Tray" },
                { value: "close", label: "Quit Application" },
              ]}
            />
          </div>
        </SettingRow>

        <SettingRow
          label="Launch at Startup"
          description="Start Sonántica automatically when logging into the system."
        >
          <div className="opacity-40 cursor-not-allowed">
            <Switch checked={false} onChange={() => {}} disabled />
            <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest">
              Coming Soon
            </p>
          </div>
        </SettingRow>
      </SettingSection>

      {/* 2. System Tray */}
      <SettingSection
        title="Background Execution"
        description="Configuration for the system notification area."
        icon={IconLayoutNavbar}
      >
        <SettingRow
          label="Persistent System Tray"
          description="Keep Sonántica alive in the background for fast access."
        >
          <Switch checked={true} onChange={() => {}} disabled />
        </SettingRow>

        <div className="p-4 bg-surface rounded-xl border border-border text-xs text-text-muted leading-relaxed">
          <IconTerminal size={14} className="inline mr-2 mb-0.5" />
          Note: System Tray is critical for native Media Session integration and
          background playback on some OS.
        </div>
      </SettingSection>
    </div>
  );
}
