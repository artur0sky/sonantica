import { SettingSection, SettingRow, Switch } from "@sonantica/ui";
import { useSettingsStore } from "../../../stores/settingsStore";

export function InterfaceSettings() {
  const { animations, toggle } = useSettingsStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 delay-200">
      <SettingSection
        title="Appearance"
        description="Customize the look and feel of Sonántica."
      >
        <SettingRow
          label="Animations"
          description="Enable fluid transitions and effects."
        >
          <Switch checked={animations} onChange={() => toggle("animations")} />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
