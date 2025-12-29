import { SettingSection, SettingRow, Switch } from "@sonantica/ui";
import { useSettingsStore } from "../../../stores/settingsStore";

export function InterfaceSettings() {
  const { animations, showSidebarOnStartup, minimizeToTray, toggle, theme } =
    useSettingsStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 delay-200">
      <SettingSection
        title="Appearance"
        description="Customize the look and feel of Sonántica."
      >
        <SettingRow
          label="Theme"
          description="Choose your preferred visual style."
        >
          {/* Mock Select */}
          <div className="bg-surface p-2 rounded text-sm px-4 border border-border capitalize">
            {theme}
          </div>
        </SettingRow>

        <SettingRow
          label="Animations"
          description="Enable fluid transitions and effects."
        >
          <Switch checked={animations} onChange={() => toggle("animations")} />
        </SettingRow>

        <SettingRow
          label="Cover Art Size"
          description="Default size of album covers in lists."
        >
          <div className="bg-surface p-2 rounded text-sm px-4 border border-border">
            Medium
          </div>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Behavior">
        <SettingRow
          label="Show Sidebar on Startup"
          description="Keep the navigation sidebar open by default."
        >
          <Switch
            checked={showSidebarOnStartup}
            onChange={() => toggle("showSidebarOnStartup")}
          />
        </SettingRow>

        <SettingRow
          label="System Tray"
          description="Minimize to tray instead of closing (Desktop only)."
        >
          <Switch
            checked={minimizeToTray}
            onChange={() => toggle("minimizeToTray")}
          />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
