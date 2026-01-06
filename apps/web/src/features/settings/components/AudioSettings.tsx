import { SettingSection, SettingRow, Switch, Select } from "@sonantica/ui";
import { useSettingsStore } from "../../../stores/settingsStore";

export function AudioSettings() {
  const {
    exclusiveMode,
    gaplessPlayback,
    replayGain,
    soxResampler,
    playbackBufferSize,
    toggle,
    setNumber,
  } = useSettingsStore();

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
          label="Exclusive Mode"
          description="Take exclusive control of the audio device for bit-perfect playback (Windows/macOS)."
        >
          <Switch
            checked={exclusiveMode}
            onChange={() => toggle("exclusiveMode")}
          />
        </SettingRow>

        <SettingRow
          label="Gapless Playback"
          description="Eliminate silence between tracks."
        >
          <Switch
            checked={gaplessPlayback}
            onChange={() => toggle("gaplessPlayback")}
          />
        </SettingRow>

        <SettingRow
          label="Playback Buffer"
          description="Amount of audio to cache ahead. Higher values reduce stuttering but use more RAM."
        >
          <div className="w-full sm:w-64">
            <Select
              options={bufferOptions}
              value={playbackBufferSize.toString()}
              onChange={(e) =>
                setNumber("playbackBufferSize", parseInt(e.target.value))
              }
            />
          </div>
        </SettingRow>

        <SettingRow
          label="Crossfade"
          description="Smoothly fade between tracks."
        >
          <div className="w-full sm:w-32">
            {/* Mock Select for now */}
            <div className="bg-surface p-2 rounded text-sm text-center border border-border">
              Disabled
            </div>
          </div>
        </SettingRow>
      </SettingSection>

      <SettingSection
        title="Volume & Normalization"
        description="Manage audio levels and dynamic range."
      >
        <SettingRow
          label="ReplayGain"
          description="Normalize volume across tracks to a standard level."
        >
          <Switch checked={replayGain} onChange={() => toggle("replayGain")} />
        </SettingRow>

        <SettingRow
          label="Pre-Amp"
          description="Adjust the base gain for the equalizer."
        >
          <div className="text-sm text-text-muted">0 dB</div>
        </SettingRow>
      </SettingSection>

      <SettingSection
        title="High Fidelity"
        description="Settings for audiophiles."
      >
        <SettingRow
          label="SoX Resampler"
          description="Use high-quality resampling (uses more CPU)."
        >
          <Switch
            checked={soxResampler}
            onChange={() => toggle("soxResampler")}
          />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
