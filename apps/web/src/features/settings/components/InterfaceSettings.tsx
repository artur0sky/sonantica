import { SettingSection, SettingRow, Switch } from "@sonantica/ui";
import { useSettingsStore } from "../../../stores/settingsStore";

export function InterfaceSettings() {
  const { animations, showSidebarOnStartup, toggle, theme } =
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
          <div className="w-full sm:w-auto bg-surface p-2 rounded text-sm px-4 border border-border capitalize text-center sm:text-left">
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
          <div className="w-full sm:w-auto bg-surface p-2 rounded text-sm px-4 border border-border text-center sm:text-left">
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
      </SettingSection>
    </div>
  );
}
