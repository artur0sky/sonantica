import { SettingSection, SettingRow, Switch } from "@sonantica/ui";
import { useSettingsStore } from "../../../stores/settingsStore";

export function OfflineSettings() {
  const {
    offlineMode,
    hideUnavailableOffline,
    downloadQuality,
    toggle,
    setDownloadQuality,
  } = useSettingsStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 delay-200">
      <SettingSection
        title="Offline Mode"
        description="Manage offline playback and downloads."
      >
        <SettingRow
          label="Offline Mode"
          description="Only show and play tracks available offline."
        >
          <Switch
            checked={offlineMode}
            onChange={() => toggle("offlineMode")}
          />
        </SettingRow>

        <SettingRow
          label="Hide Unavailable Tracks"
          description="Hide tracks that aren't downloaded when in offline mode."
        >
          <Switch
            checked={hideUnavailableOffline}
            onChange={() => toggle("hideUnavailableOffline")}
          />
        </SettingRow>
      </SettingSection>

      <SettingSection
        title="Download Settings"
        description="Configure download quality and behavior."
      >
        <SettingRow
          label="Download Quality"
          description="Quality to use when downloading tracks for offline playback."
        >
          <select
            value={downloadQuality}
            onChange={(e) => setDownloadQuality(e.target.value as any)}
            className="w-full sm:w-auto bg-surface p-2 rounded text-sm px-4 border border-border min-w-[140px] focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="original">Original (Lossless)</option>
            <option value="high">High (320kbps)</option>
            <option value="normal">Normal (192kbps)</option>
            <option value="low">Low (128kbps)</option>
          </select>
        </SettingRow>
      </SettingSection>
    </div>
  );
}
