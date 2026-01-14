import { SettingSection, SettingRow, Select } from "@sonantica/ui";
import { useSettingsStore } from "../../../stores/settingsStore";
import { usePlayerStore } from "@sonantica/player-core";

export function AudioSettings() {
  const { playbackBufferSize, setNumber } = useSettingsStore();

  const playerUpdateBufferConfig = usePlayerStore((s) => s.updateBufferConfig);

  const bufferOptions = [
    { value: (10 * 1024 * 1024).toString(), label: "10 MB (Low RAM)" },
    { value: (50 * 1024 * 1024).toString(), label: "50 MB (Standard)" },
    { value: (200 * 1024 * 1024).toString(), label: "200 MB (High Quality)" },
    { value: (500 * 1024 * 1024).toString(), label: "500 MB (Very High)" },
    { value: (1024 * 1024 * 1024).toString(), label: "1 GB (Max Performance)" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SettingSection
        title="Playback Engine"
        description="Configure how Sonántica processes and outputs audio."
      >
        <SettingRow
          label="Playback Buffer"
          description="Amount of audio to cache ahead. Higher values reduce stuttering but use more RAM."
        >
          <div className="w-full sm:w-56">
            <Select
              options={bufferOptions}
              value={playbackBufferSize.toString()}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setNumber("playbackBufferSize", val);
                playerUpdateBufferConfig({ maxCacheSize: val / (1024 * 1024) });
              }}
            />
          </div>
        </SettingRow>
      </SettingSection>
    </div>
  );
}
