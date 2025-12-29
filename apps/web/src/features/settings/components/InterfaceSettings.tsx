import { SettingSection, SettingRow, Switch } from "@sonantica/ui";

export function InterfaceSettings() {
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
          <div className="bg-surface p-2 rounded text-sm px-4 border border-border">
            Dark (Default)
          </div>
        </SettingRow>

        <SettingRow
          label="Animations"
          description="Enable fluid transitions and effects."
        >
          <Switch checked={true} onChange={() => {}} />
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
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>

        <SettingRow
          label="System Tray"
          description="Minimize to tray instead of closing (Desktop only)."
        >
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
